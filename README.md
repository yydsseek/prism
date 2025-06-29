# Prism - 内容创作者平台

一个现代化的内容创作者平台，类似于 Substack，支持付费订阅、文章发布和用户管理。

## 🚀 技术栈

### 前端
- **Next.js 14** - React框架 (App Router)
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **React Query** - 数据获取和缓存
- **Zustand** - 状态管理
- **React Hook Form + Zod** - 表单处理和验证
- **Lucide React** - 图标库

### 后端
- **Node.js + Express.js** - Web框架
- **MongoDB + Mongoose** - 数据库
- **JWT** - 身份验证
- **Stripe** - 支付处理
- **Nodemailer** - 邮件服务
- **bcryptjs** - 密码加密

## 项目结构

```
prism/
├── frontend/          # Next.js 前端应用
│   ├── src/
│   │   ├── app/       # App Router
│   │   │   ├── components/ # React组件
│   │   │   ├── lib/       # 工具函数
│   │   │   ├── types/     # TypeScript类型
│   │   │   └── hooks/     # 自定义Hooks
│   │   ├── public/        # 静态资源
│   │   └── package.json
│   ├── backend/           # Node.js 后端API
│   │   ├── src/
│   │   │   ├── controllers/ # 控制器
│   │   │   ├── models/      # 数据模型
│   │   │   ├── routes/      # 路由
│   │   │   ├── middleware/  # 中间件
│   │   │   ├── services/    # 业务逻辑
│   │   │   └── utils/       # 工具函数
│   │   ├── config/          # 配置文件
│   │   └── package.json
│   ├── shared/            # 共享类型定义
│   └── docs/              # 项目文档
```

## 核心功能

### 用户系统
- [x] 用户注册/登录
- [x] 用户资料管理
- [x] JWT认证
- [x] 密码重置

### 内容管理
- [x] 文章发布/编辑
- [x] 富文本编辑器
- [x] 文章分类和标签
- [x] 草稿保存
- [x] 图片上传

### 订阅系统
- [x] 付费订阅
- [x] 免费订阅
- [x] 订阅者管理
- [x] 收入统计
- [x] Stripe支付集成

### 通知系统
- [x] 邮件通知
- [x] 订阅者更新提醒
- [x] 新文章发布通知

## 开发指南

### 环境要求
- Node.js 18+
- MongoDB 6+
- npm 或 yarn

### 快速开始

1. 克隆项目
```bash
git clone <repository-url>
cd prism
```

2. 一键安装（推荐）
```bash
./setup.sh
```

或手动安装：

```bash
# 安装后端依赖
cd backend && npm install

# 安装前端依赖
cd ../frontend && npm install
```

3. 环境配置
```bash
# 后端环境变量
cp backend/env.example backend/.env
# 编辑 backend/.env 文件

# 前端环境变量
cp frontend/env.example frontend/.env.local
# 编辑 frontend/.env.local 文件
```

4. 启动 MongoDB
```bash
# 使用 Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 或使用本地安装的 MongoDB
mongod
```

5. 启动开发服务器
```bash
# 启动后端 (端口 4000)
cd backend && npm run dev

# 启动前端 (端口 3000)
cd frontend && npm run dev
```

6. 访问应用
- 前端: http://localhost:3000
- 后端 API: http://localhost:4000

## API文档

详细的API文档请参考 `docs/api.md`

## 部署

项目支持Docker部署，配置文件位于 `docker/` 目录。

## 贡献指南

请参考 `CONTRIBUTING.md` 了解如何贡献代码。

## 许可证

MIT License 