'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'

export default function ResetPasswordPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null)

  useEffect(() => {
    // 验证token有效性
    if (token) {
      // 这里可以添加token验证逻辑
      // 暂时假设token有效
      setIsTokenValid(true)
    } else {
      setIsTokenValid(false)
    }
  }, [token])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.password) {
      newErrors.password = '请输入新密码'
    } else if (formData.password.length < 8) {
      newErrors.password = '密码至少需要8个字符'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = '密码必须包含大小写字母和数字'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认新密码'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 测试错误处理的函数
  const testError = (errorType: 'token' | 'password' | 'general' | 'network') => {
    setIsLoading(true)
    setErrors({})
    
    setTimeout(() => {
      switch (errorType) {
        case 'token':
          setErrors({ general: '重置链接已过期或无效' })
          setIsTokenValid(false)
          break
        case 'password':
          setErrors({ password: '密码设置失败' })
          break
        case 'general':
          setErrors({ general: '服务器内部错误，请稍后重试' })
          break
        case 'network':
          setErrors({ general: '网络连接失败，请检查网络设置' })
          break
      }
      setIsLoading(false)
    }, 1000)
  }

  const testSuccess = () => {
    setIsLoading(true)
    setErrors({})
    
    setTimeout(() => {
      setIsSuccess(true)
      setIsLoading(false)
    }, 1000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})
    
    try {
      const response = await authApi.resetPassword(token, formData.password)
      
      if (response.success) {
        setIsSuccess(true)
      } else {
        throw new Error(response.error || '重置密码失败')
      }
    } catch (error: any) {
      let errorMessage = '重置密码失败，请重试'
      
      if (error?.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      // 根据错误类型设置特定的错误信息
      if (errorMessage.includes('token') || errorMessage.includes('链接') || errorMessage.includes('过期')) {
        setErrors({ general: errorMessage })
        setIsTokenValid(false)
      } else if (errorMessage.includes('密码') || errorMessage.includes('password')) {
        setErrors({ password: errorMessage })
      } else {
        setErrors({ general: errorMessage })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    // 清除通用错误
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }))
    }
  }

  // Token验证中
  if (isTokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
              <span className="loading-spinner h-6 w-6 text-primary-600"></span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              验证重置链接
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              正在验证您的重置链接...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Token无效
  if (isTokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              链接无效或已过期
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              您的密码重置链接可能已过期或无效。请重新申请密码重置。
            </p>
          </div>

          <div className="flex flex-col space-y-4">
            <Link
              href="/forgot-password"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              重新申请重置密码
            </Link>
            
            <Link
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-primary-600 rounded-md shadow-sm text-sm font-medium text-primary-600 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              返回登录
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 成功页面
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              密码重置成功
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              您的密码已成功重置，请使用新密码登录
            </p>
          </div>

          <div>
            <Link
              href="/login"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              前往登录
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 重置密码表单
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            设置新密码
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            请为您的账户设置一个新密码
          </p>
        </div>

        {/* 开发测试按钮 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">错误测试</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => testError('token')}
                className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded"
              >
                Token错误
              </button>
              <button
                type="button"
                onClick={() => testError('password')}
                className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded"
              >
                密码错误
              </button>
              <button
                type="button"
                onClick={() => testError('general')}
                className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded"
              >
                通用错误
              </button>
              <button
                type="button"
                onClick={() => testError('network')}
                className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded"
              >
                网络错误
              </button>
              <button
                type="button"
                onClick={testSuccess}
                className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded"
              >
                重置成功
              </button>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <div className="text-sm text-red-700">{errors.general}</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                新密码
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`input-field pr-10 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="请输入新密码"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password}
                </p>
              )}
              <div className="mt-1 text-xs text-gray-500">
                密码必须包含大小写字母和数字，至少8个字符
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                确认新密码
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="请再次输入新密码"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner mr-2"></span>
                  重置中...
                </>
              ) : (
                '重置密码'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              返回登录
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
} 