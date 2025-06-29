'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AuthNav() {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/login', label: '登录' },
    { href: '/register', label: '注册' },
    { href: '/forgot-password', label: '忘记密码' },
    { href: '/reset-password/demo-token', label: '重置密码' },
    { href: '/profile-setup', label: '用户信息设置' },
  ]

  return (
    <nav className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">认证页面导航</h3>
      <div className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
              pathname === item.href
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
} 