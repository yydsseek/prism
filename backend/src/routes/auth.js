const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const smsService = require('../services/smsService');
const wechatService = require('../services/wechatService');

const router = express.Router();

// 生成JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// 手机号验证
const phoneValidation = [
  body('phone')
    .isMobilePhone('zh-CN')
    .withMessage('请输入有效的手机号')
];

// 密码验证
const passwordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('密码至少8个字符')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('密码必须包含字母和数字')
];

// 验证码验证
const verificationCodeValidation = [
  body('verificationCode')
    .isLength({ min: 6, max: 6 })
    .withMessage('验证码必须是6位数字')
    .isNumeric()
    .withMessage('验证码只能包含数字')
];

// 发送验证码
router.post('/send-verification-code', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('type').isIn(['register', 'login', 'reset_password', 'change_phone']).withMessage('验证码类型无效')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { phone, type } = req.body;

  // 检查发送频率限制
  const limitCheck = await smsService.checkSendLimit(phone, type);
  if (!limitCheck.allowed) {
    return res.status(429).json({
      success: false,
      message: '发送过于频繁，请稍后再试',
      nextAllowTime: limitCheck.nextAllowTime
    });
  }

  // 对于注册类型，检查手机号是否已存在
  if (type === 'register') {
    const existingUser = await User.findByPhone(phone);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该手机号已注册'
      });
    }
  }

  // 对于登录和重置密码类型，检查手机号是否存在
  if (type === 'login' || type === 'reset_password') {
    const existingUser = await User.findByPhone(phone);
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: '该手机号未注册'
      });
    }
  }

  // 生成验证码
  const verificationCode = smsService.generateVerificationCode();
  const expires = new Date(Date.now() + 5 * 60 * 1000); // 5分钟过期

  // 保存验证码到用户记录或临时存储
  if (type !== 'register') {
    await User.findOneAndUpdate(
      { phone },
      {
        verificationCode,
        verificationCodeExpires: expires,
        verificationCodeType: type
      }
    );
  } else {
    // 注册时临时存储验证码（可以使用Redis或内存存储）
    // 这里简化处理，实际项目建议使用Redis
    global.tempVerificationCodes = global.tempVerificationCodes || {};
    global.tempVerificationCodes[phone] = {
      code: verificationCode,
      expires,
      type
    };
  }

  // 发送短信
  const smsResult = await smsService.sendVerificationCode(phone, verificationCode, type);

  if (smsResult.success) {
    res.json({
      success: true,
      message: '验证码发送成功',
      expiresIn: 300 // 5分钟
    });
  } else {
    res.status(500).json({
      success: false,
      message: smsResult.message || '验证码发送失败'
    });
  }
}));

// 重新发送验证码
router.post('/resend-verification-code', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号'),
  body('type').isIn(['register', 'login', 'reset_password', 'change_phone']).withMessage('验证码类型无效')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { phone, type } = req.body;

  // 检查发送频率限制
  const limitCheck = await smsService.checkSendLimit(phone, type);
  if (!limitCheck.allowed) {
    return res.status(429).json({
      success: false,
      message: '发送过于频繁，请稍后再试',
      nextAllowTime: limitCheck.nextAllowTime
    });
  }

  // 生成新的验证码
  const verificationCode = smsService.generateVerificationCode();
  const expires = new Date(Date.now() + 5 * 60 * 1000);

  // 更新验证码
  if (type !== 'register') {
    await User.findOneAndUpdate(
      { phone },
      {
        verificationCode,
        verificationCodeExpires: expires,
        verificationCodeType: type
      }
    );
  } else {
    global.tempVerificationCodes = global.tempVerificationCodes || {};
    global.tempVerificationCodes[phone] = {
      code: verificationCode,
      expires,
      type
    };
  }

  // 发送短信
  const smsResult = await smsService.sendVerificationCode(phone, verificationCode, type);

  if (smsResult.success) {
    res.json({
      success: true,
      message: '验证码重新发送成功',
      expiresIn: 300
    });
  } else {
    res.status(500).json({
      success: false,
      message: smsResult.message || '验证码发送失败'
    });
  }
}));

// 手机号注册
router.post('/register', [
  ...phoneValidation,
  ...passwordValidation,
  ...verificationCodeValidation
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { phone, password, verificationCode } = req.body;

  // 检查用户是否已存在
  const existingUser = await User.findByPhone(phone);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: '该手机号已注册'
    });
  }

  // 验证验证码
  const tempCode = global.tempVerificationCodes?.[phone];
  if (!tempCode || tempCode.code !== verificationCode || tempCode.expires < new Date()) {
    return res.status(400).json({
      success: false,
      message: '验证码错误或已过期'
    });
  }

  // 创建用户
  const user = await User.create({
    phone,
    password,
    phoneVerified: true,
    profileCompleted: false
  });

  // 清除临时验证码
  if (global.tempVerificationCodes?.[phone]) {
    delete global.tempVerificationCodes[phone];
  }

  // 创建欢迎通知
  try {
    const Notification = require('../models/Notification');
    await Notification.createFromTemplate('welcome', user._id);
  } catch (error) {
    console.error('创建欢迎通知失败:', error);
  }

  // 生成JWT token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: '注册成功',
    data: {
      user: {
        id: user._id,
        phone: user.phone,
        nickname: user.nickname,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
        isCreator: user.isCreator,
        phoneVerified: user.phoneVerified,
        profileCompleted: user.profileCompleted
      },
      token
    }
  });
}));

// 手机号密码登录
router.post('/login', [
  ...phoneValidation,
  body('password').notEmpty().withMessage('密码不能为空')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { phone, password } = req.body;

  // 查找用户
  const user = await User.findByPhone(phone).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: '手机号或密码错误'
    });
  }

  // 检查账户是否被锁定
  if (user.isLocked) {
    return res.status(423).json({
      success: false,
      message: '账户已被锁定，请稍后再试'
    });
  }

  // 验证密码
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    // 增加登录失败次数
    await user.incrementLoginAttempts();
    
    return res.status(401).json({
      success: false,
      message: '手机号或密码错误'
    });
  }

  // 重置登录失败次数
  await user.resetLoginAttempts();

  // 更新最后登录时间
  user.lastLogin = new Date();
  await user.save();

  // 生成JWT token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: '登录成功',
    data: {
      user: {
        id: user._id,
        phone: user.phone,
        email: user.email,
        username: user.username,
        nickname: user.nickname,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
        isCreator: user.isCreator,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        profileCompleted: user.profileCompleted,
        workInfo: user.workInfo,
        investmentInfo: user.investmentInfo
      },
      token
    }
  });
}));

// 手机号验证码登录
router.post('/login-with-code', [
  ...phoneValidation,
  ...verificationCodeValidation
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { phone, verificationCode } = req.body;

  // 查找用户
  const user = await User.findByPhone(phone);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: '该手机号未注册'
    });
  }

  // 检查账户是否被锁定
  if (user.isLocked) {
    return res.status(423).json({
      success: false,
      message: '账户已被锁定，请稍后再试'
    });
  }

  // 验证验证码
  if (!user.verificationCode || 
      user.verificationCode !== verificationCode || 
      user.verificationCodeExpires < new Date() ||
      user.verificationCodeType !== 'login') {
    return res.status(400).json({
      success: false,
      message: '验证码错误或已过期'
    });
  }

  // 清除验证码
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  user.verificationCodeType = undefined;
  user.lastLogin = new Date();
  await user.save();

  // 生成JWT token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: '登录成功',
    data: {
      user: {
        id: user._id,
        phone: user.phone,
        email: user.email,
        username: user.username,
        nickname: user.nickname,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
        isCreator: user.isCreator,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        profileCompleted: user.profileCompleted,
        workInfo: user.workInfo,
        investmentInfo: user.investmentInfo
      },
      token
    }
  });
}));

// 忘记密码 - 通过手机号（前端API调用的接口）
router.post('/forgot-password', [
  body('phone').isMobilePhone('zh-CN').withMessage('请输入有效的手机号')
], asyncHandler(async (req, res) => {
  const { phone } = req.body;

  const user = await User.findByPhone(phone);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: '该手机号未注册'
    });
  }

  // 生成验证码
  const verificationCode = smsService.generateVerificationCode();
  const expires = new Date(Date.now() + 5 * 60 * 1000);

  // 保存验证码
  user.verificationCode = verificationCode;
  user.verificationCodeExpires = expires;
  user.verificationCodeType = 'reset_password';
  await user.save();

  // 发送短信
  const smsResult = await smsService.sendVerificationCode(phone, verificationCode, 'reset_password');

  if (smsResult.success) {
    res.json({
      success: true,
      message: '验证码已发送到您的手机',
      expiresIn: 300
    });
  } else {
    res.status(500).json({
      success: false,
      message: smsResult.message || '验证码发送失败'
    });
  }
}));

// 通过验证码重置密码
router.post('/reset-password-with-code', [
  ...phoneValidation,
  ...verificationCodeValidation,
  ...passwordValidation
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { phone, verificationCode, password } = req.body;

  // 查找用户
  const user = await User.findByPhone(phone);

  if (!user) {
    return res.status(400).json({
      success: false,
      message: '该手机号未注册'
    });
  }

  // 验证验证码
  if (!user.verificationCode || 
      user.verificationCode !== verificationCode || 
      user.verificationCodeExpires < new Date() ||
      user.verificationCodeType !== 'reset_password') {
    return res.status(400).json({
      success: false,
      message: '验证码错误或已过期'
    });
  }

  // 更新密码
  user.password = password;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  user.verificationCodeType = undefined;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: '密码重置成功'
  });
}));

// 验证手机号（用于注册流程）
router.post('/verify-phone', [
  ...phoneValidation,
  ...verificationCodeValidation
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { phone, verificationCode } = req.body;

  // 验证验证码
  const tempCode = global.tempVerificationCodes?.[phone];
  if (!tempCode || tempCode.code !== verificationCode || tempCode.expires < new Date()) {
    return res.status(400).json({
      success: false,
      message: '验证码错误或已过期'
    });
  }

  res.json({
    success: true,
    message: '手机号验证成功'
  });
}));

// 微信登录
router.post('/wechat-login', [
  body('code').notEmpty().withMessage('微信授权码不能为空')
], asyncHandler(async (req, res) => {
  const { code } = req.body;

  try {
    // 获取微信用户信息
    const wechatUserInfo = await wechatService.processLogin(code);
    
    // 查找是否已有绑定的用户
    let user = await User.findByWechatOpenId(wechatUserInfo.openid);
    
    if (user) {
      // 用户已存在，直接登录
      user.lastLogin = new Date();
      await user.save();
      
      const token = generateToken(user._id);
      
      res.json({
        success: true,
        message: '微信登录成功',
        data: {
          user: {
            id: user._id,
            phone: user.phone,
            email: user.email,
            username: user.username,
            nickname: user.nickname || wechatUserInfo.nickname,
            displayName: user.displayName,
            avatar: user.avatar || wechatUserInfo.avatar,
            bio: user.bio,
            isCreator: user.isCreator,
            phoneVerified: user.phoneVerified,
            emailVerified: user.emailVerified,
            profileCompleted: user.profileCompleted,
            workInfo: user.workInfo,
            investmentInfo: user.investmentInfo
          },
          token
        }
      });
    } else {
      // 新用户，创建账户
      user = await User.create({
        wechatOpenId: wechatUserInfo.openid,
        wechatUnionId: wechatUserInfo.unionid,
        nickname: wechatUserInfo.nickname,
        avatar: wechatUserInfo.avatar,
        phoneVerified: false,
        profileCompleted: false
      });
      
      // 创建欢迎通知
      try {
        const Notification = require('../models/Notification');
        await Notification.createFromTemplate('welcome', user._id);
      } catch (error) {
        console.error('创建欢迎通知失败:', error);
      }
      
      const token = generateToken(user._id);
      
      res.status(201).json({
        success: true,
        message: '微信登录成功，账户已创建',
        data: {
          user: {
            id: user._id,
            phone: user.phone,
            email: user.email,
            username: user.username,
            nickname: user.nickname,
            displayName: user.displayName,
            avatar: user.avatar,
            bio: user.bio,
            isCreator: user.isCreator,
            phoneVerified: user.phoneVerified,
            emailVerified: user.emailVerified,
            profileCompleted: user.profileCompleted,
            workInfo: user.workInfo,
            investmentInfo: user.investmentInfo
          },
          token,
          isNewUser: true
        }
      });
    }
  } catch (error) {
    console.error('微信登录失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '微信登录失败'
    });
  }
}));

// 绑定微信
router.post('/bind-wechat', [
  body('code').notEmpty().withMessage('微信授权码不能为空')
], asyncHandler(async (req, res) => {
  const { code } = req.body;

  try {
    // 需要认证中间件，这里假设req.user已存在
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    // 获取微信用户信息
    const wechatUserInfo = await wechatService.processLogin(code);
    
    // 检查该微信是否已绑定其他账户
    const existingUser = await User.findByWechatOpenId(wechatUserInfo.openid);
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: '该微信账号已绑定其他用户'
      });
    }
    
    // 绑定微信
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        wechatOpenId: wechatUserInfo.openid,
        wechatUnionId: wechatUserInfo.unionid,
        // 如果用户没有头像，使用微信头像
        avatar: req.user.avatar || wechatUserInfo.avatar,
        // 如果用户没有昵称，使用微信昵称
        nickname: req.user.nickname || wechatUserInfo.nickname
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: '微信绑定成功',
      data: { user }
    });
  } catch (error) {
    console.error('微信绑定失败:', error);
    res.status(400).json({
      success: false,
      message: error.message || '微信绑定失败'
    });
  }
}));

// 解绑微信
router.post('/unbind-wechat', asyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    // 检查用户是否有其他登录方式
    if (!req.user.phone && !req.user.email) {
      return res.status(400).json({
        success: false,
        message: '请先绑定手机号或邮箱，以免无法登录'
      });
    }

    // 解绑微信
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          wechatOpenId: 1,
          wechatUnionId: 1
        }
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: '微信解绑成功',
      data: { user }
    });
  } catch (error) {
    console.error('微信解绑失败:', error);
    res.status(500).json({
      success: false,
      message: '微信解绑失败'
    });
  }
}));

// 邮箱注册（保留兼容性）
router.post('/register-email', [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('用户名长度必须在3-30个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('密码至少8个字符'),
  body('displayName')
    .isLength({ min: 1, max: 50 })
    .withMessage('显示名称长度必须在1-50个字符之间')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { username, email, password, displayName } = req.body;

  // 检查用户是否已存在
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: existingUser.email === email ? '邮箱已被注册' : '用户名已被使用'
    });
  }

  // 生成邮箱验证token
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时

  // 创建用户
  const user = await User.create({
    username,
    email,
    password,
    displayName,
    emailVerificationToken,
    emailVerificationExpires
  });

  // 生成JWT token
  const token = generateToken(user._id);

  // 发送验证邮件
  try {
    await sendVerificationEmail(user.email, emailVerificationToken);
  } catch (error) {
    console.error('发送验证邮件失败:', error);
  }

  res.status(201).json({
    success: true,
    message: '注册成功，请查收验证邮件',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      },
      token
    }
  });
}));

// 邮箱登录（保留兼容性）
router.post('/login-email', [
  body('email').isEmail().withMessage('请输入有效的邮箱地址'),
  body('password').notEmpty().withMessage('密码不能为空')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  // 查找用户
  const user = await User.findByEmail(email).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: '邮箱或密码错误'
    });
  }

  // 检查账户是否被锁定
  if (user.isLocked) {
    return res.status(423).json({
      success: false,
      message: '账户已被锁定，请稍后再试'
    });
  }

  // 验证密码
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    await user.incrementLoginAttempts();
    
    return res.status(401).json({
      success: false,
      message: '邮箱或密码错误'
    });
  }

  // 重置登录失败次数
  await user.resetLoginAttempts();

  // 更新最后登录时间
  user.lastLogin = new Date();
  await user.save();

  // 生成JWT token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: '登录成功',
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
        isCreator: user.isCreator,
        emailVerified: user.emailVerified
      },
      token
    }
  });
}));

// 邮箱验证
router.get('/verify-email/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: '验证链接无效或已过期'
    });
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: '邮箱验证成功'
  });
}));

// 忘记密码 - 邮箱方式（保留兼容性）
router.post('/forgot-password-email', [
  body('email').isEmail().withMessage('请输入有效的邮箱地址')
], asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findByEmail(email);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: '该邮箱未注册'
    });
  }

  // 生成重置token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1小时

  user.passwordResetToken = resetToken;
  user.passwordResetExpires = resetExpires;
  await user.save();

  // 发送重置邮件
  try {
    await sendPasswordResetEmail(user.email, resetToken);
    
    res.json({
      success: true,
      message: '密码重置邮件已发送'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(500).json({
      success: false,
      message: '邮件发送失败，请稍后重试'
    });
  }
}));

// 重置密码 - Token方式（保留兼容性）
router.post('/reset-password/:token', [
  body('password')
    .isLength({ min: 8 })
    .withMessage('密码至少8个字符')
], asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: '重置链接无效或已过期'
    });
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: '密码重置成功'
  });
}));

// 获取当前用户信息
router.get('/me', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未提供认证token'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: '无效的token'
    });
  }
}));

// 退出登录
router.post('/logout', asyncHandler(async (req, res) => {
  // 清除cookie中的token（如果使用）
  res.clearCookie('token');
  
  res.json({
    success: true,
    message: '退出登录成功'
  });
}));

module.exports = router; 