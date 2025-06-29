'use client';

import { useState, useEffect } from 'react';
import { bookmarkApi } from '../../lib/contentApi';
import type { Bookmark, BookmarkCollection, ContentFilters } from '../../types/content';
import TopNavBar from '../../components/TopNavBar';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [collections, setCollections] = useState<BookmarkCollection[]>([]);
  const [activeCollection, setActiveCollection] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'publishedAt'>('createdAt');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ContentFilters>({
    page: 1,
    limit: 20
  });

  // 加载收藏列表
  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const params: ContentFilters = {
        ...filters,
        collection: activeCollection === 'all' ? undefined : activeCollection,
        sortBy
      };
      const response = await bookmarkApi.getBookmarks(params);
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
  }, [activeCollection, sortBy, filters]);

  useEffect(() => {
    loadCollections();
  }, []);

  // 取消收藏
  const handleRemoveBookmark = async (postId: string) => {
    try {
      await bookmarkApi.unbookmarkPost(postId);
      setBookmarks(prev => prev.filter(bookmark => bookmark.post._id !== postId));
    } catch (error) {
      console.error('取消收藏失败:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">我的收藏</h1>
          <p className="mt-2 text-gray-600">管理您收藏的优质内容</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 收藏夹侧边栏 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
                  全部收藏 ({bookmarks.length})
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
                    {collection._id} ({collection.count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 主内容区 */}
          <div className="lg:col-span-3">
            {/* 排序工具栏 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">排序方式:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="createdAt">收藏时间</option>
                    <option value="publishedAt">发布时间</option>
                  </select>
                </div>
                <div className="text-sm text-gray-500">
                  共 {bookmarks.length} 篇收藏
                </div>
              </div>
            </div>

            {/* 收藏列表 */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : bookmarks.length === 0 ? (
              <EmptyState activeCollection={activeCollection} />
            ) : (
              <div className="space-y-6">
                {bookmarks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark._id}
                    bookmark={bookmark}
                    onRemove={handleRemoveBookmark}
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
  onRemove 
}: { 
  bookmark: Bookmark; 
  onRemove: (postId: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* 文章信息 */}
          <div className="flex items-center mb-3">
            <img
              src={bookmark.post.author.avatar || '/default-avatar.png'}
              alt={bookmark.post.author.displayName}
              className="w-8 h-8 rounded-full mr-3"
              onError={(e) => {
                e.currentTarget.src = '/default-avatar.png';
              }}
            />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {bookmark.post.author.displayName}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(bookmark.post.publishedAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>

          {/* 文章标题和摘要 */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {bookmark.post.title}
          </h3>
          <p className="text-gray-600 mb-3 line-clamp-2">
            {bookmark.post.excerpt}
          </p>

          {/* 收藏信息 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>收藏于 {new Date(bookmark.createdAt).toLocaleDateString('zh-CN')}</span>
              {bookmark.collectionName && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                  {bookmark.collectionName}
                </span>
              )}
              {bookmark.tags && bookmark.tags.length > 0 && (
                <div className="flex space-x-1">
                  {bookmark.tags.slice(0, 2).map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 备注 */}
          {bookmark.note && (
            <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-200 rounded">
              <p className="text-sm text-gray-700">
                <span className="font-medium">备注:</span> {bookmark.note}
              </p>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        {showActions && (
          <div className="flex items-center space-x-2 ml-4">
            <button 
              className="p-2 text-gray-400 hover:text-gray-600"
              title="编辑收藏"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button 
              onClick={() => onRemove(bookmark.post._id)}
              className="p-2 text-gray-400 hover:text-red-600"
              title="取消收藏"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 空状态组件
function EmptyState({ activeCollection }: { activeCollection: string }) {
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
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {activeCollection === 'all' ? '还没有收藏' : '收藏夹为空'}
      </h3>
      <p className="text-gray-500 mb-4">
        {activeCollection === 'all' 
          ? '开始收藏您感兴趣的文章吧' 
          : '该收藏夹中还没有文章'
        }
      </p>
      <button 
        onClick={() => window.location.href = '/content'}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
      >
        去发现内容
      </button>
    </div>
  );
} 