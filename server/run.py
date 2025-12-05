#!/usr/bin/env python3
"""
服务器启动脚本
支持从 .env 文件加载环境变量
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# 加载 .env 文件
# 在 PyInstaller 打包后的环境中，.env 文件应该与 exe 文件在同一目录
if getattr(sys, 'frozen', False):
    # 打包后的环境：.env 文件应该在 exe 文件所在目录
    env_path = Path(sys.executable).parent / '.env'
else:
    # 开发环境：.env 文件在脚本所在目录
    env_path = Path(__file__).parent / '.env'

if env_path.exists():
    load_dotenv(env_path)
    print(f"✓ 已加载环境变量文件: {env_path}")
else:
    print(f"⚠ 未找到 .env 文件: {env_path}")
    print("   提示: 可以复制 env.example 为 .env 并配置")

# 导入并运行主应用
if __name__ == "__main__":
    import uvicorn
    from main import app
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "18000"))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    print(f"\n{'='*50}")
    print(f"🚀 游戏服务器启动中...")
    print(f"{'='*50}")
    # 静态文件目录路径会在 main.py 中正确设置
    print(f"📁 静态文件目录: (在 main.py 中设置)")
    print(f"🌐 服务器地址: http://{host}:{port}")
    print(f"📊 健康检查: http://{host}:{port}/health")
    print(f"🎤 TTS 服务: http://{host}:{port}/api/tts")
    print(f"🔧 调试模式: {'开启' if debug else '关闭'}")
    print(f"{'='*50}\n")
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        reload=debug
    )

