'use client';

import { useState, useEffect } from 'react';
import { bookmarkApi } from '../../lib/contentApi';
import type { Bookmark, BookmarkCollection, ContentFilters } from '../../types/content';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [collections, setCollections] = useState<BookmarkCollection[]>([]);
  const [activeCollection, setActiveCollection] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ContentFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt'
  });

  // 加载收藏列表
  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const response = await bookmarkApi.getBookmarks({
        ...filters,
        collection: activeCollection === 'all' ? undefined : activeCollection
      });
      setBookmarks(response.data.bookmarks || []);
    } catch (error) {
      console.error('加载收藏失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载收藏夹列表
  const loadCollections = async () => {
    try {
      const response = await bookmarkApi.getCollections();
      setCollections(response.data.collections || []);
    } catch (error) {
      console.error('加载收藏夹失败:', error);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, [activeCollection, filters]);

  useEffect(() => {
    loadCollections();
  }, []);

  // 取消收藏
  const handleUnbookmark = async (postId: string) => {
    try {
      await bookmarkApi.unbookmarkPost(postId);
      setBookmarks(prev => prev.filter(bookmark => bookmark.post._id !== postId));
    } catch (error) {
      console.error('取消收藏失败:', error);
    }
  };

  // 切换排序
  const handleSortChange = (sortBy: 'createdAt' | 'publishedAt') => {
    setFilters(prev => ({ ...prev, sortBy, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">我的收藏</h1>
          <p className="mt-2 text-gray-600">管理您收藏的精彩内容</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 侧边栏 - 收藏夹 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">收藏夹</h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => setActiveCollection('all')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeCollection === 'all'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>全部收藏</span>
                    <span className="text-xs text-gray-500">
                      {bookmarks.length}
                    </span>
                  </div>
                </button>

                {collections.map((collection) => (
                  <button
                    key={collection._id}
                    onClick={() => setActiveCollection(collection._id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      activeCollection === collection._id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{collection._id}</span>
                      <span className="text-xs text-gray-500">
                        {collection.count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* 创建新收藏夹 */}
              <button className="w-full mt-4 px-3 py-2 text-sm text-indigo-600 hover:text-indigo-500 border border-indigo-200 rounded-md hover:bg-indigo-50 transition-colors">
                + 新建收藏夹
              </button>
            </div>
          </div>

          {/* 主内容区 */}
          <div className="lg:col-span-3">
            {/* 工具栏 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">排序方式:</span>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleSortChange(e.target.value as any)}
                    className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="createdAt">收藏时间</option>
                    <option value="publishedAt">发布时间</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* 收藏列表 */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : bookmarks.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {bookmarks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark._id}
                    bookmark={bookmark}
                    onUnbookmark={handleUnbookmark}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 收藏卡片组件
function BookmarkCard({ 
  bookmark, 
  onUnbookmark 
}: { 
  bookmark: Bookmark; 
  onUnbookmark: (postId: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start space-x-4">
        {/* 文章封面 */}
        {bookmark.post.featuredImage && (
          <div className="flex-shrink-0">
            <img
              src={bookmark.post.featuredImage}
              alt={bookmark.post.title}
              className="w-24 h-24 object-cover rounded-lg"
            />
          </div>
        )}

        {/* 文章信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {bookmark.post.title}
              </h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {bookmark.post.excerpt}
              </p>
              
              {/* 作者和时间 */}
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <img
                  src={bookmark.post.author.avatar || '/default-avatar.png'}
                  alt={bookmark.post.author.displayName}
                  className="w-6 h-6 rounded-full mr-2"
                />
                <span>{bookmark.post.author.displayName}</span>
                <span className="mx-2">·</span>
                <span>{new Date(bookmark.post.publishedAt).toLocaleDateString('zh-CN')}</span>
              </div>

              {/* 收藏信息 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>收藏于 {new Date(bookmark.createdAt).toLocaleDateString('zh-CN')}</span>
                  {bookmark.collectionName !== 'default' && (
                    <>
                      <span>·</span>
                      <span className="text-indigo-600">{bookmark.collectionName}</span>
                    </>
                  )}
                  {bookmark.isRecent && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      新收藏
                    </span>
                  )}
                </div>

                {/* 操作按钮 */}
                {showActions && (
                  <div className="flex items-center space-x-2">
                    <button 
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="编辑收藏"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => onUnbookmark(bookmark.post._id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="取消收藏"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 收藏备注 */}
          {bookmark.note && (
            <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md">
              <p className="text-sm text-gray-700">{bookmark.note}</p>
            </div>
          )}

          {/* 标签 */}
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {bookmark.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 空状态组件
function EmptyState() {
  return (
    <div className="text-center py-12">
      <svg
        className="w-16 h-16 mx-auto text-gray-400 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">还没有收藏内容</h3>
      <p className="text-gray-500 mb-6">
        开始收藏您感兴趣的文章，建立您的知识库
      </p>
      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
        发现内容
      </button>
    </div>
  );
} 