'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { isValidPhone } from '@/lib/utils'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    verificationCode: '',
    agreeToTerms: false,
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  
  const { register, sendVerificationCode } = useAuth()
  const router = useRouter()

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    // 手机号验证
    if (!formData.phone) {
      newErrors.phone = '请输入手机号'
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = '请输入有效的手机号'
    }

    // 密码验证
    if (!formData.password) {
      newErrors.password = '请输入密码'
    } else if (formData.password.length < 8) {
      newErrors.password = '密码至少需要8个字符'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = '密码必须包含大小写字母和数字'
    }

    // 确认密码验证
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }

    // 验证码验证
    if (!formData.verificationCode) {
      newErrors.verificationCode = '请输入验证码'
    } else if (formData.verificationCode.length !== 6) {
      newErrors.verificationCode = '验证码应为6位数字'
    }

    // 服务条款验证
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = '请同意服务条款和隐私政策'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 发送验证码
  const handleSendCode = async () => {
    if (!formData.phone) {
      setErrors({ phone: '请输入手机号' })
      return
    }
    
    if (!isValidPhone(formData.phone)) {
      setErrors({ phone: '请输入有效的手机号' })
      return
    }

    try {
      setIsLoading(true)
      await sendVerificationCode(formData.phone, 'register')
      setCodeSent(true)
      setCountdown(60)
      
      // 倒计时
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      setErrors({})
    } catch (error: any) {
      setErrors({ general: error.message || '发送验证码失败' })
    } finally {
      setIsLoading(false)
    }
  }

  // 测试错误处理的函数
  const testError = (errorType: 'phone' | 'password' | 'code' | 'general' | 'network') => {
    setIsLoading(true)
    setErrors({})
    
    setTimeout(() => {
      switch (errorType) {
        case 'phone':
          setErrors({ phone: '该手机号已注册' })
          break
        case 'password':
          setErrors({ password: '密码强度不够' })
          break
        case 'code':
          setErrors({ verificationCode: '验证码错误或已过期' })
          break
        case 'general':
          setErrors({ general: '注册失败，请稍后重试' })
          break
        case 'network':
          setErrors({ general: '网络连接失败，请检查网络设置' })
          break
      }
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
      await register({
        phone: formData.phone,
        password: formData.password,
        verificationCode: formData.verificationCode,
      })
      
      // 注册成功后跳转到用户信息设置页面
      router.push('/profile-setup')
    } catch (error: any) {
      let errorMessage = '注册失败，请重试'
      
      if (error?.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      // 根据错误类型设置特定的错误信息
      if (errorMessage.includes('手机号') || errorMessage.includes('phone')) {
        setErrors({ phone: errorMessage })
      } else if (errorMessage.includes('密码') || errorMessage.includes('password')) {
        setErrors({ password: errorMessage })
      } else if (errorMessage.includes('验证码') || errorMessage.includes('code')) {
        setErrors({ verificationCode: errorMessage })
      } else {
        setErrors({ general: errorMessage })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
    
    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    // 清除通用错误
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            创建新账户
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            已经有账户？{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              立即登录
            </Link>
          </p>
          <p className="mt-1 text-center text-xs text-gray-500">
            注册后需要完善个人信息才能使用全部功能
          </p>
        </div>

        {/* 开发测试按钮 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">错误测试</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => testError('phone')}
                className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded"
              >
                手机号错误
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
                onClick={() => testError('code')}
                className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded"
              >
                验证码错误
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
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                手机号 <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                className={`mt-1 input-field ${errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="请输入手机号"
                value={formData.phone}
                onChange={handleChange}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`input-field pr-10 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="请输入密码"
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
                确认密码 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="请再次输入密码"
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

            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                验证码 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex space-x-2">
                <input
                  id="verificationCode"
                  name="verificationCode"
                  type="text"
                  maxLength={6}
                  className={`flex-1 input-field ${errors.verificationCode ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="请输入6位验证码"
                  value={formData.verificationCode}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || isLoading}
                  className="px-4 py-2 text-sm font-medium text-primary-600 bg-white border border-primary-600 rounded-md hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? `${countdown}s` : codeSent ? '重新发送' : '发送验证码'}
                </button>
              </div>
              {errors.verificationCode && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.verificationCode}
                </p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                className={`h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded ${errors.agreeToTerms ? 'border-red-300' : ''}`}
                checked={formData.agreeToTerms}
                onChange={handleChange}
              />
              <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900">
                我同意{' '}
                <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                  服务条款
                </Link>
                {' '}和{' '}
                <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                  隐私政策
                </Link>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-sm text-red-600 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.agreeToTerms}
              </p>
            )}
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
                  注册中...
                </>
              ) : (
                '创建账户'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 