#!/bin/bash

echo "🚀 Setting up Prism - Content Creator Platform"
echo "=============================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# 安装后端依赖
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# 复制环境变量文件
if [ ! -f .env ]; then
    cp env.example .env
    echo "📝 Created .env file from env.example"
    echo "⚠️  Please edit backend/.env file with your configuration"
fi

cd ..

# 安装前端依赖
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# 复制环境变量文件
if [ ! -f .env.local ]; then
    cp env.example .env.local
    echo "📝 Created .env.local file from env.example"
    echo "⚠️  Please edit frontend/.env.local file with your configuration"
fi

cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure your environment variables:"
echo "   - Edit backend/.env"
echo "   - Edit frontend/.env.local"
echo ""
echo "2. Start MongoDB database"
echo ""
echo "3. Start the development servers:"
echo "   Backend:  cd backend && npm run dev  (http://localhost:4000)"
echo "   Frontend: cd frontend && npm run dev (http://localhost:3000)"
echo ""
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "📚 For more information, check the README.md files in each directory." 