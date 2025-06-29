const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 验证JWT token
const authMiddleware = async (req, res, next) => {
  try {
    let token;
    
    // 从请求头获取token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // 从cookie获取token
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，请先登录'
      });
    }
    
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 查找用户
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 检查用户是否被锁定
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: '账户已被锁定，请稍后再试'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'token已过期，请重新登录'
      });
    }
    
    console.error('认证中间件错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 可选认证中间件（不强制要求登录）
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && !user.isLocked) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败时不返回错误，继续执行
    next();
  }
};

// 检查是否为创作者
const requireCreator = async (req, res, next) => {
  if (!req.user.isCreator) {
    return res.status(403).json({
      success: false,
      message: '只有创作者才能访问此功能'
    });
  }
  next();
};

// 检查创作者账户是否激活
const requireActiveCreator = async (req, res, next) => {
  if (!req.user.isCreator) {
    return res.status(403).json({
      success: false,
      message: '只有创作者才能访问此功能'
    });
  }
  
  if (!req.user.creatorProfile.isActive) {
    return res.status(403).json({
      success: false,
      message: '创作者账户未激活，请先激活账户'
    });
  }
  
  next();
};

// 检查是否为文章作者或管理员
const requirePostOwner = async (req, res, next) => {
  const { postId } = req.params;
  
  try {
    const Post = require('../models/Post');
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }
    
    // 检查是否为文章作者
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '只有文章作者才能执行此操作'
      });
    }
    
    req.post = post;
    next();
  } catch (error) {
    console.error('检查文章所有权错误:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

module.exports = {
  authMiddleware,
  optionalAuth,
  requireCreator,
  requireActiveCreator,
  requirePostOwner
}; 