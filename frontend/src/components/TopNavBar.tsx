'use client';

import Link from 'next/link';
import { useAuth } from '../lib/auth-context';

interface TopNavBarProps {
  className?: string;
}

export default function TopNavBar({ className = '' }: TopNavBarProps) {
  const { user, isLoading } = useAuth();

  return (
    <nav className={`bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gradient">
              Prism
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/content" className="text-gray-600 hover:text-gray-900 transition-colors">
              探索
            </Link>
            <Link href="/content?tab=subscribed" className="text-gray-600 hover:text-gray-900 transition-colors">
              订阅
            </Link>
            <Link href="/notifications" className="text-gray-600 hover:text-gray-900 transition-colors">
              消息
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
              关于
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {!isLoading && (
              <>
                {user ? (
                  // 已登录状态
                  <>
                    <Link
                      href="/dashboard"
                      className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                      控制台
                    </Link>
                    <Link
                      href="/create"
                      className="btn-primary"
                    >
                      开始创作
                    </Link>
                  </>
                ) : (
                  // 未登录状态
                  <>
                    <Link
                      href="/login"
                      className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                      登录
                    </Link>
                    <Link
                      href="/register"
                      className="btn-primary"
                    >
                      开始创作
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 