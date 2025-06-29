import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Users, BookOpen, DollarSign, Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Prism - 内容创作者平台',
  description: '加入Prism，开始您的内容创作之旅。支持付费订阅、文章发布和用户管理。',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 导航栏 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gradient">
                Prism
              </Link>
            </div>
                         <div className="hidden md:flex items-center space-x-8">
               <Link href="/content" className="text-gray-600 hover:text-gray-900">
                 探索
               </Link>
               <Link href="/content?tab=subscribed" className="text-gray-600 hover:text-gray-900">
                 订阅
               </Link>
               <Link href="/notifications" className="text-gray-600 hover:text-gray-900">
                 消息
               </Link>
               <Link href="/about" className="text-gray-600 hover:text-gray-900">
                 关于
               </Link>
             </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="btn-primary"
              >
                开始创作
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 英雄区域 */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                开启您的
                <span className="text-gradient"> 内容创作 </span>
                之旅
              </h1>
              <p className="mt-6 text-lg text-gray-600 sm:max-w-xl sm:mx-auto lg:mx-0">
                Prism 是一个现代化的内容创作者平台，让您可以轻松发布文章、建立付费订阅、
                与读者互动，并通过优质内容获得收益。
              </p>
              <div className="mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link
                    href="/register"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-primary hover:opacity-90 md:py-4 md:text-lg md:px-10"
                  >
                    免费开始创作
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </div>
                <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                  <Link
                    href="/content"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                  >
                    探索内容
                  </Link>
                </div>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                  <div className="aspect-w-3 aspect-h-2">
                    <div className="w-full h-80 bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center">
                      <div className="text-white text-center">
                        <BookOpen className="h-16 w-16 mx-auto mb-4 animate-float" />
                        <p className="text-lg font-medium">开始您的创作之旅</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 特性介绍 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              为什么选择 Prism？
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              我们提供完整的内容创作解决方案，帮助您专注于创作优质内容
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-md bg-primary-500 text-white mx-auto">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">
                强大的编辑器
              </h3>
              <p className="mt-2 text-base text-gray-500">
                支持 Markdown 格式，让您专注于内容创作，而不是格式调整
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-md bg-primary-500 text-white mx-auto">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">
                订阅管理
              </h3>
              <p className="mt-2 text-base text-gray-500">
                轻松管理付费订阅者，建立稳定的收入来源
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-md bg-primary-500 text-white mx-auto">
                <DollarSign className="h-8 w-8" />
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">
                收益分析
              </h3>
              <p className="mt-2 text-base text-gray-500">
                详细的收益统计和分析，帮助您优化内容策略
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 统计数据 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              加入成长中的创作者社区
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600">1000+</div>
              <div className="mt-2 text-sm text-gray-600">活跃创作者</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600">50K+</div>
              <div className="mt-2 text-sm text-gray-600">订阅读者</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600">100K+</div>
              <div className="mt-2 text-sm text-gray-600">发布文章</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600">$500K+</div>
              <div className="mt-2 text-sm text-gray-600">创作者收益</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            准备开始您的创作之旅了吗？
          </h2>
          <p className="mt-4 text-lg text-primary-100">
            加入 Prism，与全球创作者一起分享您的故事
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
            >
              立即开始创作
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="text-2xl font-bold text-white mb-4">Prism</div>
              <p className="text-gray-400 max-w-md">
                现代化的内容创作者平台，让创作变得简单而有意义。
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">
                产品
              </h3>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-gray-300 hover:text-white">功能特性</Link></li>
                <li><Link href="/pricing" className="text-gray-300 hover:text-white">定价方案</Link></li>
                <li><Link href="/api" className="text-gray-300 hover:text-white">API 文档</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">
                支持
              </h3>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-gray-300 hover:text-white">帮助中心</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white">联系我们</Link></li>
                <li><Link href="/privacy" className="text-gray-300 hover:text-white">隐私政策</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8">
            <p className="text-center text-gray-400">
              © 2024 Prism. 保留所有权利。
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 