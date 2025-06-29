const mongoose = require('mongoose');

const tagFollowSchema = new mongoose.Schema({
  // 关注者
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 关注的标签
  tag: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag',
    required: true,
    index: true
  },
  
  // 通知偏好
  notifications: {
    // 新文章通知
    newPosts: {
      type: Boolean,
      default: true
    },
    // 热门文章通知
    trendingPosts: {
      type: Boolean,
      default: false
    },
    // 每日摘要
    dailyDigest: {
      type: Boolean,
      default: false
    },
    // 每周摘要
    weeklyDigest: {
      type: Boolean,
      default: true
    }
  },
  
  // 关注来源
  source: {
    type: String,
    enum: ['recommendation', 'search', 'post', 'manual', 'import'],
    default: 'manual'
  }
}, {
  timestamps: true
});

// 复合索引
tagFollowSchema.index({ user: 1, tag: 1 }, { unique: true });
tagFollowSchema.index({ tag: 1, createdAt: -1 });
tagFollowSchema.index({ user: 1, createdAt: -1 });

// 静态方法
tagFollowSchema.statics.getUserFollowedTags = function(userId, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  return this.find({ user: userId })
    .populate('tag', 'name slug description color postCount followerCount')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

tagFollowSchema.statics.getTagFollowers = function(tagId, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  return this.find({ tag: tagId })
    .populate('user', 'username displayName avatar bio')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

tagFollowSchema.statics.isFollowing = function(userId, tagId) {
  return this.findOne({ user: userId, tag: tagId });
};

tagFollowSchema.statics.getFollowedTagIds = function(userId) {
  return this.find({ user: userId }).distinct('tag');
};

// 实例方法
tagFollowSchema.methods.updateNotificationSettings = function(settings) {
  Object.assign(this.notifications, settings);
  return this.save();
};

// 中间件
tagFollowSchema.post('save', async function() {
  if (this.isNew) {
    // 增加标签关注者数量
    const Tag = mongoose.model('Tag');
    await Tag.findByIdAndUpdate(this.tag, { $inc: { followerCount: 1 } });
  }
});

tagFollowSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    // 减少标签关注者数量
    const Tag = mongoose.model('Tag');
    await Tag.findByIdAndUpdate(doc.tag, { $inc: { followerCount: -1 } });
  }
});

module.exports = mongoose.model('TagFollow', tagFollowSchema); 