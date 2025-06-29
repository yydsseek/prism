const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const Notification = require('../models/Notification');

const router = express.Router();

// 获取通知列表
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  const skip = (page - 1) * limit;

  const query = { user: req.user._id };
  if (unreadOnly === 'true') {
    query.read = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  const total = await Notification.countDocuments(query);

  res.json({
    success: true,
    data: {
      notifications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasMore: skip + notifications.length < total
      }
    }
  });
}));

// 标记通知为已读
router.put('/:id/read', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findOne({
    _id: id,
    user: req.user._id
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: '通知不存在'
    });
  }

  await notification.markAsRead();

  res.json({
    success: true,
    message: '通知已标记为已读',
    data: { notification }
  });
}));

// 标记所有通知为已读
router.put('/read-all', asyncHandler(async (req, res) => {
  const result = await Notification.markAllAsRead(req.user._id);

  res.json({
    success: true,
    message: `已标记 ${result.modifiedCount} 条通知为已读`,
    data: { count: result.modifiedCount }
  });
}));

// 删除通知
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findOne({
    _id: id,
    user: req.user._id
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: '通知不存在'
    });
  }

  await notification.markAsDeleted();

  res.json({
    success: true,
    message: '通知已删除'
  });
}));

// 获取未读通知数量
router.get('/unread-count', asyncHandler(async (req, res) => {
  const count = await Notification.getUnreadCount(req.user._id);

  res.json({
    success: true,
    data: { count }
  });
}));

// 更新通知偏好设置
router.put('/preferences', [
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('邮件通知设置无效'),
  body('pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('推送通知设置无效'),
  body('newsletter')
    .optional()
    .isBoolean()
    .withMessage('新闻通讯设置无效'),
  body('smsNotifications')
    .optional()
    .isBoolean()
    .withMessage('短信通知设置无效')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { emailNotifications, pushNotifications, newsletter, smsNotifications } = req.body;

  const updateData = {};
  if (emailNotifications !== undefined) updateData['preferences.emailNotifications'] = emailNotifications;
  if (pushNotifications !== undefined) updateData['preferences.pushNotifications'] = pushNotifications;
  if (newsletter !== undefined) updateData['preferences.newsletter'] = newsletter;
  if (smsNotifications !== undefined) updateData['preferences.smsNotifications'] = smsNotifications;

  const User = require('../models/User');
  const user = await User.findByIdAndUpdate(
    req.user._id, 
    updateData,
    { new: true }
  ).select('-password');

  res.json({
    success: true,
    message: '通知偏好设置已更新',
    data: { user }
  });
}));

// 创建通知（管理员或系统使用）
router.post('/', [
  body('type')
    .isIn([
      'new_post', 'new_subscriber', 'subscription_expiry', 'payment_success',
      'payment_failed', 'comment', 'like', 'system', 'creator_update',
      'subscription_cancelled', 'welcome'
    ])
    .withMessage('通知类型无效'),
  body('title')
    .isLength({ min: 1, max: 100 })
    .withMessage('通知标题长度必须在1-100个字符之间'),
  body('content')
    .isLength({ min: 1, max: 500 })
    .withMessage('通知内容长度必须在1-500个字符之间'),
  body('userId')
    .isMongoId()
    .withMessage('用户ID无效')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { type, title, content, userId, data, priority, channels } = req.body;

  const notification = await Notification.createNotification({
    user: userId,
    type,
    title,
    content,
    data: data || {},
    priority: priority || 'normal',
    channels: channels || { inApp: true }
  });

  res.status(201).json({
    success: true,
    message: '通知创建成功',
    data: { notification }
  });
}));

// 批量创建通知（管理员使用）
router.post('/batch', [
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('用户ID列表不能为空'),
  body('userIds.*')
    .isMongoId()
    .withMessage('用户ID格式无效'),
  body('type')
    .isIn([
      'new_post', 'new_subscriber', 'subscription_expiry', 'payment_success',
      'payment_failed', 'comment', 'like', 'system', 'creator_update',
      'subscription_cancelled', 'welcome'
    ])
    .withMessage('通知类型无效'),
  body('title')
    .isLength({ min: 1, max: 100 })
    .withMessage('通知标题长度必须在1-100个字符之间'),
  body('content')
    .isLength({ min: 1, max: 500 })
    .withMessage('通知内容长度必须在1-500个字符之间')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { userIds, type, title, content, data, priority, channels } = req.body;

  const notifications = [];
  for (const userId of userIds) {
    try {
      const notification = await Notification.createNotification({
        user: userId,
        type,
        title,
        content,
        data: data || {},
        priority: priority || 'normal',
        channels: channels || { inApp: true }
      });
      notifications.push(notification);
    } catch (error) {
      console.error(`创建通知失败 - 用户ID: ${userId}`, error);
    }
  }

  res.status(201).json({
    success: true,
    message: `批量创建通知成功，共创建 ${notifications.length} 条通知`,
    data: { notifications, count: notifications.length }
  });
}));

// 使用模板创建通知
router.post('/template', [
  body('templateType')
    .isIn([
      'new_post', 'new_subscriber', 'subscription_expiry', 'payment_success',
      'payment_failed', 'comment', 'like', 'welcome'
    ])
    .withMessage('模板类型无效'),
  body('userId')
    .isMongoId()
    .withMessage('用户ID无效'),
  body('variables')
    .optional()
    .isObject()
    .withMessage('变量必须是对象格式')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { templateType, userId, variables, options } = req.body;

  try {
    const notification = await Notification.createFromTemplate(
      templateType,
      userId,
      variables || {},
      options || {}
    );

    res.status(201).json({
      success: true,
      message: '通知创建成功',
      data: { notification }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}));

// 清理过期通知（管理员使用）
router.post('/cleanup', asyncHandler(async (req, res) => {
  // 这里应该添加管理员权限检查
  const result = await Notification.cleanupExpired();

  res.json({
    success: true,
    message: `清理完成，删除了 ${result.deletedCount} 条过期通知`,
    data: { deletedCount: result.deletedCount }
  });
}));

// 获取通知统计
router.get('/stats', asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [totalCount, unreadCount, todayCount] = await Promise.all([
    Notification.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, read: false }),
    Notification.countDocuments({
      user: userId,
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    })
  ]);

  // 按类型统计
  const typeStats = await Notification.aggregate([
    { $match: { user: userId } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.json({
    success: true,
    data: {
      totalCount,
      unreadCount,
      todayCount,
      typeStats
    }
  });
}));

module.exports = router; 