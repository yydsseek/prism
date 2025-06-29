'use client';

import { useState, useEffect } from 'react';
import { tagApi } from '../../lib/contentApi';
import type { Tag } from '../../types/content';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [followedTags, setFollowedTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'following'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 加载标签列表
  const loadTags = async () => {
    setLoading(true);
    try {
      let response;
      
      switch (activeTab) {
        case 'all':
          response = await tagApi.getTags({ 
            search: searchQuery || undefined,
            limit: 50 
          });
          setTags(response.data.tags || []);
          break;
        case 'popular':
          response = await tagApi.getTags({ 
            popular: true,
            limit: 50 
          });
          setTags(response.data.tags || []);
          break;
        case 'following':
          response = await tagApi.getFollowedTags({ limit: 50 });
          setFollowedTags(response.data.tags || []);
          break;
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
  const handleFollowToggle = async (tag: Tag) => {
    try {
      const response = await tagApi.followTag(tag._id);
      
      // 更新标签状态
      const updateTag = (prevTag: Tag) => ({
        ...prevTag,
        isFollowed: response.data.isFollowed,
        followerCount: response.data.isFollowed 
          ? prevTag.followerCount + 1 
          : prevTag.followerCount - 1
      });

      if (activeTab === 'following') {
        setFollowedTags(prev => 
          response.data.isFollowed 
            ? [...prev, updateTag(tag)]
            : prev.filter(t => t._id !== tag._id)
        );
      } else {
        setTags(prev => prev.map(t => t._id === tag._id ? updateTag(t) : t));
      }
    } catch (error) {
      console.error('关注操作失败:', error);
    }
  };

  // 切换标签页
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveTab('all'); // 搜索时切换到全部标签
  };

  const displayTags = activeTab === 'following' ? followedTags : tags;

  return (
    <div className="min-h-screen bg-gray-50">
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
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="搜索标签..."
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
                onClick={() => handleTabChange(tab.key as typeof activeTab)}
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

        {/* 标签列表 */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : displayTags.length === 0 ? (
          <EmptyState activeTab={activeTab} searchQuery={searchQuery} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayTags.map((tag) => (
              <TagCard 
                key={tag._id} 
                tag={tag} 
                onFollowToggle={handleFollowToggle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 标签卡片组件
function TagCard({ 
  tag, 
  onFollowToggle 
}: { 
  tag: Tag; 
  onFollowToggle: (tag: Tag) => void;
}) {
  return (
    <div 
      className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      style={{ borderLeftColor: tag.color, borderLeftWidth: '4px' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg mr-3"
            style={{ backgroundColor: tag.color }}
          >
            {tag.icon || tag.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{tag.name}</h3>
            <div className="flex items-center space-x-2">
              {tag.isHot && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  🔥 热门
                </span>
              )}
              {tag.isRecommended && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  推荐
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {tag.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{tag.description}</p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-4">
          <span>{tag.postCount} 文章</span>
          <span>{tag.followerCount} 关注</span>
        </div>
      </div>

      <button 
        onClick={() => onFollowToggle(tag)}
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

// 空状态组件
function EmptyState({ 
  activeTab, 
  searchQuery 
}: { 
  activeTab: string; 
  searchQuery: string;
}) {
  const getEmptyMessage = () => {
    if (searchQuery) {
      return {
        title: '没有找到相关标签',
        description: '尝试使用不同的关键词搜索'
      };
    }
    
    switch (activeTab) {
      case 'following':
        return {
          title: '还没有关注任何标签',
          description: '关注感兴趣的标签，获取相关内容推荐'
        };
      case 'popular':
        return {
          title: '暂无热门标签',
          description: '热门标签正在统计中'
        };
      default:
        return {
          title: '暂无标签',
          description: '标签正在加载中'
        };
    }
  };

  const { title, description } = getEmptyMessage();

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
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6">{description}</p>
      {activeTab === 'following' && (
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
          浏览热门标签
        </button>
      )}
    </div>
  );
} 