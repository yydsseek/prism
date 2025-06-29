// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 记录错误日志
  console.error('错误详情:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose 重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error.message = `${field} '${value}' 已存在`;
    error.statusCode = 400;
  }

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error.message = messages.join(', ');
    error.statusCode = 400;
  }

  // Mongoose 无效ID错误
  if (err.name === 'CastError') {
    error.message = '无效的资源ID';
    error.statusCode = 400;
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    error.message = '无效的token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'token已过期';
    error.statusCode = 401;
  }

  // 文件上传错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = '文件大小超出限制';
    error.statusCode = 400;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error.message = '不支持的文件类型';
    error.statusCode = 400;
  }

  // Stripe错误
  if (err.type === 'StripeCardError') {
    error.message = err.message;
    error.statusCode = 400;
  }

  if (err.type === 'StripeInvalidRequestError') {
    error.message = '支付请求无效';
    error.statusCode = 400;
  }

  // 默认错误
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || '服务器内部错误';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 异步错误处理包装器
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404错误处理
const notFound = (req, res, next) => {
  const error = new Error(`接口不存在 - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// 验证错误处理
const validationError = (errors) => {
  const error = new Error('验证失败');
  error.statusCode = 400;
  error.errors = errors;
  return error;
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFound,
  validationError
}; 