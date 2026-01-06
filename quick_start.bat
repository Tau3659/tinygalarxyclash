@echo off
chcp 65001 >nul
echo.
echo ========================================
echo    无人机战略游戏 - 快速启动脚本
echo ========================================
echo.

echo 🔍 检查Node.js环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js未安装或未添加到PATH
    echo 请先安装Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js已安装
node --version
echo.

echo 🔍 检查npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm不可用
    pause
    exit /b 1
)

echo ✅ npm可用
npm --version
echo.

echo 📦 检查依赖...
if not exist "node_modules" (
    echo 🔄 首次运行，正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已存在
)

echo.
echo 🧪 运行环境测试...
npm run test
if %errorlevel% neq 0 (
    echo ⚠️ 环境测试有问题，但可以尝试启动服务器
)

echo.
echo 🚀 启动游戏服务器...
echo 服务器地址: http://localhost:3000
echo 按 Ctrl+C 停止服务器
echo.

npm start