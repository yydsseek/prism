const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '文章标题是必需的'],
    trim: true,
    maxlength: [200, '标题最多200个字符']
  },
  slug: {
    type: String,
    required: [true, '文章链接是必需的'],
    unique: true,
    lowercase: true,
    trim: true
  },
  content: {
    type: String,
    required: [true, '文章内容是必需的'],
    minlength: [10, '文章内容至少10个字符']
  },
  excerpt: {
    type: String,
    maxlength: [500, '摘要最多500个字符'],
    default: ''
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '作者是必需的']
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'subscribers', 'private'],
    default: 'public'
  },
  featuredImage: {
    type: String,
    default: ''
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  // 原始标签名称（用于向后兼容）
  tagNames: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    trim: true,
    default: '未分类'
  },
  readingTime: {
    type: Number,
    default: 0
  },
  wordCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, '评论最多1000个字符']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isEdited: {
      type: Boolean,
      default: false
    }
  }],
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  publishedAt: Date,
  scheduledAt: Date,
  isPinned: {
    type: Boolean,
    default: false
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  monetization: {
    isPaid: {
      type: Boolean,
      default: false
    },
    price: {
      type: Number,
      default: 0,
      min: [0, '价格不能为负数']
    }
  },
  // 内容统计
  stats: {
    bookmarkCount: {
      type: Number,
      default: 0
    },
    shareCount: {
      type: Number,
      default: 0
    }
  },
  // 推荐权重
  recommendationScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 虚拟字段
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

postSchema.virtual('url').get(function() {
  return `/posts/${this.slug}`;
});

// 索引
postSchema.index({ author: 1, status: 1 });
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ slug: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ category: 1 });
postSchema.index({ 'author': 1, 'visibility': 1 });
postSchema.index({ title: 'text', content: 'text' });

// 中间件
postSchema.pre('save', function(next) {
  // 生成阅读时间（假设每分钟阅读200字）
  if (this.isModified('content')) {
    this.wordCount = this.content.length;
    this.readingTime = Math.ceil(this.wordCount / 200);
  }
  
  // 如果状态改为published且没有publishedAt，设置发布时间
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// 静态方法
postSchema.statics.findPublished = function() {
  return this.find({ 
    status: 'published',
    publishedAt: { $lte: new Date() }
  });
};

postSchema.statics.findByAuthor = function(authorId) {
  return this.find({ author: authorId });
};

postSchema.statics.findPublic = function() {
  return this.find({ 
    status: 'published',
    visibility: 'public',
    publishedAt: { $lte: new Date() }
  });
};

postSchema.statics.findForSubscribers = function() {
  return this.find({ 
    status: 'published',
    visibility: { $in: ['public', 'subscribers'] },
    publishedAt: { $lte: new Date() }
  });
};

// 实例方法
postSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

postSchema.methods.toggleLike = async function(userId) {
  const likeIndex = this.likes.indexOf(userId);
  
  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
  } else {
    this.likes.push(userId);
  }
  
  return this.save();
};

postSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content: content
  });
  return this.save();
};

postSchema.methods.removeComment = function(commentId) {
  this.comments = this.comments.filter(comment => 
    comment._id.toString() !== commentId
  );
  return this.save();
};

// 查询中间件
postSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'author',
    select: 'username displayName avatar bio'
  });
  next();
});

module.exports = mongoose.model('Post', postSchema); 