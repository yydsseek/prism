'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { contentApi } from '../../lib/contentApi';
import type { Post, Tag, SearchFilters } from '../../types/content';
import TopNavBar from '../../components/TopNavBar';
import { Search, Filter, User, Clock, Tag as LucideTag, BookmarkIcon } from 'lucide-react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'tags'>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);

  // 执行搜索
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      const filters: SearchFilters = {
        q: searchQuery,
        limit: 20
      };

      const response = await contentApi.search(filters);
      
      // 根据返回的数据类型分离文章和标签
      const results = response.data.results || [];
      const postResults = results.filter((item: any) => item.content) as Post[];
      const tagResults = results.filter((item: any) => item.slug && !item.content) as Tag[];
      
      setPosts(postResults);
      setTags(tagResults);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始搜索
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  // 处理搜索提交
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query);
      // 更新URL
      const url = new URL(window.location.href);
      url.searchParams.set('q', query);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // 获取当前标签页的结果
  const getCurrentResults = () => {
    switch (activeTab) {
      case 'posts':
        return posts;
      case 'tags':
        return tags;
      default:
        return [...posts, ...tags];
    }
  };

  const currentResults = getCurrentResults();
  const totalResults = posts.length + tags.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">搜索</h1>
          <p className="mt-2 text-gray-600">搜索文章、标签和创作者</p>
        </div>

        {/* 搜索栏 */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="搜索内容、标签..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <span className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                  搜索
                </span>
              </button>
            </div>
          </form>
        </div>

        {!hasSearched ? (
          /* 搜索建议 */
          <SearchSuggestions onSearch={(suggestion) => {
            setQuery(suggestion);
            performSearch(suggestion);
          }} />
        ) : (
          <>
            {/* 搜索结果统计 */}
            <div className="mb-6">
              <p className="text-gray-600">
                {loading ? '搜索中...' : `找到 ${totalResults} 个结果`}
                {query && (
                  <span className="ml-1">
                    关于 "<span className="font-medium text-gray-900">{query}</span>"
                  </span>
                )}
              </p>
            </div>

            {/* 结果分类标签 */}
            {totalResults > 0 && (
              <div className="mb-6">
                <nav className="flex space-x-8 border-b border-gray-200">
                  {[
                    { key: 'all', label: '全部', count: totalResults },
                    { key: 'posts', label: '文章', count: posts.length },
                    { key: 'tags', label: '标签', count: tags.length }
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
            )}

            {/* 搜索结果 */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <SearchResults results={currentResults} activeTab={activeTab} query={query} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// 搜索建议组件
function SearchSuggestions({ onSearch }: { onSearch: (query: string) => void }) {
  const suggestions = [
    '技术',
    '创业',
    '设计',
    '产品',
    '投资',
    'React',
    'JavaScript',
    '人工智能',
    '区块链',
    '前端开发'
  ];

  const trendingTopics = [
    'GPT-4',
    'Next.js 14',
    '微服务架构',
    '产品设计',
    '用户体验'
  ];

  return (
    <div className="space-y-8">
      {/* 热门搜索 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">热门搜索</h3>
        <div className="flex flex-wrap gap-3">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSearch(suggestion)}
              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* 趋势话题 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">趋势话题</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingTopics.map((topic, index) => (
            <button
              key={topic}
              onClick={() => onSearch(topic)}
              className="text-left p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{topic}</span>
                <span className="text-xs text-gray-500">#{index + 1}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {Math.floor(Math.random() * 1000) + 100}+ 相关文章
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// 搜索结果组件
function SearchResults({ 
  results, 
  activeTab, 
  query 
}: { 
  results: (Post | Tag)[];
  activeTab: string;
  query: string;
}) {
  if (results.length === 0) {
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到相关结果</h3>
        <p className="text-gray-500 mb-4">
          尝试使用不同的关键词或检查拼写
        </p>
        <button
          onClick={() => window.location.href = '/content'}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          浏览推荐内容
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {results.map((item) => {
        // 检查是否为文章
        const isPost = 'content' in item;
        
        return isPost ? (
          <PostSearchResult key={item._id} post={item as Post} query={query} />
        ) : (
          <TagSearchResult key={item._id} tag={item as Tag} query={query} />
        );
      })}
    </div>
  );
}

// 文章搜索结果组件
function PostSearchResult({ post, query }: { post: Post; query: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {/* 作者头像 */}
        <div className="flex-shrink-0">
          {post.author.avatar ? (
            <img
              src={post.author.avatar}
              alt={post.author.username}
              className="h-8 w-8 rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback') as HTMLElement;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div 
            className={`avatar-fallback h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center ${post.author.avatar ? 'hidden' : 'flex'}`}
          >
            <User className="h-4 w-4 text-gray-500" />
          </div>
        </div>
        
        <div className="flex-1">
          {/* 作者信息 */}
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium text-gray-900">{post.author.displayName}</span>
            <span className="mx-2 text-gray-300">·</span>
            <span className="text-sm text-gray-500">
              {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
          
          {/* 文章标题 */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
            {post.title}
          </h3>
          
          {/* 文章摘要 */}
          <p className="text-gray-600 mb-3 line-clamp-3">
            {post.excerpt}
          </p>
          
          {/* 标签和统计 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{post.views} 阅读</span>
              <span>{post.likeCount} 点赞</span>
              <span>{post.readingTime} 分钟阅读</span>
            </div>
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex space-x-2">
                {post.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag._id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 标签搜索结果组件
function TagSearchResult({ tag, query }: { tag: Tag; query: string }) {
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
      style={{ borderLeftColor: tag.color, borderLeftWidth: '4px' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{tag.name}</h3>
            {tag.isPopular && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                热门
              </span>
            )}
          </div>
          
          {tag.description && (
            <p className="text-gray-600 text-sm mb-3">{tag.description}</p>
          )}
          
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <span>{tag.postCount} 文章</span>
            <span>{tag.followerCount} 关注</span>
          </div>
        </div>
        
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
  );
} 