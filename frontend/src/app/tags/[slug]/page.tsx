'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { tagApi } from '../../../lib/contentApi';
import type { Tag, Post, ContentFilters } from '../../../types/content';

export default function TagDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [tag, setTag] = useState<Tag | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
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
      setFollowing(response.data.tag.isFollowed || false);
    } catch (error) {
      console.error('加载标签详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      loadTagDetails();
    }
  }, [slug, filters]);

  // 关注/取消关注标签
  const handleFollowToggle = async () => {
    if (!tag) return;
    
    try {
      const response = await tagApi.followTag(tag._id);
      setFollowing(response.data.isFollowed);
      
      // 更新标签的关注者数量
      setTag(prev => prev ? {
        ...prev,
        followerCount: response.data.isFollowed 
          ? prev.followerCount + 1 
          : prev.followerCount - 1
      } : null);
    } catch (error) {
      console.error('关注操作失败:', error);
    }
  };

  // 切换排序
  const handleSortChange = (sortBy: 'publishedAt' | 'views' | 'likeCount') => {
    setFilters(prev => ({ ...prev, sortBy, page: 1 }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">标签不存在</h2>
          <p className="text-gray-600">您访问的标签不存在或已被删除</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标签头部 */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-4">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-4"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.icon || tag.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{tag.name}</h1>
                  <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                    <span>{tag.postCount} 篇文章</span>
                    <span>{tag.followerCount} 关注者</span>
                    {tag.isHot && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        🔥 热门
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

            <div className="flex-shrink-0 ml-6">
              <button
                onClick={handleFollowToggle}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  following
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {following ? '已关注' : '关注标签'}
              </button>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 主内容区 */}
          <div className="lg:col-span-3">
            {/* 排序工具栏 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
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
                        onClick={() => handleSortChange(sort.key as any)}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          filters.sortBy === sort.key
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'text-gray-500 hover:text-gray-700'
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
            {posts.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无相关文章</h3>
                <p className="text-gray-500">这个标签下还没有发布的文章</p>
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
            <TagSidebar currentTag={tag} />
          </div>
        </div>
      </div>
    </div>
  );
}

// 文章卡片组件
function PostCard({ post }: { post: Post }) {
  return (
    <article className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
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
          <img
            src={post.author.avatar || '/default-avatar.png'}
            alt={post.author.displayName}
            className="w-10 h-10 rounded-full mr-3"
          />
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

        {/* 其他标签 */}
        {post.tags && post.tags.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
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

        {/* 文章统计 */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>{post.views} 阅读</span>
            <span>{post.likeCount} 点赞</span>
            <span>{post.stats.bookmarkCount} 收藏</span>
            <span>{post.readingTime} 分钟阅读</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="hover:text-indigo-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button className="hover:text-indigo-600">
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
function TagSidebar({ currentTag }: { currentTag: Tag }) {
  const [relatedTags, setRelatedTags] = useState<Tag[]>([]);

  useEffect(() => {
    // 这里可以加载相关标签
    // 暂时使用模拟数据
    setRelatedTags([]);
  }, [currentTag]);

  return (
    <div className="space-y-6">
      {/* 标签统计 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">标签统计</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">文章数量</span>
            <span className="text-sm font-medium text-gray-900">{currentTag.postCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">关注者</span>
            <span className="text-sm font-medium text-gray-900">{currentTag.followerCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">创建时间</span>
            <span className="text-sm font-medium text-gray-900">
              {new Date(currentTag.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </div>
      </div>

      {/* 相关标签 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">相关标签</h3>
        <div className="space-y-2">
          {['技术', '创业', '设计', '产品'].map((tagName) => (
            <button
              key={tagName}
              className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
            >
              #{tagName}
            </button>
          ))}
        </div>
      </div>

      {/* 热门创作者 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">活跃创作者</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <img
                src={`/creator-${i}.jpg`}
                alt="创作者"
                className="w-10 h-10 rounded-full mr-3"
                onError={(e) => {
                  e.currentTarget.src = '/default-avatar.png';
                }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">创作者 {i}</p>
                <p className="text-xs text-gray-500">5 篇文章</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 