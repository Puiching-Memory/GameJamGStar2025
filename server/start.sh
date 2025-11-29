#!/bin/bash
# 服务器启动脚本（Linux/Mac）

# 检查 uv 是否安装
if ! command -v uv &> /dev/null; then
    echo "错误: 未找到 uv，请先安装 uv"
    echo "安装方法: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# 使用 uv 运行服务器
uv run python run.py

