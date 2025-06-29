'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { 
  Home, 
  Compass, 
  Bookmark, 
  Tag, 
  Search, 
  User, 
  Settings,
  Bell,
  Edit,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function MainNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);

  // 主导航项目
  const mainNavItems = [
    { 
      href: '/', 
      label: '首页', 
      icon: Home,
      description: '平台首页'
    },
    { 
      href: '/content', 
      label: '发现', 
      icon: Compass,
      description: '发现优质内容'
    },
    { 
      href: '/tags', 
      label: '标签', 
      icon: Tag,
      description: '浏览话题标签'
    },
    { 
      href: '/search', 
      label: '搜索', 
      icon: Search,
      description: '搜索内容'
    }
  ];

  // 用户相关导航项目（需要登录）
  const userNavItems = [
    { 
      href: '/bookmarks', 
      label: '收藏', 
      icon: Bookmark,
      description: '我的收藏'
    },
    { 
      href: '/dashboard', 
      label: '仪表板', 
      icon: User,
      description: '个人中心'
    }
  ];

  // 检查当前路径是否激活
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // 处理登出
  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  // 关闭移动端菜单
  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="text-2xl font-bold text-gradient hover:opacity-80 transition-opacity"
              onClick={closeMobileMenu}
            >
              Prism
            </Link>
          </div>

          {/* 桌面端导航 */}
          <div className="hidden md:flex items-center space-x-1">
            {/* 主导航 */}
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  title={item.description}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}

            {/* 用户导航（需要登录） */}
            {user && userNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  title={item.description}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* 右侧操作区域 */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="hidden md:flex items-center space-x-3">
                {/* 创作按钮 */}
                <Link
                  href="/dashboard"
                  className="flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  创作
                </Link>

                {/* 通知 */}
                <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <Bell className="h-5 w-5" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications > 9 ? '9+' : notifications}
                    </span>
                  )}
                </button>

                {/* 用户菜单 */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 transition-colors">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-600" />
                    </div>
                    <span className="text-sm font-medium">{user.displayName || user.email}</span>
                  </button>

                  {/* 下拉菜单 */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="inline h-4 w-4 mr-2" />
                      个人中心
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="inline h-4 w-4 mr-2" />
                      设置
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="inline h-4 w-4 mr-2" />
                      退出登录
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 font-medium text-sm"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                >
                  注册
                </Link>
              </div>
            )}

            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-1">
              {/* 主导航 */}
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`flex items-center px-3 py-2 text-base font-medium rounded-md ${
                      isActive(item.href)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}

              {/* 用户导航 */}
              {user && userNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`flex items-center px-3 py-2 text-base font-medium rounded-md ${
                      isActive(item.href)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}

              {/* 分隔线 */}
              <hr className="my-3" />

              {/* 用户操作 */}
              {user ? (
                <div className="space-y-1">
                  <Link
                    href="/dashboard"
                    onClick={closeMobileMenu}
                    className="flex items-center px-3 py-2 text-base font-medium text-white bg-primary-600 rounded-md"
                  >
                    <Edit className="h-5 w-5 mr-3" />
                    创作
                  </Link>
                  <Link
                    href="/settings"
                    onClick={closeMobileMenu}
                    className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    设置
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    退出登录
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMobileMenu}
                    className="block px-3 py-2 text-base font-medium text-white bg-primary-600 rounded-md"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 