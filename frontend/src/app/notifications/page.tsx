'use client';

import { useState } from 'react';
import { Bell, User, Heart, MessageCircle, UserPlus, Bookmark } from 'lucide-react';
import TopNavBar from '../../components/TopNavBar';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'bookmark' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
  actionUrl?: string;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'mentions'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'like',
      title: '新的点赞',
      message: '张三 点赞了您的文章《如何学习React》',
      timestamp: '2024-01-15T10:30:00Z',
      read: false,
      avatar: '/default-avatar.png',
      actionUrl: '/posts/123'
    },
    {
      id: '2',
      type: 'comment',
      title: '新的评论',
      message: '李四 评论了您的文章：这篇文章写得很好，学到了很多！',
      timestamp: '2024-01-15T09:15:00Z',
      read: false,
      avatar: '/default-avatar.png',
      actionUrl: '/posts/123#comment-456'
    },
    {
      id: '3',
      type: 'follow',
      title: '新的关注者',
      message: '王五 关注了您',
      timestamp: '2024-01-14T16:20:00Z',
      read: true,
      avatar: '/default-avatar.png',
      actionUrl: '/users/wangwu'
    },
    {
      id: '4',
      type: 'bookmark',
      title: '内容被收藏',
      message: '赵六 收藏了您的文章《Vue 3 最佳实践》',
      timestamp: '2024-01-14T14:45:00Z',
      read: true,
      avatar: '/default-avatar.png',
      actionUrl: '/posts/456'
    },
    {
      id: '5',
      type: 'system',
      title: '系统通知',
      message: '您的文章《如何学习React》已通过审核并发布',
      timestamp: '2024-01-14T12:00:00Z',
      read: true,
      actionUrl: '/posts/123'
    }
  ]);

  // 过滤通知
  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'unread':
        return !notification.read;
      case 'mentions':
        return notification.type === 'comment';
      default:
        return true;
    }
  });

  // 标记为已读
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // 全部标记为已读
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavBar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Bell className="h-8 w-8 mr-3 text-indigo-600" />
                消息通知
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {unreadCount} 条未读
                  </span>
                )}
              </h1>
              <p className="mt-2 text-gray-600">查看您的最新消息和通知</p>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 border border-indigo-200 rounded-md hover:bg-indigo-50 transition-colors"
              >
                全部标记为已读
              </button>
            )}
          </div>
        </div>

        {/* 标签导航 */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { key: 'all', label: '全部', count: notifications.length },
              { key: 'unread', label: '未读', count: unreadCount },
              { key: 'mentions', label: '提及', count: notifications.filter(n => n.type === 'comment').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 text-xs text-gray-400">({tab.count})</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* 通知列表 */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无通知</h3>
              <p className="text-gray-500">
                {activeTab === 'unread' ? '您已查看所有通知' : '暂时没有新的通知'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// 通知卡片组件
function NotificationCard({ 
  notification, 
  onMarkAsRead 
}: { 
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) {
  // 获取图标
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case 'bookmark':
        return <Bookmark className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}天前`;
    }
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      // 这里可以导航到相关页面
      console.log('Navigate to:', notification.actionUrl);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer ${
        !notification.read ? 'border-l-4 border-l-indigo-500' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {notification.avatar ? (
            <img
              src={notification.avatar}
              alt="Avatar"
              className="h-10 w-10 rounded-full"
              onError={(e) => {
                // Hide the image and show the icon fallback
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback') as HTMLElement;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div 
            className={`avatar-fallback h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ${notification.avatar ? 'hidden' : 'flex'}`}
          >
            <User className="h-5 w-5 text-gray-500" />
          </div>
        </div>

        {/* 通知内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">
              {notification.title}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {formatTime(notification.timestamp)}
              </span>
              {!notification.read && (
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              )}
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {notification.message}
          </p>
        </div>
      </div>
    </div>
  );
} 