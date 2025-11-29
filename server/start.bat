@echo off
REM 服务器启动脚本（Windows）

REM 检查 uv 是否安装
where uv >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 错误: 未找到 uv，请先安装 uv
    echo 安装方法: powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    exit /b 1
)

REM 使用 uv 运行服务器
uv run python run.py

