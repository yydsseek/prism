# Prism Frontend

这是 Prism 内容创作者平台的前端应用，使用 Next.js 14 和 TypeScript 构建。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand + React Query
- **表单**: React Hook Form + Zod
- **认证**: NextAuth.js
- **支付**: Stripe
- **图标**: Lucide React
- **编辑器**: Monaco Editor / TinyMCE

## 安装和运行

### 前提条件

- Node.js 18+ 
- npm 或 yarn 或 pnpm

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 环境变量

复制 `.env.example` 文件为 `.env.local` 并填入相应的值：

```bash
cp env.example .env.local
```

需要配置的环境变量：

- `NEXT_PUBLIC_API_URL`: 后端API地址
- `NEXT_PUBLIC_APP_URL`: 前端应用地址
- `NEXTAUTH_SECRET`: NextAuth密钥
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe公钥
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: Cloudinary云名称
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`: Cloudinary上传预设

### 开发模式

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

应用将在 [http://localhost:3000](http://localhost:3000) 启动。

### 构建

```bash
npm run build
# 或
yarn build
# 或
pnpm build
```

### 启动生产版本

```bash
npm run start
# 或
yarn start
# 或
pnpm start
```

## 项目结构

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router 页面
│   │   ├── (auth)/         # 认证相关页面
│   │   ├── dashboard/      # 仪表板页面
│   │   ├── posts/          # 文章相关页面
│   │   └── ...
│   ├── components/         # React 组件
│   │   ├── ui/            # 基础 UI 组件
│   │   ├── forms/         # 表单组件
│   │   ├── layout/        # 布局组件
│   │   └── ...
│   ├── hooks/             # 自定义 Hooks
│   ├── lib/               # 工具函数和配置
│   │   ├── api.ts         # API 客户端
│   │   ├── auth.ts        # 认证配置
│   │   └── utils.ts       # 工具函数
│   └── types/             # TypeScript 类型定义
├── public/                # 静态资源
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 主要功能

### 用户功能
- 用户注册和登录
- 个人资料管理
- 邮箱验证
- 密码重置

### 创作者功能
- 成为创作者
- 文章创作和编辑
- 订阅者管理
- 收益统计

### 订阅功能
- 浏览创作者
- 订阅/取消订阅
- 支付管理
- 订阅历史

### 内容功能
- 文章浏览
- 搜索和筛选
- 点赞和评论
- 分享功能

## 开发指南

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 和 Prettier 配置
- 使用 Tailwind CSS 进行样式设计
- 组件使用 PascalCase 命名
- 文件使用 kebab-case 命名

### 组件开发

1. 在 `src/components` 目录下创建组件
2. 使用 TypeScript 定义 Props 接口
3. 添加适当的默认值和类型检查
4. 使用 Tailwind CSS 进行样式设计

### API 集成

1. 在 `src/lib/api.ts` 中定义 API 方法
2. 使用 React Query 进行数据获取和缓存
3. 在组件中使用自定义 hooks 调用 API

### 状态管理

- 使用 Zustand 管理全局状态
- 使用 React Query 管理服务器状态
- 使用 useState 管理本地组件状态

## 部署

### Vercel (推荐)

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 自动部署

### Docker

```bash
# 构建镜像
docker build -t prism-frontend .

# 运行容器
docker run -p 3000:3000 prism-frontend
```

### 其他平台

项目支持部署到任何支持 Node.js 的平台，如 Netlify、Railway、Render 等。

## 贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

该项目使用 MIT 许可证。查看 [LICENSE](../LICENSE) 文件了解详情。 