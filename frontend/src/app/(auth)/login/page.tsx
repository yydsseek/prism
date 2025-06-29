'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { isValidPhone } from '@/lib/utils'

export default function LoginPage() {
  const [loginType, setLoginType] = useState<'password' | 'code'>('password')
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    verificationCode: '',
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  
  const { login, loginWithCode, sendVerificationCode } = useAuth()
  const router = useRouter()

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.phone) {
      newErrors.phone = '请输入手机号'
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = '请输入有效的手机号'
    }

    if (loginType === 'password') {
      if (!formData.password) {
        newErrors.password = '请输入密码'
      } else if (formData.password.length < 6) {
        newErrors.password = '密码至少需要6个字符'
      }
    } else {
      if (!formData.verificationCode) {
        newErrors.verificationCode = '请输入验证码'
      } else if (formData.verificationCode.length !== 6) {
        newErrors.verificationCode = '验证码应为6位数字'
      }
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
      await sendVerificationCode(formData.phone, 'login')
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
          setErrors({ phone: '该手机号未注册' })
          break
        case 'password':
          setErrors({ password: '密码错误' })
          break
        case 'code':
          setErrors({ verificationCode: '验证码错误或已过期' })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!validateForm()) {
      console.log('Form validation failed')
      return
    }

    setIsLoading(true)
    setErrors({})
    
    try {
      console.log('Attempting login with:', { phone: formData.phone, type: loginType })
      
      if (loginType === 'password') {
        await login(formData.phone, formData.password)
      } else {
        await loginWithCode(formData.phone, formData.verificationCode)
      }
      
      console.log('Login successful, redirecting...')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Login error details:', {
        error,
        message: error?.message,
        response: error?.response,
        status: error?.response?.status
      })
      
      let errorMessage = '登录失败，请重试'
      
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

  const handleWechatLogin = () => {
    // 这里应该调用微信登录SDK
    console.log('微信登录')
    // 实际实现时需要集成微信SDK
    alert('微信登录功能开发中...')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            登录您的账户
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            还没有账户？{' '}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
              立即注册
            </Link>
          </p>
        </div>

        {/* 登录方式切换 */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setLoginType('password')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
              loginType === 'password'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            密码登录
          </button>
          <button
            type="button"
            onClick={() => setLoginType('code')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
              loginType === 'code'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            验证码登录
          </button>
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
                手机号
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

            {loginType === 'password' ? (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  密码
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={`mt-1 input-field ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="请输入密码"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.password}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                  验证码
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
            )}
          </div>

          {loginType === 'password' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  记住我
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                  忘记密码？
                </Link>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner mr-2"></span>
                  登录中...
                </>
              ) : (
                loginType === 'password' ? '登录' : '验证码登录'
              )}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">或者</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleWechatLogin}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.162 4.203 2.969 5.543.3.223.469.572.469.944 0 .01-.003.019-.003.029l-.015.394c-.048.43-.203 1.692-.203 1.692-.1.582.525.99 1.073.705 0 0 1.741-1.05 2.971-1.79.414-.25.908-.352 1.386-.29.164.021.331.032.5.032 4.8 0 8.691-3.288 8.691-7.342 0-4.054-3.891-7.342-8.691-7.342zm-2.363 9.506c-.711 0-1.29-.579-1.29-1.29s.579-1.29 1.29-1.29 1.29.579 1.29 1.29-.579 1.29-1.29 1.29zm4.725 0c-.711 0-1.29-.579-1.29-1.29s.579-1.29 1.29-1.29 1.29.579 1.29 1.29-.579 1.29-1.29 1.29z"/>
                  <path d="M15.785 11.188c-.711 0-1.29-.579-1.29-1.29s.579-1.29 1.29-1.29 1.29.579 1.29 1.29-.579 1.29-1.29 1.29z"/>
                  <path d="M20.465 11.188c-.711 0-1.29-.579-1.29-1.29s.579-1.29 1.29-1.29 1.29.579 1.29 1.29-.579 1.29-1.29 1.29z"/>
                  <path d="M24 14.344c0-3.407-2.61-6.211-5.825-6.211-3.216 0-5.825 2.804-5.825 6.211 0 .344.028.681.082 1.012.54 3.307 3.333 5.825 6.743 5.825.424 0 .835-.035 1.238-.103.404.248 1.238.744 1.238.744.274.164.548-.082.548-.384l-.082-.744c.55-.413 1.012-.908 1.378-1.485.64-.908.963-1.964.963-3.065z"/>
                </svg>
                <span className="ml-2">使用微信登录</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 