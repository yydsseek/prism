const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [30, '用户名最多30个字符'],
    match: [/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'],
    sparse: true // 允许为空但不能重复
  },
  phone: {
    type: String,
    required: [true, '手机号是必需的'],
    unique: true,
    trim: true,
    match: [/^1[3-9]\d{9}$/, '请输入有效的手机号']
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址'],
    sparse: true // 允许为空但不能重复
  },
  password: {
    type: String,
    required: [true, '密码是必需的'],
    minlength: [8, '密码至少8个字符'],
    select: false
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: [50, '显示名称最多50个字符']
  },
  nickname: {
    type: String,
    trim: true,
    maxlength: [20, '昵称最多20个字符']
  },
  bio: {
    type: String,
    maxlength: [500, '个人简介最多500个字符'],
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    match: [/^https?:\/\/.+/, '请输入有效的网站地址'],
    default: ''
  },
  socialLinks: {
    twitter: String,
    linkedin: String,
    github: String,
    wechat: String
  },
  // 工作信息
  workInfo: {
    position: String,
    company: String,
    industry: String,
    experience: String,
    yearsOfExperience: {
      type: Number,
      min: 0,
      max: 50
    }
  },
  // 投资信息
  investmentInfo: {
    experience: String,
    industries: [String],
    investmentStage: [String],
    investmentSize: String,
    yearsOfExperience: {
      type: Number,
      min: 0,
      max: 50
    }
  },
  isCreator: {
    type: Boolean,
    default: false
  },
  creatorProfile: {
    title: String,
    description: String,
    subscriptionPrice: {
      type: Number,
      default: 0,
      min: [0, '订阅价格不能为负数']
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  // 验证码相关
  verificationCode: String,
  verificationCodeExpires: Date,
  verificationCodeType: {
    type: String,
    enum: ['register', 'login', 'reset_password', 'change_phone']
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    newsletter: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: true
    }
  },
  stripeCustomerId: String,
  stripeAccountId: String,
  // 微信相关
  wechatOpenId: String,
  wechatUnionId: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.virtual('subscriberCount', {
  ref: 'Subscription',
  localField: '_id',
  foreignField: 'creator',
  count: true
});

userSchema.virtual('postCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author',
  count: true
});

// 索引
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ isCreator: 1 });
userSchema.index({ 'creatorProfile.isActive': 1 });
userSchema.index({ wechatOpenId: 1 });

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 实例方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incrementLoginAttempts = function() {
  // 如果账户被锁定且锁定时间已过，重置尝试次数
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // 如果尝试次数达到5次，锁定账户1小时
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// 检查资料完善状态
userSchema.methods.checkProfileCompletion = function() {
  const missingFields = [];
  
  if (!this.nickname) missingFields.push('nickname');
  if (!this.bio) missingFields.push('bio');
  
  // 检查工作信息（如果开始填写则需要完整）
  const workFields = ['position', 'company', 'industry'];
  const hasWorkInfo = workFields.some(field => this.workInfo?.[field]);
  if (hasWorkInfo) {
    workFields.forEach(field => {
      if (!this.workInfo?.[field]) {
        missingFields.push(`workInfo.${field}`);
      }
    });
  }
  
  // 检查投资信息（如果开始填写则需要完整）
  const hasInvestmentInfo = this.investmentInfo?.experience || 
                           this.investmentInfo?.industries?.length || 
                           this.investmentInfo?.investmentStage?.length;
  if (hasInvestmentInfo) {
    if (!this.investmentInfo?.experience) missingFields.push('investmentInfo.experience');
    if (!this.investmentInfo?.industries?.length) missingFields.push('investmentInfo.industries');
    if (!this.investmentInfo?.investmentStage?.length) missingFields.push('investmentInfo.investmentStage');
  }
  
  const profileCompleted = missingFields.length === 0 && !!this.nickname;
  
  return {
    profileCompleted,
    missingFields
  };
};

// 静态方法
userSchema.statics.findByPhone = function(phone) {
  return this.findOne({ phone });
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username.toLowerCase() });
};

userSchema.statics.findByWechatOpenId = function(openId) {
  return this.findOne({ wechatOpenId: openId });
};

// 查询中间件
userSchema.pre(/^find/, function(next) {
  this.select('-__v');
  next();
});

module.exports = mongoose.model('User', userSchema); 