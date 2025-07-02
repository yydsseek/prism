// 导入通用请求函数
async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: any
): Promise<T> {
  let baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  let finalUrl = `${baseURL}${url}`;
  let options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(localStorage.getItem('token') && {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      })
    }
  };

  // 对于GET请求，将数据作为查询参数
  if (method === 'GET' && data) {
    const params = new URLSearchParams();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        params.append(key, data[key].toString());
      }
    });
    finalUrl += `?${params.toString()}`;
  } else if (data && method !== 'GET') {
    // 对于非GET请求，将数据作为body
    options.body = JSON.stringify(data);
  }

  const response = await fetch(finalUrl, options);
  return response.json();
}
import type { 
  Post, 
  Tag, 
  Bookmark, 
  BookmarkCollection,
  ContentFilters, 
  SearchFilters,
  ContentResponse 
} from '../types/content';

// 内容推荐API
export const contentApi = {
  // 获取推荐内容
  getRecommended: (filters?: ContentFilters) => 
    request<ContentResponse<Post>>('GET', '/content/recommended', filters),

  // 获取订阅内容
  getSubscribed: (filters?: ContentFilters) => 
    request<ContentResponse<Post>>('GET', '/content/subscribed', filters),

  // 获取热门内容
  getPopular: (filters?: ContentFilters) => 
    request<ContentResponse<Post>>('GET', '/content/popular', filters),

  // 搜索内容
  search: (filters: SearchFilters) => 
    request<ContentResponse<Post | Tag>>('GET', '/content/search', filters),
};

// 标签API
export const tagApi = {
  // 获取标签列表
  getTags: (filters?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    popular?: boolean 
  }) => 
    request<ContentResponse<Tag>>('GET', '/content/tags', filters),

  // 获取标签详情和相关内容
  getTagDetails: (slug: string, filters?: ContentFilters) => 
    request<ContentResponse<Post> & { data: { tag: Tag } }>('GET', `/content/tags/${slug}`, filters),

  // 关注/取消关注标签
  followTag: (tagId: string) => 
    request<{ success: boolean; message: string; data: { isFollowed: boolean } }>('POST', `/content/tags/${tagId}/follow`),

  // 获取用户关注的标签
  getFollowedTags: (filters?: { page?: number; limit?: number }) => 
    request<ContentResponse<Tag>>('GET', '/content/tags/following', filters),
};

// 收藏API
export const bookmarkApi = {
  // 收藏文章
  bookmarkPost: (data: {
    postId: string;
    collection?: string;
    note?: string;
    tags?: string[];
    isPublic?: boolean;
  }) => 
    request<{ success: boolean; message: string; data: { bookmark: Bookmark } }>('POST', '/content/bookmarks', data),

  // 取消收藏
  unbookmarkPost: (postId: string) => 
    request<{ success: boolean; message: string }>('DELETE', `/content/bookmarks/${postId}`),

  // 获取收藏列表
  getBookmarks: (filters?: ContentFilters) => 
    request<ContentResponse<Bookmark>>('GET', '/content/bookmarks', filters),

  // 获取收藏夹列表
  getCollections: () => 
    request<ContentResponse<BookmarkCollection>>('GET', '/content/bookmarks/collections'),

  // 更新收藏
  updateBookmark: (postId: string, data: {
    collection?: string;
    note?: string;
    tags?: string[];
    isPublic?: boolean;
  }) => 
    request<{ success: boolean; message: string; data: { bookmark: Bookmark } }>('PUT', `/content/bookmarks/${postId}`, data),

  // 检查文章是否已收藏
  checkBookmark: (postId: string) => 
    request<{ success: boolean; data: { isBookmarked: boolean; bookmark: Bookmark | null } }>('GET', `/content/bookmarks/check/${postId}`),

  // 获取热门收藏
  getPopularBookmarks: (limit?: number) => 
    request<ContentResponse<any>>('GET', '/content/bookmarks/popular', { limit }),
};

export default {
  ...contentApi,
  tags: tagApi,
  bookmarks: bookmarkApi,
}; 