const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // 接收通知的用户
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 通知类型
  type: {
    type: String,
    enum: [
      'new_post',           // 新文章发布
      'new_subscriber',     // 新订阅者
      'subscription_expiry', // 订阅即将到期
      'payment_success',    // 支付成功
      'payment_failed',     // 支付失败
      'comment',            // 评论
      'like',               // 点赞
      'system',             // 系统通知
      'creator_update',     // 创作者更新
      'subscription_cancelled', // 订阅取消
      'welcome'             // 欢迎通知
    ],
    required: true,
    index: true
  },
  
  // 通知标题
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  
  // 通知内容
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // 相关数据
  data: {
    // 相关用户ID
    userId: mongoose.Schema.Types.ObjectId,
    // 相关文章ID
    postId: mongoose.Schema.Types.ObjectId,
    // 相关订阅ID
    subscriptionId: mongoose.Schema.Types.ObjectId,
    // 相关支付ID
    paymentId: mongoose.Schema.Types.ObjectId,
    // 相关评论ID
    commentId: mongoose.Schema.Types.ObjectId,
    // 链接地址
    url: String,
    // 其他自定义数据
    extra: mongoose.Schema.Types.Mixed
  },
  
  // 是否已读
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // 阅读时间
  readAt: Date,
  
  // 优先级
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // 通知渠道
  channels: {
    // 站内通知
    inApp: {
      type: Boolean,
      default: true
    },
    // 邮件通知
    email: {
      type: Boolean,
      default: false
    },
    // 短信通知
    sms: {
      type: Boolean,
      default: false
    },
    // 推送通知
    push: {
      type: Boolean,
      default: false
    }
  },
  
  // 发送状态
  sendStatus: {
    inApp: {
      sent: { type: Boolean, default: true },
      sentAt: Date
    },
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    }
  },
  
  // 过期时间
  expiresAt: Date,
  
  // 是否删除
  deleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
});

// 索引
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 实例方法
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsDeleted = function() {
  this.deleted = true;
  return this.save();
};

// 静态方法
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  
  // 这里可以添加实时推送逻辑
  // 例如：WebSocket、Server-Sent Events等
  
  return notification;
};

notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { user: userId, read: false },
    { read: true, readAt: new Date() }
  );
};

notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ user: userId, read: false, deleted: false });
};

notificationSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { deleted: true, updatedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // 删除30天前的已删除通知
    ]
  });
  
  console.log(`清理过期通知: ${result.deletedCount} 条`);
  return result;
};

// 查询中间件
notificationSchema.pre(/^find/, function(next) {
  this.where({ deleted: { $ne: true } });
  next();
});

// 通知模板
notificationSchema.statics.templates = {
  new_post: {
    title: '新文章发布',
    content: '{creatorName} 发布了新文章《{postTitle}》',
    channels: { inApp: true, email: true }
  },
  new_subscriber: {
    title: '新订阅者',
    content: '{subscriberName} 订阅了您的内容',
    channels: { inApp: true }
  },
  subscription_expiry: {
    title: '订阅即将到期',
    content: '您对 {creatorName} 的订阅将在 {days} 天后到期',
    channels: { inApp: true, email: true }
  },
  payment_success: {
    title: '支付成功',
    content: '您已成功支付 ¥{amount}，订阅 {creatorName}',
    channels: { inApp: true, email: true }
  },
  payment_failed: {
    title: '支付失败',
    content: '订阅 {creatorName} 的支付失败，请重试',
    channels: { inApp: true, email: true }
  },
  comment: {
    title: '新评论',
    content: '{commenterName} 评论了您的文章《{postTitle}》',
    channels: { inApp: true }
  },
  like: {
    title: '新点赞',
    content: '{likerName} 点赞了您的文章《{postTitle}》',
    channels: { inApp: true }
  },
  welcome: {
    title: '欢迎加入 Prism',
    content: '欢迎您加入 Prism 平台！快来完善您的个人资料吧',
    channels: { inApp: true }
  }
};

// 创建通知的便捷方法
notificationSchema.statics.createFromTemplate = async function(templateType, userId, variables = {}, options = {}) {
  const template = this.templates[templateType];
  if (!template) {
    throw new Error(`未知的通知模板类型: ${templateType}`);
  }
  
  // 替换变量
  let title = template.title;
  let content = template.content;
  
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{${key}}`, 'g');
    title = title.replace(regex, variables[key]);
    content = content.replace(regex, variables[key]);
  });
  
  const notificationData = {
    user: userId,
    type: templateType,
    title,
    content,
    channels: { ...template.channels, ...options.channels },
    data: options.data || {},
    priority: options.priority || 'normal',
    expiresAt: options.expiresAt
  };
  
  return this.createNotification(notificationData);
};

module.exports = mongoose.model('Notification', notificationSchema); 