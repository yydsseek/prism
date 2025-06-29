'use client';

import { useState, useEffect } from 'react';
import { tagApi } from '../../lib/contentApi';
import type { Tag } from '../../types/content';
import TopNavBar from '../../components/TopNavBar';

export default function TagsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'following'>('all');
  const [tags, setTags] = useState<Tag[]>([]);
  const [followedTags, setFollowedTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // 加载标签列表
  const loadTags = async () => {
    setLoading(true);
    try {
      let response;
      
      switch (activeTab) {
        case 'popular':
          response = await tagApi.getTags({ popular: true, limit: 50 });
          setTags(response.data.tags || []);
          break;
        case 'following':
          response = await tagApi.getFollowedTags({ limit: 50 });
          setFollowedTags(response.data.tags || []);
          break;
        default:
          response = await tagApi.getTags({ 
            limit: 50, 
            search: searchQuery || undefined 
          });
          setTags(response.data.tags || []);
      }
    } catch (error) {
      console.error('加载标签失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, [activeTab, searchQuery]);

  // 关注/取消关注标签
  const handleFollowTag = async (tagId: string) => {
    try {
      const response = await tagApi.followTag(tagId);
      
      // 更新标签的关注状态
      if (activeTab === 'all' || activeTab === 'popular') {
        setTags(prev => prev.map(tag => 
          tag._id === tagId 
            ? { ...tag, isFollowed: response.data.isFollowed }
            : tag
        ));
      }
      
      // 如果是取消关注，从关注列表中移除
      if (activeTab === 'following' && !response.data.isFollowed) {
        setFollowedTags(prev => prev.filter(tag => tag._id !== tagId));
      }
    } catch (error) {
      console.error('关注操作失败:', error);
    }
  };

  // 搜索处理
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (activeTab !== 'all') {
      setActiveTab('all');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">标签中心</h1>
          <p className="mt-2 text-gray-600">发现和关注感兴趣的话题标签</p>
        </div>

        {/* 搜索栏 */}
        <div className="mb-6">
          <div className="max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="搜索标签..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* 标签导航 */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { key: 'all', label: '全部标签' },
              { key: 'popular', label: '热门标签' },
              { key: 'following', label: '我的关注' }
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
              </button>
            ))}
          </nav>
        </div>

        {/* 标签网格 */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <TagGrid 
            tags={activeTab === 'following' ? followedTags : tags} 
            onFollowTag={handleFollowTag}
            emptyMessage={
              activeTab === 'following' 
                ? '您还没有关注任何标签' 
                : searchQuery 
                  ? `没有找到包含 "${searchQuery}" 的标签`
                  : '暂无标签'
            }
          />
        )}
      </div>
    </div>
  );
}

// 标签网格组件
function TagGrid({ 
  tags, 
  onFollowTag, 
  emptyMessage 
}: { 
  tags: Tag[];
  onFollowTag: (tagId: string) => void;
  emptyMessage: string;
}) {
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyMessage}</h3>
        <p className="text-gray-500">
          尝试搜索其他关键词或浏览热门标签
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {tags.map((tag) => (
        <TagCard key={tag._id} tag={tag} onFollow={onFollowTag} />
      ))}
    </div>
  );
}

// 标签卡片组件
function TagCard({ 
  tag, 
  onFollow 
}: { 
  tag: Tag; 
  onFollow: (tagId: string) => void;
}) {
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
      style={{ borderLeftColor: tag.color, borderLeftWidth: '4px' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{tag.name}</h3>
            {tag.isPopular && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                热门
              </span>
            )}
            {tag.isRecommended && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                推荐
              </span>
            )}
          </div>
          
          {tag.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{tag.description}</p>
          )}
          
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <span>{tag.postCount} 文章</span>
            <span>{tag.followerCount} 关注</span>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => onFollow(tag._id)}
        className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          tag.isFollowed
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {tag.isFollowed ? '已关注' : '关注'}
      </button>
    </div>
  );
} 