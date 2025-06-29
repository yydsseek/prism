import axios, { AxiosResponse } from 'axios'
import { 
  ApiResponse, 
  User, 
  Post, 
  Subscription, 
  LoginForm, 
  RegisterForm,
  PostForm,
  UserProfileForm,
  UserProfileSetupForm,
  CreatorProfileForm,
  PaginatedResponse,
  PostFilters,
  CreatorStats,
  SubscriptionStats,
  PaymentIntent,
  PaymentMethod,
  PhoneVerificationForm,
  SendVerificationCodeForm
} from '@/types'

// 创建axios实例
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 10000,
})

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，清除本地存储
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        // 只有在非登录/注册页面时才自动跳转
        const currentPath = window.location.pathname
        const isAuthPage = currentPath.includes('/login') || 
                          currentPath.includes('/register') || 
                          currentPath.includes('/forgot-password') ||
                          currentPath.includes('/reset-password') ||
                          currentPath.includes('/profile-setup')
        
        if (!isAuthPage) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// 通用请求函数
async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: any
): Promise<ApiResponse<T>> {
  try {
    const response = await api.request({
      method,
      url,
      data,
    })
    return response.data
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data
    }
    return {
      success: false,
      error: error.message || '网络错误',
    }
  }
}

// 认证API
export const authApi = {
  // 手机号密码登录
  login: (data: LoginForm) => 
    request<{ user: User; token: string }>('POST', '/auth/login', data),
  
  // 手机号注册（简化版）
  register: (data: RegisterForm) => 
    request<{ user: User; token: string }>('POST', '/auth/register', data),
  
  // 发送验证码
  sendVerificationCode: (data: SendVerificationCodeForm) => 
    request('POST', '/auth/send-verification-code', data),
  
  // 验证手机号
  verifyPhone: (data: PhoneVerificationForm) => 
    request<{ user: User; token: string }>('POST', '/auth/verify-phone', data),
  
  // 手机号验证码登录
  loginWithCode: (data: PhoneVerificationForm) => 
    request<{ user: User; token: string }>('POST', '/auth/login-with-code', data),
  
  logout: () => 
    request('POST', '/auth/logout'),
  
  getMe: () => 
    request<{ user: User }>('GET', '/auth/me'),
  
  // 忘记密码 - 通过手机号
  forgotPassword: (phone: string) => 
    request('POST', '/auth/forgot-password', { phone }),
  
  // 重置密码 - 通过验证码
  resetPasswordWithCode: (phone: string, verificationCode: string, password: string) => 
    request('POST', '/auth/reset-password-with-code', { phone, verificationCode, password }),
  
  // 重置密码 - 通过token（保留兼容性）
  resetPassword: (token: string, password: string) => 
    request('POST', `/auth/reset-password/${token}`, { password }),
  
  // 验证邮箱（可选功能）
  verifyEmail: (token: string) => 
    request('GET', `/auth/verify-email/${token}`),
  
  // 重新发送验证码
  resendVerificationCode: (phone: string, type: 'register' | 'login' | 'reset_password') => 
    request('POST', '/auth/resend-verification-code', { phone, type }),
  
  // 微信登录相关
  wechatLogin: (code: string) => 
    request<{ user: User; token: string }>('POST', '/auth/wechat-login', { code }),
  
  // 绑定微信
  bindWechat: (code: string) => 
    request<{ user: User }>('POST', '/auth/bind-wechat', { code }),
  
  // 解绑微信
  unbindWechat: () => 
    request<{ user: User }>('POST', '/auth/unbind-wechat'),
}

// 用户API
export const userApi = {
  getProfile: () => 
    request<{ user: User }>('GET', '/users/profile'),
  
  updateProfile: (data: UserProfileForm) => 
    request<{ user: User }>('PUT', '/users/profile', data),
  
  // 用户信息设置（注册后的完善流程）
  setupProfile: (data: UserProfileSetupForm) => 
    request<{ user: User }>('POST', '/users/setup-profile', data),
  
  // 检查用户资料完善状态
  checkProfileStatus: () => 
    request<{ profileCompleted: boolean; missingFields: string[] }>('GET', '/users/profile-status'),
  
  // 上传头像
  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return request<{ avatarUrl: string }>('POST', '/users/upload-avatar', formData)
  },
  
  changePassword: (currentPassword: string, newPassword: string) => 
    request('PUT', '/users/change-password', { currentPassword, newPassword }),
  
  // 修改手机号
  changePhone: (newPhone: string, verificationCode: string, password: string) => 
    request<{ user: User }>('PUT', '/users/change-phone', { newPhone, verificationCode, password }),
  
  becomeCreator: (data: CreatorProfileForm) => 
    request<{ user: User }>('POST', '/users/become-creator', data),
  
  updateCreatorProfile: (data: Partial<CreatorProfileForm>) => 
    request<{ user: User }>('PUT', '/users/creator-profile', data),
  
  getCreatorStats: () => 
    request<{ stats: CreatorStats }>('GET', '/users/creator-stats'),
  
  getSubscribers: (params?: { page?: number; limit?: number; status?: string }) => 
    request<PaginatedResponse<Subscription>>('GET', '/users/subscribers', params),
  
  deleteAccount: (password: string) => 
    request('DELETE', '/users/account', { password }),
}

// 文章API
export const postApi = {
  getPosts: (filters?: PostFilters) => 
    request<PaginatedResponse<Post>>('GET', '/posts', filters),
  
  getPost: (slug: string) => 
    request<{ post: Post }>('GET', `/posts/${slug}`),
  
  createPost: (data: PostForm) => 
    request<{ post: Post }>('POST', '/posts', data),
  
  updatePost: (id: string, data: Partial<PostForm>) => 
    request<{ post: Post }>('PUT', `/posts/${id}`, data),
  
  deletePost: (id: string) => 
    request('DELETE', `/posts/${id}`),
  
  likePost: (id: string) => 
    request<{ likeCount: number; isLiked: boolean }>('POST', `/posts/${id}/like`),
  
  addComment: (id: string, content: string) => 
    request('POST', `/posts/${id}/comments`, { content }),
  
  deleteComment: (postId: string, commentId: string) => 
    request('DELETE', `/posts/${postId}/comments/${commentId}`),
  
  getUserPosts: (userId: string, params?: { page?: number; limit?: number; status?: string }) => 
    request<PaginatedResponse<Post>>('GET', `/posts/user/${userId}`, params),
}

// 订阅API
export const subscriptionApi = {
  getSubscriptions: (params?: { page?: number; limit?: number; status?: string }) => 
    request<PaginatedResponse<Subscription>>('GET', '/subscriptions', params),
  
  subscribe: (creatorId: string, plan: 'free' | 'monthly' | 'yearly') => 
    request<{ subscription: Subscription }>('POST', '/subscriptions', { creatorId, plan }),
  
  cancelSubscription: (id: string, reason?: string) => 
    request<{ subscription: Subscription }>('PUT', `/subscriptions/${id}/cancel`, { reason }),
  
  renewSubscription: (id: string) => 
    request<{ subscription: Subscription }>('PUT', `/subscriptions/${id}/renew`),
  
  getCreator: (creatorId: string) => 
    request<{ creator: User; userSubscription?: Subscription }>('GET', `/subscriptions/creator/${creatorId}`),
  
  getStats: () => 
    request<{ stats: SubscriptionStats }>('GET', '/subscriptions/stats'),
}

// 支付API
export const paymentApi = {
  createPaymentIntent: (amount: number, currency?: string, subscriptionId?: string) => 
    request<PaymentIntent>('POST', '/payments/create-payment-intent', { 
      amount, 
      currency, 
      subscriptionId 
    }),
  
  createSubscription: (priceId: string, creatorId: string) => 
    request<{ subscriptionId: string; clientSecret: string }>('POST', '/payments/create-subscription', {
      priceId,
      creatorId
    }),
  
  cancelSubscription: (subscriptionId: string) => 
    request('POST', `/payments/cancel-subscription/${subscriptionId}`),
  
  getPaymentHistory: (params?: { page?: number; limit?: number }) => 
    request<PaginatedResponse<any>>('GET', '/payments/history', params),
  
  getPaymentMethods: () => 
    request<{ paymentMethods: PaymentMethod[] }>('GET', '/payments/payment-methods'),
  
  addPaymentMethod: (paymentMethodId: string) => 
    request('POST', '/payments/payment-methods', { paymentMethodId }),
}

// 通知API
export const notificationApi = {
  getNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => 
    request('GET', '/notifications', params),
  
  markAsRead: (id: string) => 
    request('PUT', `/notifications/${id}/read`),
  
  markAllAsRead: () => 
    request('PUT', '/notifications/read-all'),
  
  deleteNotification: (id: string) => 
    request('DELETE', `/notifications/${id}`),
  
  getUnreadCount: () => 
    request<{ count: number }>('GET', '/notifications/unread-count'),
  
  updatePreferences: (preferences: {
    emailNotifications?: boolean
    pushNotifications?: boolean
    newsletter?: boolean
    smsNotifications?: boolean
  }) => 
    request('PUT', '/notifications/preferences', preferences),
}

export default api 