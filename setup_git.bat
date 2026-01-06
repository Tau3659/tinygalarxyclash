@echo off
chcp 65001 >nul
echo ========================================
echo    GitHub 仓库配置脚本
echo ========================================
echo.

REM 检查Git是否已安装
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Git，请先安装Git
    echo.
    echo 请访问以下地址下载安装Git:
    echo https://git-scm.com/download/win
    echo.
    echo 安装完成后，重新运行此脚本
    pause
    exit /b 1
)

echo [✓] Git已安装
echo.

REM 配置Git用户信息（如果还没配置）
git config --global user.name >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] 请配置Git用户信息
    set /p username="请输入你的GitHub用户名: "
    set /p email="请输入你的GitHub邮箱: "
    git config --global user.name "%username%"
    git config --global user.email "%email%"
    echo [✓] Git用户信息配置完成
    echo.
)

REM 初始化Git仓库
if not exist .git (
    echo [1/5] 初始化Git仓库...
    git init
    echo [✓] 初始化完成
    echo.
) else (
    echo [✓] Git仓库已存在
    echo.
)

REM 添加所有文件
echo [2/5] 添加文件到暂存区...
git add .
echo [✓] 文件添加完成
echo.

REM 提交到本地仓库
echo [3/5] 提交到本地仓库...
git commit -m "初始提交：无人机战略游戏 v1.0.0"
if %errorlevel% equ 0 (
    echo [✓] 提交完成
) else (
    echo [提示] 可能没有新的更改需要提交
)
echo.

REM 设置主分支名称
echo [4/5] 设置主分支为main...
git branch -M main
echo [✓] 分支设置完成
echo.

REM 添加远程仓库
echo [5/5] 关联远程仓库...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/Tau3659/tinygalarxyclash.git
echo [✓] 远程仓库关联完成
echo.

echo ========================================
echo    配置完成！
echo ========================================
echo.
echo 下一步：推送代码到GitHub
echo.
echo 请运行以下命令：
echo     git push -u origin main
echo.
echo 或者运行：
echo     push_to_github.bat
echo.
pause
