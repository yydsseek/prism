'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { contentApi, tagApi } from '../../lib/contentApi';
import type { Post, Tag, ContentFilters } from '../../types/content';
import TopNavBar from '../../components/TopNavBar';
import { Filter, Heart, MessageCircle, Share2, Bookmark, User, Clock, TrendingUp, Star, Eye } from 'lucide-react';

interface ContentPageProps {}

export default function ContentPage({}: ContentPageProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<'recommended' | 'subscribed' | 'popular' | 'tags'>('recommended');
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ContentFilters>({
    page: 1,
    limit: 20,
    timeRange: 'week'
  });

  // 根据URL参数设置初始标签页
  useEffect(() => {
    if (tabParam === 'subscribed') {
      setActiveTab('subscribed');
    } else if (tabParam === 'popular') {
      setActiveTab('popular');
    } else if (tabParam === 'tags') {
      setActiveTab('tags');
    } else {
      setActiveTab('recommended');
    }
  }, [tabParam]);

  // 加载内容
  const loadContent = async () => {
    setLoading(true);
    try {
      let response;
      
      switch (activeTab) {
        case 'recommended':
          response = await contentApi.getRecommended(filters);
          setPosts(response.data.posts || []);
          break;
        case 'subscribed':
          response = await contentApi.getSubscribed(filters);
          setPosts(response.data.posts || []);
          break;
        case 'popular':
          response = await contentApi.getPopular(filters);
          setPosts(response.data.posts || []);
          break;
        case 'tags':
          const tagResponse = await tagApi.getTags({ popular: true, limit: 20 });
          setTags(tagResponse.data.tags || []);
          break;
      }
    } catch (error) {
      console.error('加载内容失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [activeTab, filters]);

  // 切换标签页
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setFilters(prev => ({ ...prev, page: 1 }));
    
    // 更新URL参数
    const url = new URL(window.location.href);
    if (tab === 'recommended') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tab);
    }
    window.history.replaceState({}, '', url.toString());
  };

  // 时间范围过滤
  const handleTimeRangeChange = (timeRange: 'day' | 'week' | 'month' | 'all') => {
    setFilters(prev => ({ ...prev, timeRange, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">内容发现</h1>
          <p className="mt-2 text-gray-600">
            {activeTab === 'recommended' && '为您推荐个性化内容'}
            {activeTab === 'subscribed' && '您订阅的创作者最新内容'}
            {activeTab === 'popular' && '发现热门优质内容'}
            {activeTab === 'tags' && '浏览感兴趣的话题标签'}
          </p>
        </div>

        {/* 标签导航 */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { key: 'recommended', label: '推荐', description: '个性化推荐内容' },
              { key: 'subscribed', label: '订阅', description: '订阅创作者内容' },
              { key: 'popular', label: '热门', description: '热门优质内容' },
              { key: 'tags', label: '标签', description: '话题标签浏览' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key as typeof activeTab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                title={tab.description}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 过滤器 */}
        {activeTab === 'popular' && (
          <div className="mb-6">
            <div className="flex space-x-4">
              <span className="text-sm font-medium text-gray-700">时间范围:</span>
              {[
                { key: 'day', label: '今天' },
                { key: 'week', label: '本周' },
                { key: 'month', label: '本月' },
                { key: 'all', label: '全部' }
              ].map((range) => (
                <button
                  key={range.key}
                  onClick={() => handleTimeRangeChange(range.key as any)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    filters.timeRange === range.key
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 主内容区 */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : activeTab === 'tags' ? (
              <TagGrid tags={tags} />
            ) : (
              <PostList posts={posts} />
            )}
          </div>

          {/* 侧边栏 */}
          <div className="lg:col-span-1">
            <Sidebar activeTab={activeTab} />
          </div>
        </div>
      </div>
    </div>
  );
}

// 文章列表组件
function PostList({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无内容</h3>
        <p className="text-gray-500">
          暂时没有找到相关内容，请稍后再试
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}

// 文章卡片组件
function PostCard({ post }: { post: Post }) {
  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {post.featuredImage && (
        <div className="aspect-w-16 aspect-h-9">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-48 object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        {/* 作者信息 */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0">
            {post.author.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.displayName}
                className="h-10 w-10 rounded-full"
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
              className={`avatar-fallback h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ${post.author.avatar ? 'hidden' : 'flex'}`}
            >
              <User className="h-5 w-5 text-gray-500" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{post.author.displayName}</p>
            <p className="text-sm text-gray-500">
              {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
            </p>
          </div>
        </div>

        {/* 文章标题和摘要 */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {post.title}
        </h2>
        <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>

        {/* 标签 */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag._id}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                onClick={() => {
                  // 可以添加点击标签的逻辑，比如搜索该标签
                  window.location.href = `/search?q=${tag.name}`;
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* 文章统计 */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>{post.views} 阅读</span>
            <span>{post.likeCount} 点赞</span>
            <span>{post.stats.bookmarkCount} 收藏</span>
            <span>{post.readingTime} 分钟阅读</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="hover:text-indigo-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button className="hover:text-indigo-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// 标签网格组件
function TagGrid({ tags }: { tags: Tag[] }) {
  if (tags.length === 0) {
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
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无标签</h3>
        <p className="text-gray-500">
          暂时没有找到热门标签
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tags.map((tag) => (
        <TagCard key={tag._id} tag={tag} />
      ))}
    </div>
  );
}

// 标签卡片组件
function TagCard({ tag }: { tag: Tag }) {
  return (
    <div 
      className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      style={{ borderLeftColor: tag.color, borderLeftWidth: '4px' }}
      onClick={() => {
        // 跳转到标签详情页或搜索页
        window.location.href = `/search?q=${tag.name}`;
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{tag.name}</h3>
          {tag.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{tag.description}</p>
          )}
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <span>{tag.postCount} 文章</span>
            <span>{tag.followerCount} 关注</span>
          </div>
        </div>
        {tag.isHot && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            热门
          </span>
        )}
      </div>
      
      <div className="mt-4">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            // 处理关注逻辑
          }}
          className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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

// 侧边栏组件
function Sidebar({ activeTab }: { activeTab: string }) {
  return (
    <div className="space-y-6">
      {/* 当前页面提示 */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {activeTab === 'recommended' && '个性化推荐'}
          {activeTab === 'subscribed' && '订阅内容'}
          {activeTab === 'popular' && '热门内容'}
          {activeTab === 'tags' && '标签浏览'}
        </h3>
        <p className="text-sm text-gray-600">
          {activeTab === 'recommended' && '基于您的兴趣和行为，为您推荐优质内容'}
          {activeTab === 'subscribed' && '您关注的创作者和订阅的标签最新内容'}
          {activeTab === 'popular' && '平台上最受欢迎和讨论最多的内容'}
          {activeTab === 'tags' && '发现和关注感兴趣的话题标签'}
        </p>
      </div>

      {/* 热门标签 */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">热门标签</h3>
        <div className="space-y-2">
          {['技术', '创业', '设计', '产品', '投资'].map((tagName) => (
            <button
              key={tagName}
              onClick={() => {
                window.location.href = `/search?q=${tagName}`;
              }}
              className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              #{tagName}
            </button>
          ))}
        </div>
      </div>

      {/* 推荐创作者 */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">推荐创作者</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div className="flex-shrink-0 mr-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">创作者 {i}</p>
                <p className="text-xs text-gray-500">1.2K 关注者</p>
              </div>
              <button className="text-indigo-600 text-sm font-medium hover:text-indigo-500 transition-colors">
                关注
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 