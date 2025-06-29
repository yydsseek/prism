'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { contentApi } from '../../lib/contentApi';
import type { Post, Tag, SearchFilters } from '../../types/content';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<(Post | Tag)[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'tags'>('posts');
  const [filters, setFilters] = useState<SearchFilters>({
    q: query,
    type: 'posts',
    page: 1,
    limit: 20
  });

  // 执行搜索
  const performSearch = async () => {
    if (!filters.q.trim()) return;
    
    setLoading(true);
    try {
      const response = await contentApi.search(filters);
      setResults(response.data.results || []);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      setFilters(prev => ({ ...prev, q: query }));
    }
  }, [query]);

  useEffect(() => {
    performSearch();
  }, [filters]);

  // 切换搜索类型
  const handleTabChange = (type: 'posts' | 'tags') => {
    setActiveTab(type);
    setFilters(prev => ({ ...prev, type, page: 1 }));
  };

  // 处理搜索输入
  const handleSearch = (searchQuery: string) => {
    setFilters(prev => ({ ...prev, q: searchQuery, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索头部 */}
        <div className="mb-8">
          <SearchHeader 
            initialQuery={query}
            onSearch={handleSearch}
            loading={loading}
          />
        </div>

        {/* 搜索结果 */}
        {filters.q && (
          <>
            {/* 标签导航 */}
            <div className="mb-6">
              <nav className="flex space-x-8 border-b border-gray-200">
                {[
                  { key: 'posts', label: '文章' },
                  { key: 'tags', label: '标签' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.key
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* 搜索结果列表 */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  </div>
                ) : results.length === 0 ? (
                  <EmptyResults query={filters.q} type={activeTab} />
                ) : (
                  <div className="space-y-6">
                    {results.map((result, index) => (
                      activeTab === 'posts' ? (
                        <PostResult key={result._id} post={result as Post} />
                      ) : (
                        <TagResult key={result._id} tag={result as Tag} />
                      )
                    ))}
                  </div>
                )}
              </div>

              {/* 侧边栏 */}
              <div className="lg:col-span-1">
                <SearchSidebar query={filters.q} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// 搜索头部组件
function SearchHeader({ 
  initialQuery, 
  onSearch, 
  loading 
}: { 
  initialQuery: string; 
  onSearch: (query: string) => void;
  loading: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">搜索内容</h1>
      
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索文章、标签、创作者..."
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              type="submit"
              disabled={loading}
              className="mr-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? '搜索中...' : '搜索'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// 文章搜索结果组件
function PostResult({ post }: { post: Post }) {
  return (
    <article className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {/* 文章封面 */}
        {post.featuredImage && (
          <div className="flex-shrink-0">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-24 h-24 object-cover rounded-lg"
            />
          </div>
        )}

        {/* 文章信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-2">
            <img
              src={post.author.avatar || '/default-avatar.png'}
              alt={post.author.displayName}
              className="w-6 h-6 rounded-full mr-2"
            />
            <span className="text-sm text-gray-600">{post.author.displayName}</span>
            <span className="mx-2 text-gray-400">·</span>
            <span className="text-sm text-gray-500">
              {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
            </span>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
            {post.title}
          </h3>
          <p className="text-gray-600 mb-3 line-clamp-3">{post.excerpt}</p>

          {/* 标签 */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag._id}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* 统计信息 */}
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <span>{post.views} 阅读</span>
            <span>{post.likeCount} 点赞</span>
            <span>{post.stats.bookmarkCount} 收藏</span>
            <span>{post.readingTime} 分钟阅读</span>
          </div>
        </div>
      </div>
    </article>
  );
}

// 标签搜索结果组件
function TagResult({ tag }: { tag: Tag }) {
  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      style={{ borderLeftColor: tag.color, borderLeftWidth: '4px' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mr-3"
              style={{ backgroundColor: tag.color }}
            >
              {tag.icon || tag.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{tag.name}</h3>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <span>{tag.postCount} 文章</span>
                <span>{tag.followerCount} 关注</span>
              </div>
            </div>
          </div>
          
          {tag.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{tag.description}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {tag.isHot && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              热门
            </span>
          )}
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tag.isFollowed
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {tag.isFollowed ? '已关注' : '关注'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 空结果组件
function EmptyResults({ query, type }: { query: string; type: string }) {
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
          d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到相关{type === 'posts' ? '文章' : '标签'}</h3>
      <p className="text-gray-500 mb-6">
        尝试使用不同的关键词或浏览推荐内容
      </p>
      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
        浏览推荐内容
      </button>
    </div>
  );
}

// 搜索侧边栏组件
function SearchSidebar({ query }: { query: string }) {
  return (
    <div className="space-y-6">
      {/* 搜索建议 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">搜索建议</h3>
        <div className="space-y-2">
          {['技术分享', '创业经验', '产品设计', '投资理财', '职场成长'].map((suggestion) => (
            <button
              key={suggestion}
              className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* 热门搜索 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">热门搜索</h3>
        <div className="flex flex-wrap gap-2">
          {['React', 'Vue', 'AI', '区块链', '创业'].map((term) => (
            <span
              key={term}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 cursor-pointer hover:bg-gray-200"
            >
              {term}
            </span>
          ))}
        </div>
      </div>

      {/* 搜索提示 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">搜索提示</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>• 使用关键词搜索相关文章</p>
          <p>• 搜索标签发现感兴趣的话题</p>
          <p>• 关注标签获取最新内容推送</p>
        </div>
      </div>
    </div>
  );
} 