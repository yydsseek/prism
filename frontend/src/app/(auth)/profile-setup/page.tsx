'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { UserProfileSetupForm, INDUSTRY_OPTIONS, INVESTMENT_STAGE_OPTIONS } from '@/types'

export default function ProfileSetupPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<UserProfileSetupForm>({
    nickname: '',
    avatar: '',
    bio: '',
    workPosition: '',
    workCompany: '',
    workIndustry: '',
    workExperience: '',
    workYears: undefined,
    investmentExperience: '',
    investmentIndustries: [],
    investmentStage: [],
    investmentSize: '',
    investmentYears: undefined,
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setupProfile, user } = useAuth()
  const router = useRouter()

  const validateStep = (currentStep: number) => {
    const newErrors: { [key: string]: string } = {}

    if (currentStep === 1) {
      // 基本信息验证
      if (!formData.nickname) {
        newErrors.nickname = '请输入昵称'
      } else if (formData.nickname.length < 2) {
        newErrors.nickname = '昵称至少需要2个字符'
      } else if (formData.nickname.length > 20) {
        newErrors.nickname = '昵称不能超过20个字符'
      }
    } else if (currentStep === 2) {
      // 工作信息验证（可选，但如果填写了需要完整）
      if (formData.workPosition || formData.workCompany || formData.workIndustry) {
        if (!formData.workPosition) {
          newErrors.workPosition = '请输入职位'
        }
        if (!formData.workCompany) {
          newErrors.workCompany = '请输入公司'
        }
        if (!formData.workIndustry) {
          newErrors.workIndustry = '请选择行业'
        }
      }
    } else if (currentStep === 3) {
      // 投资信息验证（可选，但如果填写了需要完整）
      if (formData.investmentExperience || formData.investmentIndustries?.length || formData.investmentStage?.length) {
        if (!formData.investmentExperience) {
          newErrors.investmentExperience = '请填写投资经历'
        }
        if (!formData.investmentIndustries?.length) {
          newErrors.investmentIndustries = '请选择投资行业'
        }
        if (!formData.investmentStage?.length) {
          newErrors.investmentStage = '请选择投资阶段'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
    setErrors({})
  }

  const handleSubmit = async () => {
    if (!validateStep(step)) {
      return
    }

    setIsLoading(true)
    setErrors({})
    
    try {
      await setupProfile(formData)
      router.push('/dashboard')
    } catch (error: any) {
      setErrors({ general: error.message || '设置失败，请重试' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleMultiSelect = (name: string, value: string) => {
    setFormData(prev => {
      const currentValues = prev[name as keyof UserProfileSetupForm] as string[] || []
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value]
      return { ...prev, [name]: newValues }
    })
    
    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        setErrors({ avatar: '请选择图片文件' })
        return
      }
      
      // 验证文件大小（5MB）
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ avatar: '图片文件不能超过5MB' })
        return
      }

      // 创建预览
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setAvatarPreview(result)
        setFormData(prev => ({ ...prev, avatar: result }))
      }
      reader.readAsDataURL(file)
      
      // 清除错误
      if (errors.avatar) {
        setErrors(prev => ({ ...prev, avatar: '' }))
      }
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">基本信息</h2>
        <p className="mt-2 text-sm text-gray-600">
          设置您的昵称和头像，让其他用户认识您
        </p>
      </div>

      <div className="space-y-4">
        {/* 头像上传 */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="头像预览" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 bg-primary-600 text-white rounded-full p-2 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <p className="mt-2 text-xs text-gray-500">点击上传头像（可选）</p>
          {errors.avatar && (
            <p className="mt-1 text-sm text-red-600">{errors.avatar}</p>
          )}
        </div>

        {/* 昵称 */}
        <div>
          <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
            昵称 <span className="text-red-500">*</span>
          </label>
          <input
            id="nickname"
            name="nickname"
            type="text"
            required
            className={`mt-1 input-field ${errors.nickname ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            placeholder="请输入昵称"
            value={formData.nickname}
            onChange={handleChange}
          />
          {errors.nickname && (
            <p className="mt-1 text-sm text-red-600">{errors.nickname}</p>
          )}
        </div>

        {/* 个人简介 */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
            个人简介
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            className="mt-1 input-field"
            placeholder="简单介绍一下自己（可选）"
            value={formData.bio}
            onChange={handleChange}
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.bio?.length || 0}/200 字符
          </p>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">工作信息</h2>
        <p className="mt-2 text-sm text-gray-600">
          填写您的工作经历，帮助其他用户了解您的专业背景
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="workPosition" className="block text-sm font-medium text-gray-700">
              职位
            </label>
            <input
              id="workPosition"
              name="workPosition"
              type="text"
              className={`mt-1 input-field ${errors.workPosition ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="如：产品经理"
              value={formData.workPosition}
              onChange={handleChange}
            />
            {errors.workPosition && (
              <p className="mt-1 text-sm text-red-600">{errors.workPosition}</p>
            )}
          </div>

          <div>
            <label htmlFor="workCompany" className="block text-sm font-medium text-gray-700">
              公司
            </label>
            <input
              id="workCompany"
              name="workCompany"
              type="text"
              className={`mt-1 input-field ${errors.workCompany ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="如：阿里巴巴"
              value={formData.workCompany}
              onChange={handleChange}
            />
            {errors.workCompany && (
              <p className="mt-1 text-sm text-red-600">{errors.workCompany}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="workIndustry" className="block text-sm font-medium text-gray-700">
              行业
            </label>
            <select
              id="workIndustry"
              name="workIndustry"
              className={`mt-1 input-field ${errors.workIndustry ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              value={formData.workIndustry}
              onChange={handleChange}
            >
              <option value="">请选择行业</option>
              {INDUSTRY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.workIndustry && (
              <p className="mt-1 text-sm text-red-600">{errors.workIndustry}</p>
            )}
          </div>

          <div>
            <label htmlFor="workYears" className="block text-sm font-medium text-gray-700">
              工作年限
            </label>
            <input
              id="workYears"
              name="workYears"
              type="number"
              min="0"
              max="50"
              className="mt-1 input-field"
              placeholder="如：5"
              value={formData.workYears || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="workExperience" className="block text-sm font-medium text-gray-700">
            工作经历描述
          </label>
          <textarea
            id="workExperience"
            name="workExperience"
            rows={4}
            className="mt-1 input-field"
            placeholder="简单描述您的工作经历和主要成就"
            value={formData.workExperience}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              工作信息为可选填写，但填写完整的工作信息有助于建立专业形象
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">投资信息</h2>
        <p className="mt-2 text-sm text-gray-600">
          分享您的投资经历和偏好，与志同道合的投资者建立联系
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="investmentExperience" className="block text-sm font-medium text-gray-700">
            投资经历描述
          </label>
          <textarea
            id="investmentExperience"
            name="investmentExperience"
            rows={4}
            className={`mt-1 input-field ${errors.investmentExperience ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            placeholder="描述您的投资经历、投资理念或成功案例"
            value={formData.investmentExperience}
            onChange={handleChange}
          />
          {errors.investmentExperience && (
            <p className="mt-1 text-sm text-red-600">{errors.investmentExperience}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            投资行业标签
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {INDUSTRY_OPTIONS.map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.investmentIndustries?.includes(option.value) || false}
                  onChange={() => handleMultiSelect('investmentIndustries', option.value)}
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
          {errors.investmentIndustries && (
            <p className="mt-1 text-sm text-red-600">{errors.investmentIndustries}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            投资阶段偏好
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {INVESTMENT_STAGE_OPTIONS.map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.investmentStage?.includes(option.value) || false}
                  onChange={() => handleMultiSelect('investmentStage', option.value)}
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
          {errors.investmentStage && (
            <p className="mt-1 text-sm text-red-600">{errors.investmentStage}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="investmentSize" className="block text-sm font-medium text-gray-700">
              投资规模
            </label>
            <select
              id="investmentSize"
              name="investmentSize"
              className="mt-1 input-field"
              value={formData.investmentSize}
              onChange={handleChange}
            >
              <option value="">请选择投资规模</option>
              <option value="under_10w">10万以下</option>
              <option value="10w_50w">10万-50万</option>
              <option value="50w_100w">50万-100万</option>
              <option value="100w_500w">100万-500万</option>
              <option value="500w_1000w">500万-1000万</option>
              <option value="over_1000w">1000万以上</option>
            </select>
          </div>

          <div>
            <label htmlFor="investmentYears" className="block text-sm font-medium text-gray-700">
              投资年限
            </label>
            <input
              id="investmentYears"
              name="investmentYears"
              type="number"
              min="0"
              max="50"
              className="mt-1 input-field"
              placeholder="如：3"
              value={formData.investmentYears || ''}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-700">
              投资信息为可选填写，完善的投资信息有助于您在平台上获得更多关注和合作机会
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* 进度条 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    step >= stepNumber
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-300 text-gray-500'
                  }`}
                >
                  {step > stepNumber ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      step > stepNumber ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500">基本信息</span>
            <span className="text-xs text-gray-500">工作信息</span>
            <span className="text-xs text-gray-500">投资信息</span>
          </div>
        </div>

        {/* 错误提示 */}
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

        {/* 表单内容 */}
        <div className="bg-white shadow-lg rounded-lg p-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* 操作按钮 */}
          <div className="flex justify-between pt-6 mt-6 border-t border-gray-200">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  上一步
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                跳过
              </button>
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  下一步
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <span className="loading-spinner mr-2"></span>
                      完成设置...
                    </>
                  ) : (
                    '完成设置'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 