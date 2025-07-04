const Post = require('../models/Post');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const TagFollow = require('../models/TagFollow');
const Bookmark = require('../models/Bookmark');

class RecommendationService {
  /**
   * 获取用户推荐内容
   * @param {string} userId - 用户ID
   * @param {Object} options - 选项
   */
  async getRecommendedPosts(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      excludeRead = false,
      includeSubscribed = true
    } = options;

    const skip = (page - 1) * limit;
    const user = await User.findById(userId);

    if (!user) {
      return this.getPopularPosts({ page, limit });
    }

    // 获取用户偏好
    const userPreferences = await this.getUserPreferences(userId);
    
    // 构建推荐查询
    const recommendationQuery = await this.buildRecommendationQuery(userId, userPreferences);
    // 执行查询
    const posts = await Post.find(recommendationQuery)
      .populate('author', 'username displayName avatar bio isCreator')
      .populate('tags', 'name slug color')
      .sort({ recommendationScore: -1, publishedAt: -1 })
      .skip(skip)
      .limit(limit);

    // 计算个性化分数
    const scoredPosts = await this.calculatePersonalizedScores(posts, userPreferences);
    return await scoredPosts.sort((a, b) => b.personalizedScore - a.personalizedScore);
  }

  /**
   * 获取订阅内容
   * @param {string} userId - 用户ID
   * @param {Object} options - 选项
   */
  async getSubscribedPosts(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'publishedAt',
      sortOrder = -1
    } = options;

    const skip = (page - 1) * limit;

    // 获取用户订阅的创作者
    const subscriptions = await Subscription.find({
      subscriber: userId,
      status: 'active'
    }).distinct('creator');

    // 获取关注的标签
    const followedTags = await TagFollow.find({ user: userId }).distinct('tag');

    // 构建查询条件
    const query = {
      status: 'published',
      publishedAt: { $lte: new Date() },
      $or: [
        { author: { $in: subscriptions } },
        { tags: { $in: followedTags } }
      ]
    };

    const posts = await Post.find(query)
      .populate('author', 'username displayName avatar bio isCreator')
      .populate('tags', 'name slug color')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    return posts;
  }

  /**
   * 获取标签相关内容
   * @param {string} tagId - 标签ID
   * @param {Object} options - 选项
   */
  async getPostsByTag(tagId, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'publishedAt',
      sortOrder = -1,
      userId = null
    } = options;

    const skip = (page - 1) * limit;

    const query = {
      tags: tagId,
      status: 'published',
      publishedAt: { $lte: new Date() }
    };

    // 如果用户未登录，只显示公开内容
    if (!userId) {
      query.visibility = 'public';
    } else {
      // 已登录用户可以看到订阅内容
      const subscriptions = await Subscription.find({
        subscriber: userId,
        status: 'active'
      }).distinct('creator');

      query.$or = [
        { visibility: 'public' },
        { visibility: 'subscribers', author: { $in: subscriptions } }
      ];
    }

    const posts = await Post.find(query)
      .populate('author', 'username displayName avatar bio isCreator')
      .populate('tags', 'name slug color')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    return posts;
  }

  /**
   * 获取热门内容
   * @param {Object} options - 选项
   */
  async getPopularPosts(options = {}) {
    const {
      page = 1,
      limit = 20,
      timeRange = 'week' // day, week, month, all
    } = options;

    const skip = (page - 1) * limit;
    let dateFilter = {};

    // 设置时间范围
    switch (timeRange) {
      case 'day':
        dateFilter = { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
        break;
      case 'week':
        dateFilter = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case 'month':
        dateFilter = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
        break;
      default:
        dateFilter = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    }

    const posts = await Post.find({
      status: 'published',
      visibility: 'public',
      publishedAt: dateFilter
    })
    .populate('author', 'username displayName avatar bio isCreator')
    .populate('tags', 'name slug color')
    .sort({
      views: -1,
      'stats.bookmarkCount': -1,
      likeCount: -1,
      publishedAt: -1
    })
    .skip(skip)
    .limit(limit);

    return posts;
  }

  /**
   * 获取用户偏好
   * @param {string} userId - 用户ID
   */
  async getUserPreferences(userId) {
    // 获取用户订阅的创作者
    const subscriptions = await Subscription.find({
      subscriber: userId,
      status: 'active'
    }).populate('creator', 'username displayName');

    // 获取关注的标签
    const followedTags = await TagFollow.find({ user: userId })
      .populate('tag', 'name slug');

    // 获取收藏的文章（分析兴趣）
    const bookmarks = await Bookmark.find({ user: userId })
      .populate('post', 'tags author')
      .limit(50);

    // 分析用户阅读历史（这里简化处理）
    const readingHistory = await this.getReadingHistory(userId);

    return {
      subscribedCreators: subscriptions.map(s => s.creator._id),
      followedTags: followedTags.map(f => f.tag._id),
      bookmarkedPosts: bookmarks.map(b => b.post._id),
      readingHistory,
      preferences: {
        favoriteTopics: await this.extractFavoriteTopics(userId),
        readingTime: await this.getPreferredReadingTime(userId)
      }
    };
  }

  /**
   * 构建推荐查询
   * @param {string} userId - 用户ID
   * @param {Object} preferences - 用户偏好
   */
  async buildRecommendationQuery(userId, preferences) {
    const baseQuery = {
      status: 'published',
      publishedAt: { $lte: new Date() }
    };

    // 排除用户自己的文章
    // baseQuery.author = { $ne: userId };

    // 根据用户偏好调整查询
    const orConditions = [];

    // 订阅的创作者内容
    if (preferences.subscribedCreators.length > 0) {
      orConditions.push({
        author: { $in: preferences.subscribedCreators }
      });
    }

    // 关注的标签内容
    if (preferences.followedTags.length > 0) {
      orConditions.push({
        tags: { $in: preferences.followedTags }
      });
    }

    // 热门内容
    orConditions.push({
      views: { $gte: 100 },
      publishedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    // 新内容
    orConditions.push({
      publishedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (orConditions.length > 0) {
      baseQuery.$or = orConditions;
    }

    return baseQuery;
  }

  /**
   * 计算个性化分数
   * @param {Array} posts - 文章列表
   * @param {Object} preferences - 用户偏好
   */
  async calculatePersonalizedScores(posts, preferences) {
    return posts.map(post => {
      let score = post.recommendationScore || 0;

      // 订阅创作者加分
      if (preferences.subscribedCreators.includes(post.author._id.toString())) {
        score += 50;
      }

      // 关注标签加分
      const postTagIds = post.tags.map(tag => tag._id.toString());
      const followedTagIds = preferences.followedTags.map(tag => tag.toString());
      const tagMatches = postTagIds.filter(tagId => followedTagIds.includes(tagId));
      score += tagMatches.length * 20;

      // 热门度加分
      score += Math.log(post.views + 1) * 2;
      score += post.likeCount * 5;
      score += (post.stats?.bookmarkCount || 0) * 10;

      // 新鲜度加分
      const daysSincePublished = (Date.now() - post.publishedAt) / (1000 * 60 * 60 * 24);
      if (daysSincePublished < 1) {
        score += 30;
      } else if (daysSincePublished < 7) {
        score += 20 - daysSincePublished * 2;
      }

      return {
        ...post.toObject(),
        personalizedScore: score
      };
    });
  }

  /**
   * 获取阅读历史（简化实现）
   * @param {string} userId - 用户ID
   */
  async getReadingHistory(userId) {
    // 这里可以实现阅读历史记录
    // 暂时返回空数组
    return [];
  }

  /**
   * 提取用户喜好话题
   * @param {string} userId - 用户ID
   */
  async extractFavoriteTopics(userId) {
    const bookmarks = await Bookmark.find({ user: userId })
      .populate('post', 'tags')
      .limit(100);

    const tagCounts = {};
    bookmarks.forEach(bookmark => {
      if (bookmark.post && bookmark.post.tags) {
        bookmark.post.tags.forEach(tag => {
          tagCounts[tag.toString()] = (tagCounts[tag.toString()] || 0) + 1;
        });
      }
    });

    // 返回最常收藏的标签
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tagId]) => tagId);
  }

  /**
   * 获取用户偏好的阅读时间
   * @param {string} userId - 用户ID
   */
  async getPreferredReadingTime(userId) {
    const bookmarks = await Bookmark.find({ user: userId })
      .populate('post', 'readingTime')
      .limit(50);

    if (bookmarks.length === 0) return 5; // 默认5分钟

    const totalTime = bookmarks.reduce((sum, bookmark) => {
      return sum + (bookmark.post?.readingTime || 0);
    }, 0);

    return Math.round(totalTime / bookmarks.length);
  }

  /**
   * 更新文章推荐分数
   * @param {string} postId - 文章ID
   */
  async updateRecommendationScore(postId) {
    const post = await Post.findById(postId);
    if (!post) return;

    let score = 0;

    // 基础分数
    score += post.views * 0.1;
    score += post.likeCount * 2;
    score += (post.stats?.bookmarkCount || 0) * 5;
    score += post.commentCount * 3;

    // 时间衰减
    const daysSincePublished = (Date.now() - post.publishedAt) / (1000 * 60 * 60 * 24);
    const timeDecay = Math.exp(-daysSincePublished / 7); // 7天半衰期
    score *= timeDecay;

    // 作者权重
    const author = await User.findById(post.author);
    if (author?.isCreator) {
      score *= 1.2;
    }

    await Post.findByIdAndUpdate(postId, { recommendationScore: score });
  }
}

module.exports = new RecommendationService(); 