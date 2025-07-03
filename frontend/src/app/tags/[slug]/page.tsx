'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { tagApi } from '../../../lib/contentApi';
import type { Tag, Post, ContentFilters } from '../../../types/content';
import TopNavBar from '../../../components/TopNavBar';
import { User, Calendar, Users, FileText, TrendingUp, Clock, Heart, Bookmark } from 'lucide-react';

export default function TagDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [tag, setTag] = useState<Tag | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'publishedAt' | 'views' | 'likeCount'>('publishedAt');
  const [filters, setFilters] = useState<ContentFilters>({
    page: 1,
    limit: 20,
    sortBy: 'publishedAt'
  });

  // 加载标签详情和相关文章
  const loadTagDetails = async () => {
    setLoading(true);
    try {
      const response = await tagApi.getTagDetails(slug, filters);
      setTag(response.data.tag);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('加载标签详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载相关文章
  const loadPosts = async () => {
    if (!tag) return;
    
    setPostsLoading(true);
    try {
      const response = await tagApi.getTagDetails(slug, { ...filters, sortBy });
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('加载文章失败:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      loadTagDetails();
    }
  }, [slug]);

  useEffect(() => {
    if (tag) {
      loadPosts();
    }
  }, [sortBy, filters, tag]);

  // 关注/取消关注标签
  const handleFollowTag = async () => {
    if (!tag) return;
    
    try {
      const response = await tagApi.followTag(tag._id);
      setTag(prev => prev ? {
        ...prev,
        isFollowed: response.data.isFollowed,
        followerCount: response.data.isFollowed 
          ? prev.followerCount + 1 
          : prev.followerCount - 1
      } : null);
    } catch (error) {
      console.error('关注操作失败:', error);
    }
  };

  // 排序处理
  const handleSortChange = (newSortBy: typeof sortBy) => {
    setSortBy(newSortBy);
    setFilters(prev => ({ ...prev, sortBy: newSortBy, page: 1 }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavBar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">标签不存在</h3>
            <p className="text-gray-500 mb-4">该标签可能已被删除或不存在</p>
            <button
              onClick={() => window.location.href = '/tags'}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              浏览所有标签
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标签头部信息 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-4">
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl mr-6"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.icon || tag.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{tag.name}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{tag.postCount} 文章</span>
                    <span>{tag.followerCount} 关注</span>
                    {tag.isPopular && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        热门标签
                      </span>
                    )}
                    {tag.isRecommended && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        推荐标签
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {tag.description && (
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  {tag.description}
                </p>
              )}
            </div>
            
            <div className="ml-6">
              <button
                onClick={handleFollowTag}
                className={`px-6 py-3 rounded-md font-medium transition-colors ${
                  tag.isFollowed
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {tag.isFollowed ? '已关注' : '关注标签'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 主内容区 */}
          <div className="lg:col-span-3">
            {/* 排序工具栏 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">排序方式:</span>
                  <div className="flex space-x-2">
                    {[
                      { key: 'publishedAt', label: '最新' },
                      { key: 'views', label: '最热' },
                      { key: 'likeCount', label: '最赞' }
                    ].map((sort) => (
                      <button
                        key={sort.key}
                        onClick={() => handleSortChange(sort.key as typeof sortBy)}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          sortBy === sort.key
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {sort.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  共 {posts.length} 篇文章
                </div>
              </div>
            </div>

            {/* 文章列表 */}
            {postsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无相关文章</h3>
                <p className="text-gray-500">
                  该标签下还没有发布文章
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            )}
          </div>

          {/* 侧边栏 */}
          <div className="lg:col-span-1">
            <TagSidebar tag={tag} />
          </div>
        </div>
      </div>
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
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 mr-3">
            {post.author.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.displayName}
                className="w-10 h-10 rounded-full"
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
              className={`avatar-fallback w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center ${post.author.avatar ? 'hidden' : 'flex'}`}
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

// 标签侧边栏组件
function TagSidebar({ tag }: { tag: Tag }) {
  return (
    <div className="space-y-6">
      {/* 标签统计 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">标签统计</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">文章数量</span>
            <span className="font-medium text-gray-900">{tag.postCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">关注人数</span>
            <span className="font-medium text-gray-900">{tag.followerCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">创建时间</span>
            <span className="font-medium text-gray-900">
              {new Date(tag.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </div>
      </div>

      {/* 相关标签 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">相关标签</h3>
        <div className="space-y-2">
          {['技术', '前端', '开发', 'JavaScript', 'React'].map((relatedTag) => (
            <button
              key={relatedTag}
              onClick={() => window.location.href = `/search?q=${relatedTag}`}
              className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              #{relatedTag}
            </button>
          ))}
        </div>
      </div>

      {/* 活跃创作者 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">活跃创作者</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div className="flex-shrink-0 mr-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">创作者 {i}</p>
                <p className="text-xs text-gray-500">{Math.floor(Math.random() * 50) + 10} 篇文章</p>
              </div>
              <button className="text-indigo-600 text-xs font-medium hover:text-indigo-500 transition-colors">
                关注
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 