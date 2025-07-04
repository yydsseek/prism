const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware, requireCreator } = require('../middleware/auth');
const uploadService = require('../services/uploadService');

const router = express.Router();

// 获取用户资料
router.get('/profile', authMiddleware, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('subscriberCount')
    .populate('postCount');

  res.json({
    success: true,
    data: { user }
  });
}));

// 更新用户资料
router.put('/profile', authMiddleware, [
  body('displayName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('显示名称长度必须在1-50个字符之间'),
  body('nickname')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('昵称长度必须在1-20个字符之间'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('个人简介最多500个字符'),
  body('website')
    .optional()
    .isURL()
    .withMessage('请输入有效的网站地址'),
  body('socialLinks.twitter')
    .optional()
    .isURL()
    .withMessage('请输入有效的Twitter链接'),
  body('socialLinks.linkedin')
    .optional()
    .isURL()
    .withMessage('请输入有效的LinkedIn链接'),
  body('socialLinks.github')
    .optional()
    .isURL()
    .withMessage('请输入有效的GitHub链接'),
  body('socialLinks.wechat')
    .optional()
    .isLength({ max: 50 })
    .withMessage('微信号最多50个字符')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    displayName,
    nickname,
    bio,
    avatar,
    coverImage,
    website,
    socialLinks,
    preferences
  } = req.body;

  const updateData = {};
  
  if (displayName !== undefined) updateData.displayName = displayName;
  if (nickname !== undefined) updateData.nickname = nickname;
  if (bio !== undefined) updateData.bio = bio;
  if (avatar !== undefined) updateData.avatar = avatar;
  if (coverImage !== undefined) updateData.coverImage = coverImage;
  if (website !== undefined) updateData.website = website;
  if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
  if (preferences !== undefined) updateData.preferences = preferences;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  res.json({
    success: true,
    message: '资料更新成功',
    data: { user }
  });
}));

// 用户信息设置（注册后的完善流程）
router.post('/setup-profile', authMiddleware, [
  body('nickname')
    .notEmpty()
    .withMessage('昵称是必需的')
    .isLength({ min: 2, max: 20 })
    .withMessage('昵称长度必须在2-20个字符之间'),
  body('bio')
    .optional()
    .isLength({ max: 200 })
    .withMessage('个人简介最多200个字符'),
  // 工作信息验证
  // body('workPosition')
  //   .optional()
  //   .isLength({ max: 50 })
  //   .withMessage('职位最多50个字符'),
  // body('workCompany')
  //   .optional()
  //   .isLength({ max: 50 })
  //   .withMessage('公司名称最多50个字符'),
  // body('workIndustry')
  //   .optional()
  //   .isIn([
  //     'technology', 'finance', 'healthcare', 'education', 'retail',
  //     'manufacturing', 'real_estate', 'energy', 'media', 'entertainment',
  //     'automotive', 'agriculture', 'consulting', 'government', 'nonprofit', 'other'
  //   ])
  //   .withMessage('请选择有效的行业'),
  // body('workExperience')
  //   .optional()
  //   .isLength({ max: 1000 })
  //   .withMessage('工作经历描述最多1000个字符'),
  // body('workYears')
  //   .optional()
  //   .isInt({ min: 0, max: 50 })
  //   .withMessage('工作年限必须在0-50年之间'),
  // // 投资信息验证
  // body('investmentExperience')
  //   .optional()
  //   .isLength({ max: 1000 })
  //   .withMessage('投资经历描述最多1000个字符'),
  // body('investmentIndustries')
  //   .optional()
  //   .isArray()
  //   .withMessage('投资行业必须是数组'),
  // body('investmentStage')
  //   .optional()
  //   .isArray()
  //   .withMessage('投资阶段必须是数组'),
  // body('investmentSize')
  //   .optional()
  //   .isIn(['under_10w', '10w_50w', '50w_100w', '100w_500w', '500w_1000w', 'over_1000w'])
  //   .withMessage('请选择有效的投资规模'),
  // body('investmentYears')
  //   .optional()
  //   .isInt({ min: 0, max: 50 })
  //   .withMessage('投资年限必须在0-50年之间')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    nickname,
    avatar,
    bio,
    workPosition,
    workCompany,
    workIndustry,
    workExperience,
    workYears,
    investmentExperience,
    investmentIndustries,
    investmentStage,
    investmentSize,
    investmentYears
  } = req.body;

  // 构建更新数据
  const updateData = {
    nickname,
    bio: bio || ''
  };

  if (avatar) updateData.avatar = avatar;

  // 工作信息
  if (workPosition || workCompany || workIndustry || workExperience || workYears) {
    updateData.workInfo = {
      position: workPosition,
      company: workCompany,
      industry: workIndustry,
      experience: workExperience,
      yearsOfExperience: workYears
    };
  }

  // 投资信息
  if (investmentExperience || investmentIndustries || investmentStage || investmentSize || investmentYears) {
    updateData.investmentInfo = {
      experience: investmentExperience,
      industries: investmentIndustries || [],
      investmentStage: investmentStage || [],
      investmentSize: investmentSize,
      yearsOfExperience: investmentYears
    };
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  // 检查并更新资料完善状态
  const profileStatus = user.checkProfileCompletion();
  if (profileStatus.profileCompleted !== user.profileCompleted) {
    user.profileCompleted = profileStatus.profileCompleted;
    await user.save();
  }

  res.json({
    success: true,
    message: '用户信息设置成功',
    data: { user }
  });
}));

// 检查用户资料完善状态
router.get('/profile-status', authMiddleware, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const profileStatus = user.checkProfileCompletion();

  res.json({
    success: true,
    data: profileStatus
  });
}));

// 上传头像
router.post('/upload-avatar', authMiddleware, asyncHandler(async (req, res) => {
  const upload = uploadService.getMulterConfig('avatar').single('avatar');
  
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的头像文件'
      });
    }

    try {
      // 验证文件
      const validation = uploadService.validateImageFile(req.file);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.errors.join(', ')
        });
      }

      // 处理头像
      const result = await uploadService.processAvatar(req.file, req.user._id);

      if (result.success) {
        // 更新用户头像
        const user = await User.findByIdAndUpdate(
          req.user._id,
          { avatar: result.url },
          { new: true }
        ).select('-password');

        res.json({
          success: true,
          message: '头像上传成功',
          data: {
            avatarUrl: result.url,
            user
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: '头像处理失败'
        });
      }
    } catch (error) {
      console.error('头像上传失败:', error);
      res.status(500).json({
        success: false,
        message: '头像上传失败'
      });
    }
  });
}));

// 上传封面图
router.post('/upload-cover', authMiddleware, asyncHandler(async (req, res) => {
  const upload = uploadService.getMulterConfig('cover').single('cover');
  
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的封面图片'
      });
    }

    try {
      const result = await uploadService.processCover(req.file, req.user._id);

      if (result.success) {
        // 更新用户封面图
        const user = await User.findByIdAndUpdate(
          req.user._id,
          { coverImage: result.url },
          { new: true }
        ).select('-password');

        res.json({
          success: true,
          message: '封面图上传成功',
          data: {
            coverUrl: result.url,
            user
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: '封面图处理失败'
        });
      }
    } catch (error) {
      console.error('封面图上传失败:', error);
      res.status(500).json({
        success: false,
        message: '封面图上传失败'
      });
    }
  });
}));

// 修改密码
router.put('/change-password', authMiddleware, [
  body('currentPassword')
    .notEmpty()
    .withMessage('请输入当前密码'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('新密码至少8个字符')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('新密码必须包含字母和数字')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { currentPassword, newPassword } = req.body;

  // 获取用户（包含密码）
  const user = await User.findById(req.user._id).select('+password');

  // 验证当前密码
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: '当前密码错误'
    });
  }

  // 检查新密码是否与当前密码相同
  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    return res.status(400).json({
      success: false,
      message: '新密码不能与当前密码相同'
    });
  }

  // 更新密码
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: '密码修改成功'
  });
}));

// 修改手机号
router.put('/change-phone', authMiddleware, [
  body('newPhone')
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号'),
  body('verificationCode')
    .isLength({ min: 6, max: 6 })
    .withMessage('验证码必须是6位数字'),
  body('password')
    .notEmpty()
    .withMessage('请输入密码')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { newPhone, verificationCode, password } = req.body;

  // 获取用户（包含密码）
  const user = await User.findById(req.user._id).select('+password');

  // 验证密码
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(400).json({
      success: false,
      message: '密码错误'
    });
  }

  // 检查新手机号是否已被使用
  const existingUser = await User.findByPhone(newPhone);
  if (existingUser && existingUser._id.toString() !== user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: '该手机号已被其他用户使用'
    });
  }

  // 验证验证码
  if (!user.verificationCode || 
      user.verificationCode !== verificationCode || 
      user.verificationCodeExpires < new Date() ||
      user.verificationCodeType !== 'change_phone') {
    return res.status(400).json({
      success: false,
      message: '验证码错误或已过期'
    });
  }

  // 更新手机号
  user.phone = newPhone;
  user.phoneVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  user.verificationCodeType = undefined;
  await user.save();

  res.json({
    success: true,
    message: '手机号修改成功',
    data: { user: user.toJSON() }
  });
}));

// 成为创作者
router.post('/become-creator', authMiddleware, [
  body('title')
    .isLength({ min: 1, max: 100 })
    .withMessage('创作者标题长度必须在1-100个字符之间'),
  body('description')
    .isLength({ min: 10, max: 1000 })
    .withMessage('创作者描述长度必须在10-1000个字符之间'),
  body('subscriptionPrice')
    .isFloat({ min: 0 })
    .withMessage('订阅价格不能为负数')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { title, description, subscriptionPrice } = req.body;

  if (req.user.isCreator) {
    return res.status(400).json({
      success: false,
      message: '您已经是创作者了'
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      isCreator: true,
      'creatorProfile.title': title,
      'creatorProfile.description': description,
      'creatorProfile.subscriptionPrice': subscriptionPrice,
      'creatorProfile.isActive': true
    },
    { new: true, runValidators: true }
  ).select('-password');

  res.json({
    success: true,
    message: '创作者账户创建成功',
    data: { user }
  });
}));

// 更新创作者资料
router.put('/creator-profile', authMiddleware, [
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('创作者标题长度必须在1-100个字符之间'),
  body('description')
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage('创作者描述长度必须在10-1000个字符之间'),
  body('subscriptionPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('订阅价格不能为负数')
], requireCreator, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { title, description, subscriptionPrice, isActive } = req.body;

  const updateData = {};
  if (title !== undefined) updateData['creatorProfile.title'] = title;
  if (description !== undefined) updateData['creatorProfile.description'] = description;
  if (subscriptionPrice !== undefined) updateData['creatorProfile.subscriptionPrice'] = subscriptionPrice;
  if (isActive !== undefined) updateData['creatorProfile.isActive'] = isActive;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  res.json({
    success: true,
    message: '创作者资料更新成功',
    data: { user }
  });
}));

// 获取创作者统计信息
router.get('/creator-stats', authMiddleware, requireCreator, asyncHandler(async (req, res) => {
  const Subscription = require('../models/Subscription');
  const Post = require('../models/Post');

  const [subscriberCount, postCount, activeSubscriptions] = await Promise.all([
    Subscription.countDocuments({ creator: req.user._id, status: 'active' }),
    Post.countDocuments({ author: req.user._id, status: 'published' }),
    Subscription.find({ creator: req.user._id, status: 'active' })
  ]);

  // 计算总收入（简化计算）
  const totalEarnings = activeSubscriptions.reduce((total, sub) => {
    return total + (sub.amount || 0);
  }, 0);

  const stats = {
    subscriberCount,
    postCount,
    totalEarnings,
    activeSubscriptions: activeSubscriptions.length
  };

  res.json({
    success: true,
    data: { stats }
  });
}));

// 获取订阅者列表
router.get('/subscribers', authMiddleware, requireCreator, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status = 'active' } = req.query;
  const skip = (page - 1) * limit;

  const Subscription = require('../models/Subscription');

  const subscriptions = await Subscription.find({
    creator: req.user._id,
    status
  })
    .populate('subscriber', 'username displayName avatar email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Subscription.countDocuments({
    creator: req.user._id,
    status
  });

  res.json({
    success: true,
    data: {
      subscriptions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasMore: skip + subscriptions.length < total
      }
    }
  });
}));

// 删除账户
router.delete('/account', authMiddleware, [
  body('password')
    .notEmpty()
    .withMessage('请输入密码确认删除')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { password } = req.body;

  // 获取用户（包含密码）
  const user = await User.findById(req.user._id).select('+password');

  // 验证密码
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(400).json({
      success: false,
      message: '密码错误'
    });
  }

  // 级联删除相关数据
  try {
    // 删除用户的文章
    const Post = require('../models/Post');
    await Post.deleteMany({ author: req.user._id });

    // 删除订阅关系（作为订阅者）
    const Subscription = require('../models/Subscription');
    await Subscription.deleteMany({ subscriber: req.user._id });

    // 取消他人对该用户的订阅（作为创作者）
    await Subscription.deleteMany({ creator: req.user._id });

    // 删除通知记录
    const Notification = require('../models/Notification');
    await Notification.deleteMany({ user: req.user._id });

    // 删除支付记录（如果有支付模型）
    // const Payment = require('../models/Payment');
    // await Payment.deleteMany({ user: req.user._id });

    // 删除评论（如果文章模型有评论字段）
    // await Post.updateMany(
    //   { 'comments.author': req.user._id },
    //   { $pull: { comments: { author: req.user._id } } }
    // );

    // 删除点赞记录（如果文章模型有点赞字段）
    // await Post.updateMany(
    //   { likes: req.user._id },
    //   { $pull: { likes: req.user._id } }
    // );

    // 清理上传的文件
    const fs = require('fs').promises;
    const path = require('path');

    // 删除头像文件
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      try {
        const avatarPath = path.join(__dirname, '../../', user.avatar);
        await fs.unlink(avatarPath);
      } catch (error) {
        console.error('删除头像文件失败:', error);
      }
    }

    // 删除封面图文件
    if (user.coverImage && user.coverImage.startsWith('/uploads/')) {
      try {
        const coverPath = path.join(__dirname, '../../', user.coverImage);
        await fs.unlink(coverPath);
      } catch (error) {
        console.error('删除封面图文件失败:', error);
      }
    }

    // 删除用户上传目录
    try {
      const userUploadDir = path.join(__dirname, '../../uploads', req.user._id.toString());
      await uploadService.cleanupUserFiles(req.user._id.toString());
    } catch (error) {
      console.error('清理用户文件失败:', error);
    }

    // 最后删除用户
    await User.findByIdAndDelete(req.user._id);

    console.log(`用户账户删除成功: ${user.phone || user.email || user.username}`);

    res.json({
      success: true,
      message: '账户删除成功'
    });
  } catch (error) {
    console.error('删除账户时发生错误:', error);
    res.status(500).json({
      success: false,
      message: '删除账户失败，请稍后重试'
    });
  }
}));

module.exports = router; 