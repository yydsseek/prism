import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) {
    return `${days} 天前`
  } else if (hours > 0) {
    return `${hours} 小时前`
  } else if (minutes > 0) {
    return `${minutes} 分钟前`
  } else {
    return '刚刚'
  }
}

export function formatCurrency(amount: number, currency: string = 'CNY') {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatNumber(num: number) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/[\s_-]+/g, '-') // 替换空格和下划线为连字符
    .replace(/^-+|-+$/g, '') // 移除开头和结尾的连字符
}

export function calculateReadingTime(content: string) {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  const readingTime = Math.ceil(words / wordsPerMinute)
  return readingTime
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 手机号验证函数 - 支持中国大陆手机号
export function isValidPhone(phone: string) {
  // 移除所有空格和连字符
  const cleanPhone = phone.replace(/[\s-]/g, '')
  
  // 中国大陆手机号正则：1开头，第二位是3-9，总共11位数字
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(cleanPhone)
}

// 格式化手机号显示（添加空格分隔）
export function formatPhone(phone: string) {
  const cleanPhone = phone.replace(/[\s-]/g, '')
  if (cleanPhone.length === 11) {
    return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 7)} ${cleanPhone.slice(7)}`
  }
  return phone
}

// 脱敏显示手机号
export function maskPhone(phone: string) {
  const cleanPhone = phone.replace(/[\s-]/g, '')
  if (cleanPhone.length === 11) {
    return `${cleanPhone.slice(0, 3)}****${cleanPhone.slice(7)}`
  }
  return phone
}

export function isValidUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
} 