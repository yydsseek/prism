const express = require('express');
const { body, validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// 创建支付意图
router.post('/create-payment-intent', [
  body('amount')
    .isFloat({ min: 0.5 })
    .withMessage('金额必须大于0.5'),
  body('currency')
    .optional()
    .isIn(['usd', 'cny', 'eur'])
    .withMessage('不支持的货币类型'),
  body('subscriptionId')
    .optional()
    .isMongoId()
    .withMessage('订阅ID无效')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { amount, currency = 'usd', subscriptionId } = req.body;

  try {
    // 创建或获取Stripe客户
    let customer;
    if (req.user.stripeCustomerId) {
      customer = await stripe.customers.retrieve(req.user.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.displayName,
        metadata: {
          userId: req.user._id.toString()
        }
      });

      // 更新用户的Stripe客户ID
      await User.findByIdAndUpdate(req.user._id, {
        stripeCustomerId: customer.id
      });
    }

    // 创建支付意图
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // 转换为分
      currency,
      customer: customer.id,
      metadata: {
        userId: req.user._id.toString(),
        subscriptionId: subscriptionId || ''
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    console.error('创建支付意图失败:', error);
    res.status(500).json({
      success: false,
      message: '创建支付失败'
    });
  }
}));

// 创建订阅
router.post('/create-subscription', [
  body('priceId')
    .notEmpty()
    .withMessage('价格ID不能为空'),
  body('creatorId')
    .isMongoId()
    .withMessage('创作者ID无效')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { priceId, creatorId } = req.body;

  try {
    // 创建或获取Stripe客户
    let customer;
    if (req.user.stripeCustomerId) {
      customer = await stripe.customers.retrieve(req.user.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.displayName,
        metadata: {
          userId: req.user._id.toString()
        }
      });

      await User.findByIdAndUpdate(req.user._id, {
        stripeCustomerId: customer.id
      });
    }

    // 创建订阅
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: req.user._id.toString(),
        creatorId
      }
    });

    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret
      }
    });
  } catch (error) {
    console.error('创建订阅失败:', error);
    res.status(500).json({
      success: false,
      message: '创建订阅失败'
    });
  }
}));

// 取消订阅
router.post('/cancel-subscription/:subscriptionId', asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;

  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);

    res.json({
      success: true,
      message: '订阅已取消',
      data: { subscription }
    });
  } catch (error) {
    console.error('取消订阅失败:', error);
    res.status(500).json({
      success: false,
      message: '取消订阅失败'
    });
  }
}));

// 获取支付历史
router.get('/history', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  try {
    if (!req.user.stripeCustomerId) {
      return res.json({
        success: true,
        data: {
          payments: [],
          pagination: {
            current: parseInt(page),
            pages: 0,
            total: 0
          }
        }
      });
    }

    const payments = await stripe.paymentIntents.list({
      customer: req.user.stripeCustomerId,
      limit: parseInt(limit),
      starting_after: page > 1 ? (page - 1) * limit : undefined
    });

    res.json({
      success: true,
      data: {
        payments: payments.data,
        pagination: {
          current: parseInt(page),
          hasMore: payments.has_more,
          total: payments.data.length
        }
      }
    });
  } catch (error) {
    console.error('获取支付历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取支付历史失败'
    });
  }
}));

// Stripe Webhook处理
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook签名验证失败:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const Subscription = require('../models/Subscription');

  // 处理事件
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('支付成功:', paymentIntent.id);
      
      // 更新订阅状态
      if (paymentIntent.metadata.subscriptionId) {
        await Subscription.findByIdAndUpdate(
          paymentIntent.metadata.subscriptionId,
          { 
            status: 'active',
            stripeSubscriptionId: paymentIntent.id
          }
        );
      }
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      console.log('订阅续费成功:', invoice.subscription);
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      console.log('订阅续费失败:', failedInvoice.subscription);
      
      // 更新订阅状态
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: failedInvoice.subscription },
        { status: 'expired' }
      );
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      console.log('订阅已删除:', deletedSubscription.id);
      
      // 更新订阅状态
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: deletedSubscription.id },
        { status: 'cancelled' }
      );
      break;

    default:
      console.log(`未处理的事件类型: ${event.type}`);
  }

  res.json({ received: true });
}));

// 获取可用的支付方式
router.get('/payment-methods', asyncHandler(async (req, res) => {
  try {
    if (!req.user.stripeCustomerId) {
      return res.json({
        success: true,
        data: { paymentMethods: [] }
      });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: req.user.stripeCustomerId,
      type: 'card'
    });

    res.json({
      success: true,
      data: { paymentMethods: paymentMethods.data }
    });
  } catch (error) {
    console.error('获取支付方式失败:', error);
    res.status(500).json({
      success: false,
      message: '获取支付方式失败'
    });
  }
}));

// 添加支付方式
router.post('/payment-methods', [
  body('paymentMethodId')
    .notEmpty()
    .withMessage('支付方式ID不能为空')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { paymentMethodId } = req.body;

  try {
    if (!req.user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: '请先创建客户账户'
      });
    }

    // 将支付方式附加到客户
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: req.user.stripeCustomerId,
    });

    res.json({
      success: true,
      message: '支付方式添加成功'
    });
  } catch (error) {
    console.error('添加支付方式失败:', error);
    res.status(500).json({
      success: false,
      message: '添加支付方式失败'
    });
  }
}));

module.exports = router; 