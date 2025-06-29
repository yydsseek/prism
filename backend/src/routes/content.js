const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const recommendationService = require('../services/recommendationService');
const Post = require('../models/Post');
const Tag = require('../models/Tag');
const TagFollow = require('../models/TagFollow');
const Bookmark = require('../models/Bookmark');

const router = express.Router();

// 获取推荐内容
router.get('/recommended', authMiddleware, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { page = 1, limit = 20 } = req.query;

  const posts = await recommendationService.getRecommendedPosts(req.user._id, {
    page: parseInt(page),
    limit: parseInt(limit)
  });

  const total = posts.length; // 简化处理，实际应该查询总数

  res.json({
    success: true,
    data: {
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasMore: posts.length === parseInt(limit)
      }
    }
  });
}));

// 获取订阅内容
router.get('/subscribed', authMiddleware, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
  query('sortBy').optional().isIn(['publishedAt', 'views', 'likeCount']).withMessage('排序字段无效')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { page = 1, limit = 20, sortBy = 'publishedAt' } = req.query;

  const posts = await recommendationService.getSubscribedPosts(req.user._id, {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy
  });

  res.json({
    success: true,
    data: {
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(posts.length / limit),
        total: posts.length,
        hasMore: posts.length === parseInt(limit)
      }
    }
  });
}));

// 获取热门内容
router.get('/popular', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
  query('timeRange').optional().isIn(['day', 'week', 'month', 'all']).withMessage('时间范围无效')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { page = 1, limit = 20, timeRange = 'week' } = req.query;

  const posts = await recommendationService.getPopularPosts({
    page: parseInt(page),
    limit: parseInt(limit),
    timeRange
  });

  res.json({
    success: true,
    data: {
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(posts.length / limit),
        total: posts.length,
        hasMore: posts.length === parseInt(limit)
      }
    }
  });
}));

// 获取标签列表
router.get('/tags', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('search').optional().isLength({ min: 1, max: 50 }).withMessage('搜索关键词长度必须在1-50之间'),
  query('popular').optional().isBoolean().withMessage('热门标签参数无效')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { page = 1, limit = 20, search, popular } = req.query;

  let tags;

  if (search) {
    tags = await Tag.searchTags(search, parseInt(limit));
  } else if (popular === 'true') {
    tags = await Tag.getPopularTags(parseInt(limit));
  } else {
    const skip = (page - 1) * limit;
    tags = await Tag.find({ status: 'active' })
      .sort({ postCount: -1, followerCount: -1 })
      .skip(skip)
      .limit(parseInt(limit));
  }

  // 如果用户已登录，检查关注状态
  if (req.user) {
    const followedTagIds = await TagFollow.find({ user: req.user._id }).distinct('tag');
    tags = tags.map(tag => ({
      ...tag.toObject(),
      isFollowed: followedTagIds.includes(tag._id)
    }));
  }

  res.json({
    success: true,
    data: { tags }
  });
}));

// 获取标签详情和相关内容
router.get('/tags/:slug', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
  query('sortBy').optional().isIn(['publishedAt', 'views', 'likeCount']).withMessage('排序字段无效')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { slug } = req.params;
  const { page = 1, limit = 20, sortBy = 'publishedAt' } = req.query;

  // 获取标签信息
  const tag = await Tag.findOne({ slug, status: 'active' });
  if (!tag) {
    return res.status(404).json({
      success: false,
      message: '标签不存在'
    });
  }

  // 检查用户是否关注该标签
  let isFollowed = false;
  if (req.user) {
    const follow = await TagFollow.findOne({ user: req.user._id, tag: tag._id });
    isFollowed = !!follow;
  }

  // 获取标签相关文章
  const posts = await recommendationService.getPostsByTag(tag._id, {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    userId: req.user?._id
  });

  res.json({
    success: true,
    data: {
      tag: {
        ...tag.toObject(),
        isFollowed
      },
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(posts.length / limit),
        total: posts.length,
        hasMore: posts.length === parseInt(limit)
      }
    }
  });
}));

// 关注/取消关注标签
router.post('/tags/:id/follow', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const tag = await Tag.findById(id);
  if (!tag) {
    return res.status(404).json({
      success: false,
      message: '标签不存在'
    });
  }

  const existingFollow = await TagFollow.findOne({ user: req.user._id, tag: id });

  if (existingFollow) {
    // 取消关注
    await TagFollow.findOneAndDelete({ user: req.user._id, tag: id });
    await tag.decrementFollowerCount();

    res.json({
      success: true,
      message: '已取消关注标签',
      data: { isFollowed: false }
    });
  } else {
    // 关注标签
    await TagFollow.create({
      user: req.user._id,
      tag: id,
      source: 'manual'
    });

    res.json({
      success: true,
      message: '已关注标签',
      data: { isFollowed: true }
    });
  }
}));

// 获取用户关注的标签
router.get('/tags/following', authMiddleware, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { page = 1, limit = 20 } = req.query;

  const follows = await TagFollow.getUserFollowedTags(req.user._id, {
    page: parseInt(page),
    limit: parseInt(limit)
  });

  const tags = follows.map(follow => ({
    ...follow.tag.toObject(),
    followedAt: follow.createdAt,
    notifications: follow.notifications
  }));

  res.json({
    success: true,
    data: { tags }
  });
}));

// 收藏文章
router.post('/bookmarks', authMiddleware, [
  body('postId').isMongoId().withMessage('文章ID无效'),
  body('collection').optional().isLength({ min: 1, max: 50 }).withMessage('收藏夹名称长度必须在1-50之间'),
  body('note').optional().isLength({ max: 500 }).withMessage('备注最多500个字符'),
  body('tags').optional().isArray().withMessage('标签必须是数组'),
  body('isPublic').optional().isBoolean().withMessage('公开设置无效')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { postId, collection = 'default', note, tags = [], isPublic = false } = req.body;

  // 检查文章是否存在
  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({
      success: false,
      message: '文章不存在'
    });
  }

  // 检查是否已收藏
  const existingBookmark = await Bookmark.findOne({ user: req.user._id, post: postId });
  if (existingBookmark) {
    return res.status(400).json({
      success: false,
      message: '文章已收藏'
    });
  }

  // 创建收藏
  const bookmark = await Bookmark.create({
    user: req.user._id,
    post: postId,
    collectionName: collection,
    note,
    tags,
    isPublic
  });

  // 更新文章收藏数
  await Post.findByIdAndUpdate(postId, { $inc: { 'stats.bookmarkCount': 1 } });

  res.status(201).json({
    success: true,
    message: '收藏成功',
    data: { bookmark }
  });
}));

// 取消收藏文章
router.delete('/bookmarks/:postId', authMiddleware, asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const bookmark = await Bookmark.findOneAndDelete({ user: req.user._id, post: postId });
  if (!bookmark) {
    return res.status(404).json({
      success: false,
      message: '收藏不存在'
    });
  }

  // 更新文章收藏数
  await Post.findByIdAndUpdate(postId, { $inc: { 'stats.bookmarkCount': -1 } });

  res.json({
    success: true,
    message: '已取消收藏'
  });
}));

// 获取用户收藏列表
router.get('/bookmarks', authMiddleware, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
  query('collection').optional().isLength({ min: 1, max: 50 }).withMessage('收藏夹名称无效'),
  query('tags').optional().isString().withMessage('标签筛选无效'),
  query('sortBy').optional().isIn(['createdAt', 'publishedAt']).withMessage('排序字段无效')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { page = 1, limit = 20, collection, tags, sortBy = 'createdAt' } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy,
    collection
  };

  if (tags) {
    options.tags = tags.split(',');
  }

  const bookmarks = await Bookmark.getUserBookmarks(req.user._id, options);

  res.json({
    success: true,
    data: {
      bookmarks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(bookmarks.length / limit),
        total: bookmarks.length,
        hasMore: bookmarks.length === parseInt(limit)
      }
    }
  });
}));

// 获取用户收藏夹列表
router.get('/bookmarks/collections', authMiddleware, asyncHandler(async (req, res) => {
  const collections = await Bookmark.getUserCollections(req.user._id);

  res.json({
    success: true,
    data: { collections }
  });
}));

// 更新收藏
router.put('/bookmarks/:postId', authMiddleware, [
  body('collection').optional().isLength({ min: 1, max: 50 }).withMessage('收藏夹名称长度必须在1-50之间'),
  body('note').optional().isLength({ max: 500 }).withMessage('备注最多500个字符'),
  body('tags').optional().isArray().withMessage('标签必须是数组'),
  body('isPublic').optional().isBoolean().withMessage('公开设置无效')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { postId } = req.params;
  const { collection, note, tags, isPublic } = req.body;

  const bookmark = await Bookmark.findOne({ user: req.user._id, post: postId });
  if (!bookmark) {
    return res.status(404).json({
      success: false,
      message: '收藏不存在'
    });
  }

  // 更新收藏信息
  const updateData = {};
  if (collection !== undefined) updateData.collectionName = collection;
  if (note !== undefined) updateData.note = note;
  if (tags !== undefined) updateData.tags = tags;
  if (isPublic !== undefined) updateData.isPublic = isPublic;

  const updatedBookmark = await Bookmark.findByIdAndUpdate(
    bookmark._id,
    updateData,
    { new: true }
  ).populate('post', 'title slug summary coverImage publishedAt author');

  res.json({
    success: true,
    message: '收藏更新成功',
    data: { bookmark: updatedBookmark }
  });
}));

// 检查文章是否已收藏
router.get('/bookmarks/check/:postId', authMiddleware, asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const bookmark = await Bookmark.findOne({ user: req.user._id, post: postId });

  res.json({
    success: true,
    data: {
      isBookmarked: !!bookmark,
      bookmark: bookmark || null
    }
  });
}));

// 获取热门收藏
router.get('/bookmarks/popular', optionalAuth, [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('数量限制无效')
], asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const popularBookmarks = await Bookmark.getPopularBookmarks(parseInt(limit));

  res.json({
    success: true,
    data: { bookmarks: popularBookmarks }
  });
}));

// 搜索内容
router.get('/search', optionalAuth, [
  query('q').isLength({ min: 1, max: 100 }).withMessage('搜索关键词长度必须在1-100之间'),
  query('type').optional().isIn(['posts', 'tags', 'users']).withMessage('搜索类型无效'),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { q, type = 'posts', page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  let results = [];

  if (type === 'posts') {
    results = await Post.find({
      $text: { $search: q },
      status: 'published',
      visibility: 'public'
    })
    .populate('author', 'username displayName avatar')
    .populate('tags', 'name slug color')
    .sort({ score: { $meta: 'textScore' }, publishedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  } else if (type === 'tags') {
    results = await Tag.searchTags(q, parseInt(limit));
  }

  res.json({
    success: true,
    data: {
      results,
      query: q,
      type,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(results.length / limit),
        total: results.length,
        hasMore: results.length === parseInt(limit)
      }
    }
  });
}));

module.exports = router; 