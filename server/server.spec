# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller 配置文件
用于将 server 打包为 Windows exe 文件
"""

import os
from pathlib import Path

# 获取项目根目录
# SPECPATH 是 PyInstaller 提供的变量，指向 spec 文件所在目录
# spec 文件在 server 目录下，所以 BASE_DIR 是 server 的父目录
try:
    # SPECPATH 指向 spec 文件所在目录（server 目录）
    SERVER_DIR = Path(SPECPATH)
    BASE_DIR = SERVER_DIR.parent
except NameError:
    # 如果 SPECPATH 不存在（在非 PyInstaller 环境中），使用当前文件所在目录
    SERVER_DIR = Path(__file__).parent if '__file__' in globals() else Path.cwd()
    BASE_DIR = SERVER_DIR.parent

DIST_DIR = BASE_DIR / "dist"

block_cipher = None

# 分析主脚本
a = Analysis(
    ['run.py'],
    pathex=[str(SERVER_DIR)],
    binaries=[],
    datas=[
        # 包含 .env 示例文件（如果存在）
    ] + ([(str(SERVER_DIR / 'env.example'), '.')] if (SERVER_DIR / 'env.example').exists() else []) + ([
        # 包含 dist 目录（如果存在，用于静态文件托管）
        (str(DIST_DIR), 'dist'),
    ] if DIST_DIR.exists() else []),
    hiddenimports=[
        'uvicorn',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.logging',
        'fastapi',
        'fastapi.staticfiles',
        'fastapi.responses',
        'fastapi.middleware.cors',
        'pydantic',
        'dashscope',
        'dashscope.audio.tts_v2',
        'httpx',
        'dotenv',
        # 'memori',  # 临时禁用（打包时 tiktoken 编码问题）
        # 'memorisdk',  # 临时禁用
        'openai',
        'asyncio',
        'aiofiles',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'memori',  # 临时禁用（打包时 tiktoken 编码问题）
        'memorisdk',
        'tiktoken',  # memori 的依赖，避免打包
        'litellm',  # memori 的依赖
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

# 数据文件已处理，无需过滤

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

# 目录模式：exe 文件不包含所有依赖，依赖放在 _internal 目录中
exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,  # 不将二进制文件打包进exe
    name='server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # 显示控制台窗口，方便查看日志
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # 可以添加图标文件路径，例如: str(SERVER_DIR / 'icon.ico')
)

# 收集所有文件到目录中
coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='server',
)

