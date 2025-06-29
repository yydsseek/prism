const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  // 标签名称
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  
  // 标签slug（用于URL）
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  
  // 标签描述
  description: {
    type: String,
    maxlength: 500
  },
  
  // 标签颜色
  color: {
    type: String,
    default: '#6366f1',
    match: /^#[0-9A-F]{6}$/i
  },
  
  // 标签图标
  icon: String,
  
  // 文章数量
  postCount: {
    type: Number,
    default: 0
  },
  
  // 关注者数量
  followerCount: {
    type: Number,
    default: 0
  },
  
  // 是否热门标签
  isPopular: {
    type: Boolean,
    default: false
  },
  
  // 是否推荐标签
  isRecommended: {
    type: Boolean,
    default: false
  },
  
  // 创建者
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 标签状态
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
tagSchema.index({ name: 1 });
tagSchema.index({ slug: 1 });
tagSchema.index({ postCount: -1 });
tagSchema.index({ followerCount: -1 });
tagSchema.index({ isPopular: 1, postCount: -1 });

// 虚拟字段
tagSchema.virtual('isHot').get(function() {
  return this.postCount > 100 || this.followerCount > 1000;
});

// 静态方法
tagSchema.statics.getPopularTags = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ postCount: -1, followerCount: -1 })
    .limit(limit);
};

tagSchema.statics.getRecommendedTags = function(limit = 10) {
  return this.find({ status: 'active', isRecommended: true })
    .sort({ postCount: -1 })
    .limit(limit);
};

tagSchema.statics.searchTags = function(query, limit = 20) {
  return this.find({
    status: 'active',
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ]
  })
  .sort({ postCount: -1 })
  .limit(limit);
};

// 实例方法
tagSchema.methods.incrementPostCount = function() {
  this.postCount += 1;
  return this.save();
};

tagSchema.methods.decrementPostCount = function() {
  if (this.postCount > 0) {
    this.postCount -= 1;
    return this.save();
  }
};

tagSchema.methods.incrementFollowerCount = function() {
  this.followerCount += 1;
  return this.save();
};

tagSchema.methods.decrementFollowerCount = function() {
  if (this.followerCount > 0) {
    this.followerCount -= 1;
    return this.save();
  }
};

// 中间件
tagSchema.pre('save', function(next) {
  if (this.isNew && !this.slug) {
    this.slug = this.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

module.exports = mongoose.model('Tag', tagSchema); 