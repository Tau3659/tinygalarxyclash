@echo off
chcp 65001 >nul
echo ========================================
echo    推送代码到GitHub
echo ========================================
echo.

REM 检查是否已配置
if not exist .git (
    echo [错误] Git仓库未初始化
    echo 请先运行 setup_git.bat
    pause
    exit /b 1
)

echo [提示] 准备推送代码到GitHub...
echo 仓库地址: https://github.com/Tau3659/tinygalarxyclash.git
echo.

REM 推送到GitHub
echo 正在推送...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo    推送成功！
    echo ========================================
    echo.
    echo 你的代码已成功上传到GitHub
    echo 访问地址: https://github.com/Tau3659/tinygalarxyclash
    echo.
) else (
    echo.
    echo ========================================
    echo    推送失败
    echo ========================================
    echo.
    echo 可能的原因：
    echo 1. 需要GitHub身份验证
    echo 2. 网络连接问题
    echo 3. 仓库权限问题
    echo.
    echo 解决方案：
    echo 1. 使用GitHub Desktop（推荐）
    echo 2. 配置SSH密钥
    echo 3. 使用Personal Access Token
    echo.
)

pause
