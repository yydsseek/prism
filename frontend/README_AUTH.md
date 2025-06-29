# 认证系统文档

本文档详细说明了 Prism 平台的认证系统，包括所有认证相关的页面和功能。

## 概览

Prism 平台采用手机号验证的认证系统，支持密码登录、验证码登录和微信登录。注册流程经过简化，只需要手机号和密码，注册后引导用户完善个人信息。

## 认证流程

### 1. 注册流程

**页面**: `/register`

**简化注册步骤**:
1. 输入手机号
2. 设置密码（需包含大小写字母和数字，至少8位）
3. 确认密码
4. 获取并输入手机验证码
5. 同意服务条款
6. 提交注册

**注册成功后**:
- 自动登录并获取JWT token
- 跳转到用户信息设置页面 (`/profile-setup`)

**特点**:
- 移除了用户名和显示名称字段
- 注册过程更加简洁
- 强制引导完善个人信息

### 2. 用户信息设置流程

**页面**: `/profile-setup`

**三步设置流程**:

#### 第一步：基本信息（必填）
- 昵称（必填，2-20个字符）
- 头像上传（可选，支持图片文件，最大5MB）
- 个人简介（可选，最多200字符）

#### 第二步：工作信息（可选但建议完整填写）
- 职位
- 公司
- 行业（从预定义列表选择）
- 工作年限
- 工作经历描述

#### 第三步：投资信息（可选但建议完整填写）
- 投资经历描述
- 投资行业标签（多选）
- 投资阶段偏好（多选）
- 投资规模
- 投资年限

**验证规则**:
- 第一步的昵称为必填项
- 第二步和第三步为可选，但如果开始填写则需要完整填写
- 支持跳过功能，但会影响用户的 `profileCompleted` 状态

**完成后**:
- 跳转到用户仪表板 (`/dashboard`)
- 更新用户的 `profileCompleted` 状态

### 3. 登录流程

**页面**: `/login`

**双重登录方式**:

#### 密码登录
1. 输入手机号
2. 输入密码
3. 点击登录

#### 验证码登录
1. 输入手机号
2. 获取验证码
3. 输入验证码
4. 点击验证码登录

**微信登录**:
- 点击微信登录按钮
- 跳转到微信授权页面
- 授权成功后自动登录

### 4. 忘记密码流程

**页面**: `/forgot-password`

**四步重置流程**:
1. 输入手机号
2. 获取并输入验证码
3. 设置新密码
4. 完成重置

### 5. 密码重置流程

**页面**: `/reset-password/[token]`

**通过邮件链接重置**:
1. 验证token有效性
2. 输入新密码
3. 确认密码
4. 提交重置

## 页面功能详解

### 注册页面 (`/register`)

**主要功能**:
- 手机号验证（实时验证格式）
- 密码强度验证（大小写字母+数字+8位以上）
- 密码确认验证（实时对比）
- 验证码发送和验证
- 服务条款同意确认

**错误处理**:
- 手机号格式错误
- 手机号已注册
- 密码强度不够
- 密码不一致
- 验证码错误或过期
- 网络连接失败

**开发功能**:
- 错误测试按钮（仅开发环境）
- 实时表单验证
- 倒计时重发验证码

### 用户信息设置页面 (`/profile-setup`)

**主要功能**:
- 三步向导式设置
- 进度条显示
- 头像上传和预览
- 行业和投资阶段多选
- 表单验证和错误提示
- 支持跳过功能

**数据结构**:
```typescript
interface UserProfileSetupForm {
  nickname: string // 必填
  avatar?: string
  bio?: string
  // 工作信息
  workPosition?: string
  workCompany?: string
  workIndustry?: string
  workExperience?: string
  workYears?: number
  // 投资信息
  investmentExperience?: string
  investmentIndustries?: string[]
  investmentStage?: string[]
  investmentSize?: string
  investmentYears?: number
}
```

**行业选项**:
- 科技、金融、医疗健康、教育、零售
- 制造业、房地产、能源、媒体、娱乐
- 汽车、农业、咨询、政府、非营利、其他

**投资阶段选项**:
- 种子轮、天使轮、Pre-A轮、A轮、B轮
- C轮、D轮及以后、IPO前、公开市场
- 私募股权、房地产投资、数字货币

### 登录页面 (`/login`)

**主要功能**:
- 双重登录模式切换
- 手机号验证
- 密码可见性切换
- 验证码倒计时
- 记住登录状态
- 微信登录集成

**状态管理**:
- 登录模式切换（password/code）
- 表单数据管理
- 错误状态处理
- 加载状态显示

### 忘记密码页面 (`/forgot-password`)

**主要功能**:
- 多步骤流程管理
- 手机号验证
- 验证码发送和验证
- 密码重置
- 成功状态显示

**步骤流程**:
1. `phone` - 输入手机号
2. `code` - 验证手机号
3. `password` - 设置新密码
4. `success` - 完成重置

### 密码重置页面 (`/reset-password/[token]`)

**主要功能**:
- Token有效性验证
- 密码强度验证
- 密码确认验证
- 重置状态管理

### 用户仪表板 (`/dashboard`)

**主要功能**:
- 用户信息展示
- 工作和投资信息概览
- 快速操作按钮
- 资料完善提醒
- 退出登录功能

**信息展示**:
- 基本信息卡片（手机号、邮箱、完善状态）
- 工作信息卡片（职位、公司、行业）
- 投资信息卡片（经历、关注行业、投资阶段）

## API 集成

### 认证相关 API

```typescript
// 简化注册
register(data: { phone: string; password: string; verificationCode?: string })

// 用户信息设置
setupProfile(data: UserProfileSetupForm)

// 检查资料完善状态
checkProfileStatus(): { profileCompleted: boolean; missingFields: string[] }

// 上传头像
uploadAvatar(file: File): { avatarUrl: string }
```

### 验证码相关 API

```typescript
// 发送验证码
sendVerificationCode(phone: string, type: 'register' | 'login' | 'reset_password')

// 验证码登录
loginWithCode(phone: string, verificationCode: string)

// 验证码重置密码
resetPasswordWithCode(phone: string, verificationCode: string, password: string)
```

## 状态管理

### AuthContext 更新

```typescript
interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (phone: string, password: string) => Promise<void>
  loginWithCode: (phone: string, verificationCode: string) => Promise<void>
  register: (data: { phone: string; password: string; verificationCode?: string }) => Promise<void>
  setupProfile: (data: UserProfileSetupForm) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  sendVerificationCode: (phone: string, type: 'register' | 'login' | 'reset_password') => Promise<void>
  checkProfileStatus: () => Promise<{ profileCompleted: boolean; missingFields: string[] }>
}
```

### 用户数据结构

```typescript
interface User {
  id: string
  username?: string // 可选，注册时不设置
  phone: string
  email?: string
  displayName?: string // 可选，后续设置
  nickname?: string // 昵称字段
  bio?: string
  avatar?: string
  // 工作信息
  workInfo?: {
    position?: string
    company?: string
    industry?: string
    experience?: string
    yearsOfExperience?: number
  }
  // 投资信息
  investmentInfo?: {
    experience?: string
    industries?: string[]
    investmentStage?: string[]
    investmentSize?: string
    yearsOfExperience?: number
  }
  profileCompleted: boolean // 资料完善状态
  phoneVerified: boolean
  emailVerified?: boolean
  // ... 其他字段
}
```

## 路由保护

### 认证路由

- `/login` - 登录页面
- `/register` - 注册页面
- `/forgot-password` - 忘记密码
- `/reset-password/[token]` - 密码重置
- `/profile-setup` - 用户信息设置

### 保护路由

- `/dashboard` - 需要登录
- 其他业务页面 - 需要登录和资料完善

## 错误处理

### 统一错误处理

```typescript
// API错误分类处理
if (errorMessage.includes('手机号') || errorMessage.includes('phone')) {
  setErrors({ phone: errorMessage })
} else if (errorMessage.includes('密码') || errorMessage.includes('password')) {
  setErrors({ password: errorMessage })
} else if (errorMessage.includes('验证码') || errorMessage.includes('code')) {
  setErrors({ verificationCode: errorMessage })
} else {
  setErrors({ general: errorMessage })
}
```

### 网络错误处理

- 自动重试机制
- 友好的错误提示
- 网络状态检测

## 安全特性

### 前端安全

- 输入验证和清理
- XSS 防护
- CSRF 保护
- 安全的密码处理

### 认证安全

- JWT token 管理
- 自动token刷新
- 安全的存储机制
- 登录状态检查

## 用户体验

### 响应式设计

- 移动端适配
- 触摸友好的界面
- 快速加载优化

### 交互体验

- 实时表单验证
- 友好的错误提示
- 加载状态指示
- 成功状态反馈

### 可访问性

- 键盘导航支持
- 屏幕阅读器兼容
- 颜色对比度优化
- 语义化HTML结构

## 开发工具

### 开发环境功能

- 认证页面导航组件
- 错误测试按钮
- 开发环境提示
- 调试信息显示

### 测试支持

- 模拟API响应
- 错误场景测试
- 边界条件验证
- 用户流程测试

## 部署注意事项

### 环境变量

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 构建优化

- 代码分割
- 懒加载
- 图片优化
- 缓存策略

这个认证系统提供了完整的用户注册、登录、信息设置和管理功能，注重用户体验和安全性，支持现代化的认证需求。 