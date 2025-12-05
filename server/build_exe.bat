@echo off
chcp 65001 >nul
echo ========================================
echo 使用 PyInstaller 打包 server 为 exe
echo ========================================
echo.

REM 检查是否安装了 PyInstaller
python -c "import PyInstaller" 2>nul
if errorlevel 1 (
    echo [错误] 未安装 PyInstaller
    echo 正在安装 PyInstaller...
    pip install pyinstaller
    if errorlevel 1 (
        echo [错误] PyInstaller 安装失败
        pause
        exit /b 1
    )
)

echo [信息] PyInstaller 已安装
echo.

REM 清理之前的构建文件
if exist build (
    echo [清理] 删除 build 目录...
    rmdir /s /q build
)

if exist dist (
    echo [清理] 删除 dist 目录...
    rmdir /s /q dist
)

echo.
echo [开始] 使用 PyInstaller 打包...
echo.

REM 使用 spec 文件打包
pyinstaller server.spec

if errorlevel 1 (
    echo.
    echo [错误] 打包失败！
    pause
    exit /b 1
)

echo.
echo ========================================
echo 打包完成！
echo ========================================
echo.
echo exe 文件位置: dist\server\server.exe
echo 依赖文件位置: dist\server\_internal\
echo.
echo 注意：
echo 1. 首次运行前，请确保有 .env 配置文件（可复制 env.example 到 dist\server\ 目录）
echo 2. 如果打包时 dist 目录不存在，请先运行 npm run build 构建游戏
echo 3. 分发时需要将整个 dist\server\ 目录一起分发
echo 4. .env 文件需要与 server.exe 在同一目录，或配置环境变量
echo.
pause

