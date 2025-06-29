export interface Tag {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon?: string;
  postCount: number;
  followerCount: number;
  isPopular: boolean;
  isRecommended: boolean;
  isFollowed?: boolean;
  isHot?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TagFollow {
  _id: string;
  user: string;
  tag: Tag;
  notifications: {
    newPosts: boolean;
    trendingPosts: boolean;
    dailyDigest: boolean;
    weeklyDigest: boolean;
  };
  source: 'recommendation' | 'search' | 'post' | 'manual' | 'import';
  followedAt: string;
  createdAt: string;
}

export interface Bookmark {
  _id: string;
  user: string;
  post: Post;
  collectionName: string;
  note?: string;
  isPublic: boolean;
  tags: string[];
  postSnapshot: {
    title: string;
    author: string;
    publishedAt: string;
    summary: string;
  };
  isRecent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkCollection {
  _id: string;
  count: number;
  lastUpdated: string;
}

export interface Post {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: {
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
    bio?: string;
    isCreator: boolean;
  };
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'subscribers' | 'private';
  featuredImage?: string;
  tags: Tag[];
  tagNames: string[];
  category: string;
  readingTime: number;
  wordCount: number;
  views: number;
  likeCount: number;
  commentCount: number;
  stats: {
    bookmarkCount: number;
    shareCount: number;
  };
  recommendationScore: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  isBookmarked?: boolean;
  isLiked?: boolean;
  personalizedScore?: number;
}

export interface ContentFilters {
  page?: number;
  limit?: number;
  sortBy?: 'publishedAt' | 'views' | 'likeCount' | 'createdAt';
  sortOrder?: 1 | -1;
  timeRange?: 'day' | 'week' | 'month' | 'all';
  collection?: string;
  tags?: string[];
  search?: string;
}

export interface PaginationInfo {
  current: number;
  pages: number;
  total: number;
  hasMore: boolean;
}

export interface ContentResponse<T> {
  success: boolean;
  data: {
    posts?: T[];
    tags?: Tag[];
    bookmarks?: Bookmark[];
    collections?: BookmarkCollection[];
    results?: T[];
    pagination?: PaginationInfo;
  };
  message?: string;
}

export interface SearchFilters {
  q: string;
  type?: 'posts' | 'tags' | 'users';
  page?: number;
  limit?: number;
}

export interface RecommendationPreferences {
  subscribedCreators: string[];
  followedTags: string[];
  bookmarkedPosts: string[];
  readingHistory: any[];
  preferences: {
    favoriteTopics: string[];
    readingTime: number;
  };
} 