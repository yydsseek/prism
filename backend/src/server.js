require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const subscriptionRoutes = require('./routes/subscriptions');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const contentRoutes = require('./routes/content');

const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 4000;

// 安全中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS配置
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count']
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 生产环境限制更严格
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// 特殊路由的速率限制
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 认证相关接口更严格
  message: {
    success: false,
    message: '认证请求过于频繁，请稍后再试'
  }
});

const smsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 1, // 短信发送每分钟最多1次
  message: {
    success: false,
    message: '短信发送过于频繁，请稍后再试'
  }
});

// 解析JSON和URL编码
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API路由
app.use('/api/auth/send-verification-code', smsLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/subscriptions', authMiddleware, subscriptionRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/content', contentRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `路径 ${req.originalUrl} 不存在`
  });
});

// 错误处理中间件
app.use(errorHandler);

// 数据库连接
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prism';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB 连接成功');
    
    // 监听数据库连接事件
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB 连接错误:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB 连接断开');
    });
    
  } catch (error) {
    console.error('MongoDB 连接失败:', error);
    process.exit(1);
  }
};

// 优雅关闭
const gracefulShutdown = () => {
  console.log('\n正在关闭服务器...');
  
  server.close(() => {
    console.log('HTTP 服务器已关闭');
    
    mongoose.connection.close(false, () => {
      console.log('MongoDB 连接已关闭');
      process.exit(0);
    });
  });
  
  // 强制关闭
  setTimeout(() => {
    console.error('强制关闭服务器');
    process.exit(1);
  }, 10000);
};

// 启动服务器
const startServer = async () => {
  try {
    await connectDB();
    
    const server = app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`健康检查: http://localhost:${PORT}/health`);
    });
    
    // 导出server供优雅关闭使用
    global.server = server;
    
    // 监听关闭信号
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 未捕获的异常处理
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err, promise) => {
  console.error('未处理的 Promise 拒绝:', err);
  process.exit(1);
});

// 启动应用
startServer();

module.exports = app; 