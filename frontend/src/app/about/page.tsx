'use client';

import { useEffect } from 'react'
import { Users, BookOpen, DollarSign, Star, Heart, Globe, Shield, Zap } from 'lucide-react'
import TopNavBar from '../../components/TopNavBar'

export default function AboutPage() {
  useEffect(() => {
    document.title = '关于我们 - Prism'
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <TopNavBar />
      {/* 英雄区域 */}
      <div className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">关于</span>{' '}
                  <span className="block text-gradient xl:inline">Prism</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  我们致力于为创作者提供最好的内容发布和变现平台，让优质内容得到应有的价值。
                </p>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
            <div className="text-white text-center">
              <Globe className="h-24 w-24 mx-auto mb-4 opacity-80" />
              <p className="text-xl font-medium">连接创作者与读者</p>
            </div>
          </div>
        </div>
      </div>

      {/* 使命愿景 */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">使命愿景</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              让每个创作者都能获得应有的回报
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              我们相信优质内容应该得到公平的回报，创作者应该专注于创作而不是营销。
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-md bg-indigo-500 text-white mx-auto">
                  <Heart className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">
                  以创作者为中心
                </h3>
                <p className="mt-2 text-base text-gray-500">
                  我们的一切决策都以创作者的利益为出发点，提供最好的创作和变现工具。
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-md bg-indigo-500 text-white mx-auto">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">
                  保护知识产权
                </h3>
                <p className="mt-2 text-base text-gray-500">
                  严格的版权保护机制，确保创作者的知识产权得到充分保护。
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-md bg-indigo-500 text-white mx-auto">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">
                  技术驱动创新
                </h3>
                <p className="mt-2 text-base text-gray-500">
                  持续投入技术研发，为用户提供最先进的内容创作和阅读体验。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 平台数据 */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-12">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">平台数据</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              数字说话
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">10K+</div>
              <div className="mt-2 text-lg font-medium text-gray-900">活跃创作者</div>
              <div className="text-sm text-gray-500">持续创作优质内容</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">100K+</div>
              <div className="mt-2 text-lg font-medium text-gray-900">付费订阅者</div>
              <div className="text-sm text-gray-500">支持优质内容创作</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">1M+</div>
              <div className="mt-2 text-lg font-medium text-gray-900">月活用户</div>
              <div className="text-sm text-gray-500">享受优质阅读体验</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600">¥500W+</div>
              <div className="mt-2 text-lg font-medium text-gray-900">创作者收益</div>
              <div className="text-sm text-gray-500">累计分发给创作者</div>
            </div>
          </div>
        </div>
      </div>

      {/* 团队介绍 */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-12">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">团队介绍</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              优秀的团队
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              我们的团队由来自顶级科技公司的工程师、设计师和产品经理组成。
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: '张三',
                role: '创始人 & CEO',
                bio: '前阿里巴巴资深工程师，专注于内容平台产品设计',
                avatar: '/team-1.jpg'
              },
              {
                name: '李四',
                role: '技术总监',
                bio: '前腾讯技术专家，负责平台技术架构和团队管理',
                avatar: '/team-2.jpg'
              },
              {
                name: '王五',
                role: '产品总监',
                bio: '前字节跳动产品经理，专注于用户体验和产品策略',
                avatar: '/team-3.jpg'
              }
            ].map((member, index) => (
              <div key={index} className="text-center">
                <img
                  className="mx-auto h-24 w-24 rounded-full"
                  src={member.avatar}
                  alt={member.name}
                  onError={(e) => {
                    e.currentTarget.src = '/default-avatar.png';
                  }}
                />
                <h3 className="mt-4 text-lg font-medium text-gray-900">{member.name}</h3>
                <p className="text-indigo-600 font-medium">{member.role}</p>
                <p className="mt-2 text-sm text-gray-500">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 联系我们 */}
      <div className="bg-indigo-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">准备好开始了吗？</span>
            <span className="block">加入我们的创作者社区</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-indigo-200">
            立即注册，开始您的内容创作之旅，与全球读者分享您的知识和见解。
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <a
              href="/register"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 md:py-4 md:text-lg md:px-10"
            >
              开始创作
            </a>
            <a
              href="/content"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-400 md:py-4 md:text-lg md:px-10"
            >
              探索内容
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 