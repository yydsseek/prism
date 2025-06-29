const express = require('express');
const { body, validationResult } = require('express-validator');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSubscriptionConfirmation, sendSubscriptionCancellation } = require('../services/emailService');

const router = express.Router();

// 获取订阅列表
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status = 'active' } = req.query;

  const query = { subscriber: req.user._id };
  if (status !== 'all') {
    query.status = status;
  }

  const subscriptions = await Subscription.find(query)
    .populate('creator', 'username displayName avatar bio creatorProfile')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Subscription.countDocuments(query);

  res.json({
    success: true,
    data: {
      subscriptions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
}));

// 订阅创作者
router.post('/', [
  body('creatorId')
    .isMongoId()
    .withMessage('创作者ID无效'),
  body('plan')
    .isIn(['free', 'monthly', 'yearly'])
    .withMessage('订阅计划无效')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { creatorId, plan } = req.body;

  // 检查是否订阅自己
  if (creatorId === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: '不能订阅自己'
    });
  }

  // 检查创作者是否存在且已激活
  const creator = await User.findById(creatorId);
  if (!creator || !creator.isCreator || !creator.creatorProfile.isActive) {
    return res.status(404).json({
      success: false,
      message: '创作者不存在或未激活'
    });
  }

  // 检查是否已经订阅
  const existingSubscription = await Subscription.findOne({
    subscriber: req.user._id,
    creator: creatorId
  });

  if (existingSubscription) {
    return res.status(400).json({
      success: false,
      message: '您已经订阅了此创作者'
    });
  }

  // 计算订阅金额
  let amount = 0;
  if (plan === 'monthly') {
    amount = creator.creatorProfile.subscriptionPrice;
  } else if (plan === 'yearly') {
    amount = creator.creatorProfile.subscriptionPrice * 12 * 0.8; // 年付8折
  }

  // 创建订阅
  const subscription = await Subscription.create({
    subscriber: req.user._id,
    creator: creatorId,
    plan,
    amount,
    currency: 'USD'
  });

  await subscription.populate([
    {
      path: 'subscriber',
      select: 'username displayName email'
    },
    {
      path: 'creator',
      select: 'username displayName email creatorProfile'
    }
  ]);

  // 发送确认邮件
  try {
    await sendSubscriptionConfirmation(
      req.user.email,
      creator.displayName,
      plan,
      amount
    );
  } catch (error) {
    console.error('发送订阅确认邮件失败:', error);
  }

  res.status(201).json({
    success: true,
    message: '订阅成功',
    data: { subscription }
  });
}));

// 取消订阅
router.put('/:subscriptionId/cancel', asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;
  const { reason } = req.body;

  const subscription = await Subscription.findOne({
    _id: subscriptionId,
    subscriber: req.user._id
  });

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: '订阅不存在'
    });
  }

  if (subscription.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: '订阅已经取消'
    });
  }

  await subscription.cancel(reason);

  await subscription.populate([
    {
      path: 'subscriber',
      select: 'username displayName email'
    },
    {
      path: 'creator',
      select: 'username displayName email'
    }
  ]);

  // 发送取消邮件
  try {
    await sendSubscriptionCancellation(
      req.user.email,
      subscription.creator.displayName
    );
  } catch (error) {
    console.error('发送取消订阅邮件失败:', error);
  }

  res.json({
    success: true,
    message: '订阅已取消',
    data: { subscription }
  });
}));

// 续订订阅
router.put('/:subscriptionId/renew', asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;

  const subscription = await Subscription.findOne({
    _id: subscriptionId,
    subscriber: req.user._id
  });

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: '订阅不存在'
    });
  }

  if (subscription.status === 'active' && subscription.isActive) {
    return res.status(400).json({
      success: false,
      message: '订阅仍然有效'
    });
  }

  await subscription.renew();

  await subscription.populate([
    {
      path: 'subscriber',
      select: 'username displayName email'
    },
    {
      path: 'creator',
      select: 'username displayName email creatorProfile'
    }
  ]);

  res.json({
    success: true,
    message: '订阅续订成功',
    data: { subscription }
  });
}));

// 获取创作者信息
router.get('/creator/:creatorId', asyncHandler(async (req, res) => {
  const { creatorId } = req.params;

  const creator = await User.findById(creatorId)
    .select('username displayName avatar bio creatorProfile')
    .populate('subscriberCount')
    .populate('postCount');

  if (!creator || !creator.isCreator) {
    return res.status(404).json({
      success: false,
      message: '创作者不存在'
    });
  }

  // 检查当前用户是否已订阅
  let userSubscription = null;
  if (req.user) {
    userSubscription = await Subscription.findOne({
      subscriber: req.user._id,
      creator: creatorId
    });
  }

  res.json({
    success: true,
    data: {
      creator,
      userSubscription
    }
  });
}));

// 获取订阅统计
router.get('/stats', asyncHandler(async (req, res) => {
  const [activeSubscriptions, totalSpent, expiringSoon] = await Promise.all([
    Subscription.countDocuments({
      subscriber: req.user._id,
      status: 'active'
    }),
    Subscription.aggregate([
      { $match: { subscriber: req.user._id, status: 'active' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Subscription.findExpiringSoon(7).countDocuments({
      subscriber: req.user._id
    })
  ]);

  const stats = {
    activeSubscriptions,
    totalSpent: totalSpent[0]?.total || 0,
    expiringSoon
  };

  res.json({
    success: true,
    data: { stats }
  });
}));

module.exports = router; 