const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  // 收藏的用户
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 收藏的文章
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  
  // 收藏夹分类
  collectionName: {
    type: String,
    default: 'default',
    maxlength: 50
  },
  
  // 收藏备注
  note: {
    type: String,
    maxlength: 500
  },
  
  // 是否公开
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // 标签
  tags: [{
    type: String,
    maxlength: 30
  }],
  
  // 收藏时的文章状态快照
  postSnapshot: {
    title: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    publishedAt: Date,
    summary: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 复合索引
bookmarkSchema.index({ user: 1, post: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, collectionName: 1, createdAt: -1 });
bookmarkSchema.index({ user: 1, tags: 1 });
bookmarkSchema.index({ user: 1, isPublic: 1 });

// 虚拟字段
bookmarkSchema.virtual('isRecent').get(function() {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt > dayAgo;
});

// 静态方法
bookmarkSchema.statics.getUserBookmarks = function(userId, options = {}) {
  const {
    collection,
    tags,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = -1
  } = options;

  const query = { user: userId };
  
  if (collection && collection !== 'all') {
    query.collectionName = collection;
  }
  
  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('post', 'title slug summary coverImage publishedAt author status')
    .populate('post.author', 'username displayName avatar')
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);
};

bookmarkSchema.statics.getUserCollections = function(userId) {
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$collectionName',
        count: { $sum: 1 },
        lastUpdated: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

bookmarkSchema.statics.getPopularBookmarks = function(limit = 10) {
  return this.aggregate([
    { $match: { isPublic: true } },
    {
      $group: {
        _id: '$post',
        bookmarkCount: { $sum: 1 },
        lastBookmarked: { $max: '$createdAt' }
      }
    },
    { $sort: { bookmarkCount: -1, lastBookmarked: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: '_id',
        as: 'post'
      }
    },
    { $unwind: '$post' },
    {
      $lookup: {
        from: 'users',
        localField: 'post.author',
        foreignField: '_id',
        as: 'post.author'
      }
    },
    { $unwind: '$post.author' }
  ]);
};

bookmarkSchema.statics.isBookmarked = function(userId, postId) {
  return this.findOne({ user: userId, post: postId });
};

// 实例方法
bookmarkSchema.methods.updateNote = function(note) {
  this.note = note;
  return this.save();
};

bookmarkSchema.methods.updateCollection = function(collection) {
  this.collectionName = collection;
  return this.save();
};

bookmarkSchema.methods.addTags = function(tags) {
  const newTags = tags.filter(tag => !this.tags.includes(tag));
  this.tags.push(...newTags);
  return this.save();
};

bookmarkSchema.methods.removeTags = function(tags) {
  this.tags = this.tags.filter(tag => !tags.includes(tag));
  return this.save();
};

// 中间件
bookmarkSchema.pre('save', async function(next) {
  if (this.isNew) {
    // 保存文章快照
    const Post = mongoose.model('Post');
    const post = await Post.findById(this.post).populate('author', 'username displayName');
    
    if (post) {
      this.postSnapshot = {
        title: post.title,
        author: post.author._id,
        publishedAt: post.publishedAt,
        summary: post.summary
      };
    }
  }
  next();
});

module.exports = mongoose.model('Bookmark', bookmarkSchema); 