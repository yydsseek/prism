'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { isValidPhone } from '@/lib/utils'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'phone' | 'code' | 'password' | 'success'>('phone')
  const [formData, setFormData] = useState({
    phone: '',
    verificationCode: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validatePhone = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.phone) {
      newErrors.phone = '请输入手机号'
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = '请输入有效的手机号'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateCode = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.verificationCode) {
      newErrors.verificationCode = '请输入验证码'
    } else if (formData.verificationCode.length !== 6) {
      newErrors.verificationCode = '验证码应为6位数字'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePassword = () => {
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

  const handleSendCode = async () => {
    if (!validatePhone()) {
      return
    }

    try {
      setIsLoading(true)
      const response = await authApi.sendVerificationCode({
        phone: formData.phone,
        type: 'reset_password'
      })
      
      if (response.success) {
        setStep('code')
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
      } else {
        setErrors({ general: response.error || '发送验证码失败' })
      }
    } catch (error: any) {
      setErrors({ general: error.message || '发送验证码失败' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!validateCode()) {
      return
    }

    setStep('password')
  }

  const handleResetPassword = async () => {
    if (!validatePassword()) {
      return
    }

    try {
      setIsLoading(true)
      const response = await authApi.resetPasswordWithCode(
        formData.phone,
        formData.verificationCode,
        formData.password
      )
      
      if (response.success) {
        setStep('success')
        setErrors({})
      } else {
        setErrors({ general: response.error || '重置密码失败' })
      }
    } catch (error: any) {
      setErrors({ general: error.message || '重置密码失败' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    try {
      setIsLoading(true)
      const response = await authApi.resendVerificationCode(formData.phone, 'reset_password')
      
      if (response.success) {
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
      } else {
        setErrors({ general: response.error || '重新发送验证码失败' })
      }
    } catch (error: any) {
      setErrors({ general: error.message || '重新发送验证码失败' })
    } finally {
      setIsLoading(false)
    }
  }

  // 测试错误处理的函数
  const testError = (errorType: 'phone' | 'code' | 'password' | 'general' | 'network') => {
    setIsLoading(true)
    setErrors({})
    
    setTimeout(() => {
      switch (errorType) {
        case 'phone':
          setErrors({ phone: '该手机号未注册' })
          break
        case 'code':
          setErrors({ verificationCode: '验证码错误或已过期' })
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

  const renderPhoneStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-center text-3xl font-bold text-gray-900">
          忘记密码
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          请输入您的手机号，我们将发送验证码到您的手机
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
          placeholder="请输入您的手机号"
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
        <button
          type="button"
          onClick={handleSendCode}
          disabled={isLoading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? (
            <>
              <span className="loading-spinner mr-2"></span>
              发送中...
            </>
          ) : (
            '发送验证码'
          )}
        </button>
      </div>

      <div className="text-center">
        <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
          返回登录
        </Link>
      </div>
    </div>
  )

  const renderCodeStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-center text-3xl font-bold text-gray-900">
          验证手机号
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          我们已向 {formData.phone} 发送了验证码
        </p>
      </div>

      {/* 开发测试按钮 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">错误测试</h3>
          <div className="flex flex-wrap gap-2">
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
            onClick={handleResendCode}
            disabled={countdown > 0 || isLoading}
            className="px-4 py-2 text-sm font-medium text-primary-600 bg-white border border-primary-600 rounded-md hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {countdown > 0 ? `${countdown}s` : '重新发送'}
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

      <div>
        <button
          type="button"
          onClick={handleVerifyCode}
          disabled={isLoading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? (
            <>
              <span className="loading-spinner mr-2"></span>
              验证中...
            </>
          ) : (
            '验证'
          )}
        </button>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setStep('phone')}
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          返回上一步
        </button>
      </div>
    </div>
  )

  const renderPasswordStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-center text-3xl font-bold text-gray-900">
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
          </div>
        </div>
      )}

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
          type="button"
          onClick={handleResetPassword}
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
        <button
          type="button"
          onClick={() => setStep('code')}
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          返回上一步
        </button>
      </div>
    </div>
  )

  const renderSuccessStep = () => (
    <div className="space-y-6">
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
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
          <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        
        {step === 'phone' && renderPhoneStep()}
        {step === 'code' && renderCodeStep()}
        {step === 'password' && renderPasswordStep()}
        {step === 'success' && renderSuccessStep()}
      </div>
    </div>
  )
} 