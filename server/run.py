#!/usr/bin/env python3
"""
服务器启动脚本
支持从 .env 文件加载环境变量
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# 加载 .env 文件
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
    print(f"📁 静态文件目录: {Path(__file__).parent.parent / 'dist'}")
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

