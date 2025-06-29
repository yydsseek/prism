# 内容系统API接口文档

## 概述

本文档描述了类似Substack的内容发现系统的API接口，包括推荐内容、订阅内容、标签管理、收藏功能等。

## 新增模型

### 1. Tag (标签模型)
- 标签名称、描述、颜色、图标
- 文章数量、关注者数量统计
- 热门标签、推荐标签标识
- 标签状态管理

### 2. Bookmark (收藏模型)
- 用户收藏文章管理
- 收藏夹分类功能
- 收藏备注和标签
- 公开/私有收藏设置
- 收藏时文章快照保存

### 3. TagFollow (标签关注模型)
- 用户关注标签管理
- 通知偏好设置
- 关注来源追踪

## 核心功能

### 内容推荐算法
- 基于用户订阅的创作者
- 基于关注的标签
- 基于收藏历史分析
- 热门度和时效性权重
- 个性化评分系统

### 内容聚合
- 推荐内容流
- 订阅内容流
- 热门内容排行
- 标签内容聚合

## API接口

### 内容发现接口

#### GET /api/content/recommended
获取个性化推荐内容
- 需要认证
- 支持分页
- 基于用户偏好推荐

#### GET /api/content/subscribed
获取订阅内容
- 需要认证
- 包含订阅创作者和关注标签的内容
- 支持排序和分页

#### GET /api/content/popular
获取热门内容
- 可选认证
- 支持时间范围过滤（day/week/month/all）
- 基于阅读量、点赞数、收藏数排序

### 标签管理接口

#### GET /api/content/tags
获取标签列表
- 可选认证
- 支持搜索和热门标签过滤
- 返回关注状态（已登录用户）

#### GET /api/content/tags/:slug
获取标签详情和相关文章
- 可选认证
- 返回标签信息和文章列表
- 支持排序和分页

#### POST /api/content/tags/:id/follow
关注/取消关注标签
- 需要认证
- 切换关注状态
- 更新关注者数量

#### GET /api/content/tags/following
获取用户关注的标签
- 需要认证
- 返回关注的标签列表
- 包含通知偏好设置

### 收藏管理接口

#### POST /api/content/bookmarks
收藏文章
- 需要认证
- 支持收藏夹分类
- 支持备注和标签
- 支持公开/私有设置

#### DELETE /api/content/bookmarks/:postId
取消收藏文章
- 需要认证
- 删除指定收藏

#### GET /api/content/bookmarks
获取用户收藏列表
- 需要认证
- 支持收藏夹过滤
- 支持标签过滤
- 支持排序和分页

#### GET /api/content/bookmarks/collections
获取用户收藏夹列表
- 需要认证
- 返回收藏夹统计信息

#### PUT /api/content/bookmarks/:postId
更新收藏信息
- 需要认证
- 更新收藏夹、备注、标签等

#### GET /api/content/bookmarks/check/:postId
检查文章收藏状态
- 需要认证
- 返回是否已收藏

#### GET /api/content/bookmarks/popular
获取热门收藏
- 可选认证
- 返回被收藏最多的文章

### 搜索接口

#### GET /api/content/search
搜索内容
- 可选认证
- 支持文章和标签搜索
- 支持分页
- 全文搜索功能

## 前端页面

### 1. /content - 内容发现页
- 推荐、订阅、热门、标签四个标签页
- 时间范围过滤
- 响应式布局
- 侧边栏推荐

### 2. /bookmarks - 收藏管理页
- 收藏夹分类管理
- 收藏列表展示
- 排序和筛选功能
- 收藏操作管理

### 3. /tags - 标签管理页
- 全部、热门、关注三个标签页
- 标签搜索功能
- 标签关注管理
- 网格布局展示

### 4. /tags/[slug] - 标签详情页
- 标签信息展示
- 相关文章列表
- 关注操作
- 侧边栏统计和推荐

### 5. /search - 搜索页面
- 综合搜索功能
- 文章和标签分类
- 搜索建议和热门搜索
- 空状态处理

## 数据库优化

### 索引策略
- 用户ID和文章ID复合索引
- 标签关注复合索引
- 文章状态和发布时间索引
- 全文搜索索引

### 聚合查询
- 收藏夹统计聚合
- 热门收藏统计聚合
- 标签文章数量统计

## 推荐算法详情

### 评分因子
1. **订阅创作者权重**: +50分
2. **关注标签权重**: 每个匹配标签 +20分
3. **热门度权重**: 
   - 阅读量对数 × 2
   - 点赞数 × 5
   - 收藏数 × 10
4. **时效性权重**:
   - 24小时内: +30分
   - 7天内: +20分递减

### 时间衰减
- 使用指数衰减函数
- 7天半衰期
- 保持内容新鲜度

## 安全和权限

### 认证要求
- 推荐内容需要登录
- 收藏功能需要登录
- 标签关注需要登录
- 搜索和浏览可匿名

### 数据隐私
- 收藏可设置私有
- 个人推荐不泄露
- 用户行为数据保护

## 性能优化

### 缓存策略
- 热门内容缓存
- 标签列表缓存
- 推荐结果缓存

### 分页优化
- 游标分页支持
- 预加载机制
- 无限滚动优化

## 扩展功能

### 未来规划
1. 内容推送通知
2. 个性化邮件摘要
3. 社交分享功能
4. 内容分析报告
5. AI智能推荐

### 集成能力
- 第三方内容源
- 社交媒体集成
- RSS订阅支持
- 内容导出功能

---

## 使用示例

### 获取推荐内容
```javascript
GET /api/content/recommended?page=1&limit=20
Authorization: Bearer <token>
```

### 关注标签
```javascript
POST /api/content/tags/60f1234567890/follow
Authorization: Bearer <token>
```

### 收藏文章
```javascript
POST /api/content/bookmarks
Authorization: Bearer <token>
Content-Type: application/json

{
  "postId": "60f1234567890",
  "collectionName": "技术文章",
  "note": "很有价值的内容",
  "tags": ["学习", "收藏"],
  "isPublic": false
}
```

### 搜索内容
```javascript
GET /api/content/search?q=技术&type=posts&page=1&limit=20
```

所有接口都遵循RESTful设计原则，返回统一的JSON格式响应。 