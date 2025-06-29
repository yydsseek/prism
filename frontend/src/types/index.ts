// 用户相关类型
export interface User {
  id: string
  username?: string
  phone: string
  email?: string
  displayName?: string
  nickname?: string
  bio?: string
  avatar?: string
  coverImage?: string
  website?: string
  socialLinks?: {
    twitter?: string
    linkedin?: string
    github?: string
    wechat?: string
  }
  workInfo?: {
    position?: string
    company?: string
    industry?: string
    experience?: string
    yearsOfExperience?: number
  }
  investmentInfo?: {
    experience?: string
    industries?: string[]
    investmentStage?: string[]
    investmentSize?: string
    yearsOfExperience?: number
  }
  isCreator: boolean
  creatorProfile?: {
    title?: string
    description?: string
    subscriptionPrice: number
    isActive: boolean
  }
  phoneVerified: boolean
  emailVerified?: boolean
  profileCompleted: boolean
  preferences: {
    emailNotifications: boolean
    pushNotifications: boolean
    newsletter: boolean
    smsNotifications: boolean
  }
  subscriberCount?: number
  postCount?: number
  createdAt: string
  updatedAt: string
}

// 文章相关类型
export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  author: User
  status: 'draft' | 'published' | 'archived'
  visibility: 'public' | 'subscribers' | 'private'
  featuredImage?: string
  tags: string[]
  category: string
  readingTime: number
  wordCount: number
  views: number
  likes: string[]
  likeCount: number
  comments: Comment[]
  commentCount: number
  seo?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string[]
  }
  publishedAt?: string
  isPinned: boolean
  allowComments: boolean
  monetization: {
    isPaid: boolean
    price: number
  }
  createdAt: string
  updatedAt: string
}

// 评论类型
export interface Comment {
  id: string
  user: User
  content: string
  createdAt: string
  isEdited: boolean
}

// 订阅相关类型
export interface Subscription {
  id: string
  subscriber: User
  creator: User
  status: 'active' | 'cancelled' | 'expired' | 'pending'
  plan: 'free' | 'monthly' | 'yearly'
  amount: number
  currency: string
  startDate: string
  endDate?: string
  nextBillingDate?: string
  stripeSubscriptionId?: string
  autoRenew: boolean
  cancelledAt?: string
  cancellationReason?: string
  isActive: boolean
  daysRemaining?: number
  createdAt: string
  updatedAt: string
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  errors?: Array<{
    field?: string
    message: string
  }>
  message?: string
}

// 分页类型
export interface Pagination {
  current: number
  pages: number
  total: number
  hasMore?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: Pagination
}

// 表单类型
export interface LoginForm {
  phone: string
  password: string
}

export interface RegisterForm {
  phone: string
  password: string
  verificationCode?: string
}

export interface PostForm {
  title: string
  content: string
  excerpt?: string
  category?: string
  tags?: string[]
  visibility?: 'public' | 'subscribers' | 'private'
  status?: 'draft' | 'published'
  featuredImage?: string
  seo?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string[]
  }
}

export interface UserProfileForm {
  displayName: string
  bio?: string
  avatar?: string
  coverImage?: string
  website?: string
  socialLinks?: {
    twitter?: string
    linkedin?: string
    github?: string
    wechat?: string
  }
}

export interface CreatorProfileForm {
  title: string
  description: string
  subscriptionPrice: number
}

// 支付相关类型
export interface PaymentIntent {
  clientSecret: string
  paymentIntentId: string
}

export interface PaymentMethod {
  id: string
  type: string
  card?: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
}

// 通知类型
export interface Notification {
  id: string
  user: string
  type: 'new_post' | 'new_subscriber' | 'payment' | 'comment'
  title: string
  message: string
  read: boolean
  data?: any
  createdAt: string
}

// 统计类型
export interface CreatorStats {
  subscriberCount: number
  postCount: number
  totalEarnings: number
}

export interface SubscriptionStats {
  activeSubscriptions: number
  totalSpent: number
  expiringSoon: number
}

// 搜索和过滤类型
export interface PostFilters {
  author?: string
  category?: string
  tag?: string
  search?: string
  status?: string
  page?: number
  limit?: number
}

export interface UserFilters {
  search?: string
  isCreator?: boolean
  page?: number
  limit?: number
}

// 手机验证相关类型
export interface PhoneVerificationForm {
  phone: string
  verificationCode: string
}

export interface SendVerificationCodeForm {
  phone: string
  type: 'register' | 'login' | 'reset_password'
}

// 用户信息设置表单
export interface UserProfileSetupForm {
  nickname: string
  avatar?: string
  bio?: string
  workPosition?: string
  workCompany?: string
  workIndustry?: string
  workExperience?: string
  workYears?: number
  investmentExperience?: string
  investmentIndustries?: string[]
  investmentStage?: string[]
  investmentSize?: string
  investmentYears?: number
}

// 行业和投资相关选项
export interface IndustryOption {
  value: string
  label: string
}

export interface InvestmentStageOption {
  value: string
  label: string
}

// 常用的行业选项
export const INDUSTRY_OPTIONS: IndustryOption[] = [
  { value: 'technology', label: '科技' },
  { value: 'finance', label: '金融' },
  { value: 'healthcare', label: '医疗健康' },
  { value: 'education', label: '教育' },
  { value: 'retail', label: '零售' },
  { value: 'manufacturing', label: '制造业' },
  { value: 'real_estate', label: '房地产' },
  { value: 'energy', label: '能源' },
  { value: 'media', label: '媒体' },
  { value: 'entertainment', label: '娱乐' },
  { value: 'automotive', label: '汽车' },
  { value: 'agriculture', label: '农业' },
  { value: 'consulting', label: '咨询' },
  { value: 'government', label: '政府' },
  { value: 'nonprofit', label: '非营利' },
  { value: 'other', label: '其他' }
]

// 投资阶段选项
export const INVESTMENT_STAGE_OPTIONS: InvestmentStageOption[] = [
  { value: 'seed', label: '种子轮' },
  { value: 'angel', label: '天使轮' },
  { value: 'pre_a', label: 'Pre-A轮' },
  { value: 'series_a', label: 'A轮' },
  { value: 'series_b', label: 'B轮' },
  { value: 'series_c', label: 'C轮' },
  { value: 'series_d', label: 'D轮及以后' },
  { value: 'ipo', label: 'IPO前' },
  { value: 'public', label: '公开市场' },
  { value: 'private_equity', label: '私募股权' },
  { value: 'real_estate', label: '房地产投资' },
  { value: 'cryptocurrency', label: '数字货币' }
] 