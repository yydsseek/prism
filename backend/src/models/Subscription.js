const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  subscriber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '订阅者是必需的']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '创作者是必需的']
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'pending'],
    default: 'pending'
  },
  plan: {
    type: String,
    enum: ['free', 'monthly', 'yearly'],
    default: 'free'
  },
  amount: {
    type: Number,
    default: 0,
    min: [0, '金额不能为负数']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'CNY', 'EUR']
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  nextBillingDate: {
    type: Date
  },
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'manual'],
    default: 'stripe'
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  cancelledAt: Date,
  cancellationReason: String,
  refunded: {
    type: Boolean,
    default: false
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段
subscriptionSchema.virtual('isActive').get(function() {
  if (this.status !== 'active') return false;
  if (this.endDate && this.endDate < new Date()) return false;
  return true;
});

subscriptionSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// 索引
subscriptionSchema.index({ subscriber: 1, creator: 1 }, { unique: true });
subscriptionSchema.index({ creator: 1, status: 1 });
subscriptionSchema.index({ subscriber: 1, status: 1 });
subscriptionSchema.index({ status: 1, nextBillingDate: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });

// 中间件
subscriptionSchema.pre('save', function(next) {
  // 如果是免费订阅，设置状态为active
  if (this.plan === 'free' && this.status === 'pending') {
    this.status = 'active';
  }
  
  // 设置结束日期
  if (this.isModified('startDate') || this.isModified('plan')) {
    if (this.plan === 'monthly') {
      this.endDate = new Date(this.startDate);
      this.endDate.setMonth(this.endDate.getMonth() + 1);
      this.nextBillingDate = new Date(this.endDate);
    } else if (this.plan === 'yearly') {
      this.endDate = new Date(this.startDate);
      this.endDate.setFullYear(this.endDate.getFullYear() + 1);
      this.nextBillingDate = new Date(this.endDate);
    }
  }
  
  next();
});

// 静态方法
subscriptionSchema.statics.findActive = function() {
  return this.find({ 
    status: 'active',
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gt: new Date() } }
    ]
  });
};

subscriptionSchema.statics.findBySubscriber = function(subscriberId) {
  return this.find({ subscriber: subscriberId });
};

subscriptionSchema.statics.findByCreator = function(creatorId) {
  return this.find({ creator: creatorId });
};

subscriptionSchema.statics.findActiveByCreator = function(creatorId) {
  return this.find({ 
    creator: creatorId,
    status: 'active',
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gt: new Date() } }
    ]
  });
};

subscriptionSchema.statics.findExpiringSoon = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'active',
    endDate: { $lte: futureDate, $gt: new Date() }
  });
};

// 实例方法
subscriptionSchema.methods.cancel = function(reason = '') {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  this.autoRenew = false;
  return this.save();
};

subscriptionSchema.methods.renew = function() {
  if (this.plan === 'free') return this;
  
  this.startDate = new Date();
  if (this.plan === 'monthly') {
    this.endDate = new Date();
    this.endDate.setMonth(this.endDate.getMonth() + 1);
  } else if (this.plan === 'yearly') {
    this.endDate = new Date();
    this.endDate.setFullYear(this.endDate.getFullYear() + 1);
  }
  
  this.nextBillingDate = new Date(this.endDate);
  this.status = 'active';
  return this.save();
};

subscriptionSchema.methods.refund = function(amount) {
  this.refunded = true;
  this.refundAmount = amount || this.amount;
  return this.save();
};

// 查询中间件
subscriptionSchema.pre(/^find/, function(next) {
  this.populate([
    {
      path: 'subscriber',
      select: 'username displayName avatar email'
    },
    {
      path: 'creator',
      select: 'username displayName avatar bio creatorProfile'
    }
  ]);
  next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema); 