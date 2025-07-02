const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const { asyncHandler } = require('../middleware/errorHandler');
const { optionalAuth, requireAuth, requirePostOwner } = require('../middleware/auth');

const router = express.Router();

// 获取文章列表
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    author,
    category,
    tag,
    search,
    status = 'published'
  } = req.query;

  const query = { status: 'published' };

  // 如果指定了作者，只显示该作者的文章
  if (author) {
    query.author = author;
  }

  // 如果指定了分类
  if (category) {
    query.category = category;
  }

  // 如果指定了标签
  if (tag) {
    query.tags = tag;
  }

  // 搜索功能
  if (search) {
    query.$text = { $search: search };
  }

  // 如果用户已登录，显示订阅内容
  if (req.user) {
    // 这里需要检查用户是否订阅了作者
    // 暂时显示所有公开文章
  }

  const posts = await Post.find(query)
    .populate('author', 'username displayName avatar bio')
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Post.countDocuments(query);

  res.json({
    success: true,
    data: {
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
}));

// 获取单篇文章
router.get('/:slug', optionalAuth, asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const post = await Post.findOne({ slug, status: 'published' })
    .populate('author', 'username displayName avatar bio creatorProfile');

  if (!post) {
    return res.status(404).json({
      success: false,
      message: '文章不存在'
    });
  }

  // 检查访问权限
  if (post.visibility === 'subscribers' && (!req.user || !req.user.isSubscriber)) {
    return res.status(403).json({
      success: false,
      message: '此文章仅对订阅者开放'
    });
  }

  // 增加浏览量
  await post.incrementViews();

  res.json({
    success: true,
    data: { post }
  });
}));

// 创建文章
router.post('/', requireAuth, [
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('标题长度必须在1-200个字符之间'),
  body('content')
    .isLength({ min: 5 })
    .withMessage('文章内容至少5个字符'),
  body('excerpt')
    .optional()
    .isLength({ max: 500 })
    .withMessage('摘要最多500个字符'),
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('分类最多50个字符'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组'),
  body('visibility')
    .optional()
    .isIn(['public', 'subscribers', 'private'])
    .withMessage('可见性设置无效'),
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('状态设置无效')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    title,
    content,
    excerpt,
    category,
    tags,
    visibility,
    status,
    featuredImage,
    seo
  } = req.body;

  // 生成slug - 支持中文
  let slug = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  
  // 如果slug为空或只包含特殊字符，使用时间戳作为后备
  if (!slug || slug.replace(/[-]/g, '').length === 0) {
    slug = `post-${Date.now()}`;
  }
  
  // 确保slug不超过50个字符
  if (slug.length > 50) {
    slug = slug.substring(0, 50).replace(/-+$/, '');
  }

  // 检查slug是否已存在
  const existingPost = await Post.findOne({ slug });
  if (existingPost) {
    return res.status(400).json({
      success: false,
      message: '标题已存在，请使用不同的标题'
    });
  }

  const post = await Post.create({
    title,
    slug,
    content,
    excerpt,
    author: req.user._id,
    category: category || '未分类',
    tags: tags || [],
    visibility: visibility || 'public',
    status: status || 'draft',
    featuredImage,
    seo
  });

  await post.populate('author', 'username displayName avatar bio');

  res.status(201).json({
    success: true,
    message: '文章创建成功',
    data: { post }
  });
}));

// 更新文章
router.put('/:postId', requirePostOwner, [
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('标题长度必须在1-200个字符之间'),
  body('content')
    .optional()
    .isLength({ min: 5 })
    .withMessage('文章内容至少5个字符'),
  body('excerpt')
    .optional()
    .isLength({ max: 500 })
    .withMessage('摘要最多500个字符'),
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('分类最多50个字符'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组'),
  body('visibility')
    .optional()
    .isIn(['public', 'subscribers', 'private'])
    .withMessage('可见性设置无效'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('状态设置无效')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    title,
    content,
    excerpt,
    category,
    tags,
    visibility,
    status,
    featuredImage,
    seo
  } = req.body;

  const updateData = {};
  
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (excerpt !== undefined) updateData.excerpt = excerpt;
  if (category !== undefined) updateData.category = category;
  if (tags !== undefined) updateData.tags = tags;
  if (visibility !== undefined) updateData.visibility = visibility;
  if (status !== undefined) updateData.status = status;
  if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
  if (seo !== undefined) updateData.seo = seo;

  // 如果标题改变，需要更新slug
  if (title && title !== req.post.title) {
    let newSlug = title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    // 如果slug为空或只包含特殊字符，使用时间戳作为后备
    if (!newSlug || newSlug.replace(/[-]/g, '').length === 0) {
      newSlug = `post-${Date.now()}`;
    }
    
    // 确保slug不超过50个字符
    if (newSlug.length > 50) {
      newSlug = newSlug.substring(0, 50).replace(/-+$/, '');
    }

    const existingPost = await Post.findOne({ slug: newSlug, _id: { $ne: req.post._id } });
    if (existingPost) {
      return res.status(400).json({
        success: false,
        message: '标题已存在，请使用不同的标题'
      });
    }

    updateData.slug = newSlug;
  }

  const post = await Post.findByIdAndUpdate(
    req.post._id,
    updateData,
    { new: true, runValidators: true }
  ).populate('author', 'username displayName avatar bio');

  res.json({
    success: true,
    message: '文章更新成功',
    data: { post }
  });
}));

// 删除文章
router.delete('/:postId', requirePostOwner, asyncHandler(async (req, res) => {
  await Post.findByIdAndDelete(req.post._id);

  res.json({
    success: true,
    message: '文章删除成功'
  });
}));

// 点赞/取消点赞文章
router.post('/:postId/like', asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({
      success: false,
      message: '文章不存在'
    });
  }

  await post.toggleLike(req.user._id);

  res.json({
    success: true,
    message: '操作成功',
    data: {
      likeCount: post.likeCount,
      isLiked: post.likes.includes(req.user._id)
    }
  });
}));

// 添加评论
router.post('/:postId/comments', [
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('评论内容长度必须在1-1000个字符之间')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { postId } = req.params;
  const { content } = req.body;

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({
      success: false,
      message: '文章不存在'
    });
  }

  if (!post.allowComments) {
    return res.status(400).json({
      success: false,
      message: '此文章不允许评论'
    });
  }

  await post.addComment(req.user._id, content);

  res.json({
    success: true,
    message: '评论添加成功'
  });
}));

// 删除评论
router.delete('/:postId/comments/:commentId', requirePostOwner, asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  await req.post.removeComment(commentId);

  res.json({
    success: true,
    message: '评论删除成功'
  });
}));

// 获取用户的文章列表
router.get('/user/:userId', optionalAuth, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10, status = 'published' } = req.query;

  const query = { author: userId };

  if (status === 'published') {
    query.status = 'published';
    query.publishedAt = { $lte: new Date() };
  } else if (status === 'draft') {
    query.status = 'draft';
  }

  const posts = await Post.find(query)
    .populate('author', 'username displayName avatar bio')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Post.countDocuments(query);

  res.json({
    success: true,
    data: {
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
}));

module.exports = router; 