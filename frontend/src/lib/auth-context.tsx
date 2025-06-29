'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, UserProfileSetupForm } from '@/types'
import { authApi, userApi } from './api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (phone: string, password: string) => Promise<void>
  loginWithCode: (phone: string, verificationCode: string) => Promise<void>
  register: (data: {
    phone: string
    password: string
    verificationCode?: string
  }) => Promise<void>
  setupProfile: (data: UserProfileSetupForm) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  sendVerificationCode: (phone: string, type: 'register' | 'login' | 'reset_password') => Promise<void>
  checkProfileStatus: () => Promise<{ profileCompleted: boolean; missingFields: string[] }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // 验证token并获取用户信息
      authApi.getMe()
        .then((response) => {
          if (response.success && response.data?.user) {
            setUser(response.data.user)
          } else {
            localStorage.removeItem('token')
          }
        })
        .catch(() => {
          localStorage.removeItem('token')
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (phone: string, password: string) => {
    try {
      const response = await authApi.login({ phone, password })
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token)
        setUser(response.data.user)
      } else {
        // 抛出具体的错误信息
        throw new Error(response.error || '登录失败，请检查手机号和密码')
      }
    } catch (error: any) {
      // 处理网络错误或其他异常
      if (error.message) {
        throw error
      } else {
        throw new Error('网络连接失败，请检查网络设置')
      }
    }
  }

  const loginWithCode = async (phone: string, verificationCode: string) => {
    try {
      const response = await authApi.loginWithCode({ phone, verificationCode })
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token)
        setUser(response.data.user)
      } else {
        throw new Error(response.error || '验证码登录失败')
      }
    } catch (error: any) {
      if (error.message) {
        throw error
      } else {
        throw new Error('网络连接失败，请检查网络设置')
      }
    }
  }

  const register = async (data: {
    phone: string
    password: string
    verificationCode?: string
  }) => {
    try {
      const response = await authApi.register(data)
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token)
        setUser(response.data.user)
      } else {
        // 抛出具体的错误信息
        throw new Error(response.error || '注册失败，请重试')
      }
    } catch (error: any) {
      // 处理网络错误或其他异常
      if (error.message) {
        throw error
      } else {
        throw new Error('网络连接失败，请检查网络设置')
      }
    }
  }

  const setupProfile = async (data: UserProfileSetupForm) => {
    try {
      const response = await userApi.setupProfile(data)
      if (response.success && response.data) {
        setUser(response.data.user)
      } else {
        throw new Error(response.error || '用户信息设置失败')
      }
    } catch (error: any) {
      if (error.message) {
        throw error
      } else {
        throw new Error('网络连接失败，请检查网络设置')
      }
    }
  }

  const sendVerificationCode = async (phone: string, type: 'register' | 'login' | 'reset_password') => {
    try {
      const response = await authApi.sendVerificationCode({ phone, type })
      if (!response.success) {
        throw new Error(response.error || '发送验证码失败')
      }
    } catch (error: any) {
      if (error.message) {
        throw error
      } else {
        throw new Error('网络连接失败，请检查网络设置')
      }
    }
  }

  const checkProfileStatus = async () => {
    try {
      const response = await userApi.checkProfileStatus()
      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.error || '检查用户状态失败')
      }
    } catch (error: any) {
      if (error.message) {
        throw error
      } else {
        throw new Error('网络连接失败，请检查网络设置')
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null)
  }

  const value = {
    user,
    isLoading,
    login,
    loginWithCode,
    register,
    setupProfile,
    logout,
    updateUser,
    sendVerificationCode,
    checkProfileStatus,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 