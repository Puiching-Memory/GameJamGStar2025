"""
FastAPI 服务器
- 托管游戏静态文件（dist目录）
- 提供 CosyVoice TTS 服务
"""
import os
import sys
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio

# 加载 .env 文件（如果存在）
from dotenv import load_dotenv
# 在 PyInstaller 打包后的环境中，.env 文件应该与 exe 文件在同一目录
if getattr(sys, 'frozen', False):
    # 打包后的环境：.env 文件应该在 exe 文件所在目录
    env_path = Path(sys.executable).parent / '.env'
else:
    # 开发环境：.env 文件在脚本所在目录
    env_path = Path(__file__).parent / '.env'
if env_path.exists():
    load_dotenv(env_path)

# 导入 DashScope（CosyVoice 和 Qwen 通过 DashScope 提供）
import dashscope
from dashscope.audio.tts_v2 import SpeechSynthesizer

# 导入 httpx（用于流式下载音频）
import httpx

# 导入 Memori（用于解说记忆功能）
# 临时禁用 memori 库（打包时 tiktoken 编码问题）
# from memori import Memori

# 导入 OpenAI 客户端（用于 DashScope 兼容接口）
from openai import OpenAI

# 获取项目根目录
# 在 PyInstaller 打包后的环境中，使用 sys._MEIPASS 获取资源路径
if getattr(sys, 'frozen', False):
    # 打包后的环境
    # sys._MEIPASS 是 PyInstaller 临时解压目录（_internal 目录）
    # 数据文件会被放在这里
    BASE_DIR = Path(sys._MEIPASS)
    # 在打包后的环境中，dist 目录应该在 _internal/dist（PyInstaller 数据文件位置）
    DIST_DIR = BASE_DIR / "dist"
    if not DIST_DIR.exists():
        # 如果 _internal/dist 不存在，检查与 exe 同级的 dist
        # sys.executable 是 exe 文件路径
        exe_dir = Path(sys.executable).parent
        DIST_DIR = exe_dir / "dist"
    # 调试信息
    print(f"[路径调试] 打包模式: 是")
    print(f"[路径调试] sys._MEIPASS: {sys._MEIPASS}")
    print(f"[路径调试] sys.executable: {sys.executable}")
    print(f"[路径调试] BASE_DIR: {BASE_DIR}")
    print(f"[路径调试] DIST_DIR: {DIST_DIR}")
    print(f"[路径调试] DIST_DIR.exists(): {DIST_DIR.exists()}")
else:
    # 开发环境
    BASE_DIR = Path(__file__).parent.parent
    DIST_DIR = BASE_DIR / "dist"
    print(f"[路径调试] 打包模式: 否")
    print(f"[路径调试] DIST_DIR: {DIST_DIR}")
    print(f"[路径调试] DIST_DIR.exists(): {DIST_DIR.exists()}")

# 环境变量配置
# 默认使用 cosyvoice-v3-flash + longanzhi_v3，如需调整可在 .env 中覆盖
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "")
COSYVOICE_MODEL = os.getenv("COSYVOICE_MODEL", "cosyvoice-v3-flash")
COSYVOICE_VOICE = os.getenv("COSYVOICE_VOICE", "longanzhi_v3")
COSYVOICE_SPEECH_RATE = float(os.getenv("COSYVOICE_SPEECH_RATE", "1.0"))  # 语速：1.0为默认正常语速

# Memori 配置
# 临时禁用 memori 库（打包时 tiktoken 编码问题）
MEMORI_DATABASE = os.getenv("MEMORI_DATABASE", "sqlite:///./commentary_memory.db")  # 默认使用 SQLite
MEMORI_ENABLED = False  # 临时禁用：os.getenv("MEMORI_ENABLED", "true").lower() == "true"  # 是否启用 Memori
MEMORI_NAMESPACE = os.getenv("MEMORI_NAMESPACE", "git-card-game")  # 记忆命名空间，用于跨游戏局共享记忆

# 初始化 OpenAI 客户端（用于 DashScope 兼容接口）
openai_client = None
if DASHSCOPE_API_KEY:
    openai_client = OpenAI(
        api_key=DASHSCOPE_API_KEY,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",  # 北京地域
    )

# 初始化 Memori（用于解说记忆）
# 临时禁用 memori 库（打包时 tiktoken 编码问题）
memori = None
# if MEMORI_ENABLED:
#     try:
#         memori = Memori(
#             database_connect=MEMORI_DATABASE,
#             conscious_ingest=True,  # 短期工作记忆
#             auto_ingest=True,       # 动态搜索
#             namespace=MEMORI_NAMESPACE  # 使用固定命名空间，实现跨游戏局记忆
#         )
#         memori.enable()
#         print(f"✓ Memori 记忆系统已启用")
#         print(f"  - 命名空间: {MEMORI_NAMESPACE}")
#         print(f"  - 数据库: {MEMORI_DATABASE}")
#         print(f"  - 短期工作记忆: 启用 (conscious_ingest=True)")
#         print(f"  - 自动存储: 启用 (auto_ingest=True)")
#         print(f"  - 跨游戏局记忆: 是（使用固定命名空间）")
#     except Exception as e:
#         print(f"✗ Memori 记忆系统初始化失败: {e}")
#         import traceback
#         print(traceback.format_exc())
#         memori = None
#         MEMORI_ENABLED = False
# else:
#     print("ℹ️ Memori 记忆系统未启用（MEMORI_ENABLED=false）")

# 临时禁用 memori 库（打包时 tiktoken 编码问题）
# 由于 memori 已被禁用，显示提示信息
print("ℹ️ Memori 记忆系统已临时禁用（打包时 tiktoken 编码问题）")

# 初始化 FastAPI 应用
app = FastAPI(
    title="Game Server",
    description="游戏服务器 - 静态文件托管和 TTS 服务",
    version="1.0.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加异常处理器，用于处理流式响应中的错误
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """全局异常处理器"""
    import traceback
    error_msg = str(exc) if exc else "未知错误"
    print(f"全局异常捕获: {error_msg}")
    print(traceback.format_exc())
    
    # 如果是HTTPException，直接抛出
    from fastapi import HTTPException as FastAPIHTTPException
    if isinstance(exc, FastAPIHTTPException):
        raise exc
    
    # 其他异常转换为500错误
    return Response(
        content=f'{{"detail": "服务器内部错误: {error_msg}"}}',
        status_code=500,
        media_type="application/json"
    )

# 初始化 DashScope
synthesizer = None
if DASHSCOPE_API_KEY:
    try:
        dashscope.api_key = DASHSCOPE_API_KEY
        synthesizer = SpeechSynthesizer(
            model=COSYVOICE_MODEL,
            voice=COSYVOICE_VOICE
        )
        print(f"✓ CosyVoice (DashScope) 初始化成功: model={COSYVOICE_MODEL}, voice={COSYVOICE_VOICE}")
    except Exception as e:
        print(f"✗ CosyVoice 初始化失败: {e}")
        synthesizer = None
else:
    print("警告: 未设置 DASHSCOPE_API_KEY 环境变量，TTS 和文本生成功能将不可用")


# TTS 请求模型
class TTSRequest(BaseModel):
    text: str  # JS 端只上报纯文本，所有 TTS 参数统一在 Python 端配置


# 解说员文本生成请求模型
class CommentaryRequest(BaseModel):
    events: list  # 最近的事件列表
    game_state: Optional[dict] = None  # 游戏状态
    model: Optional[str] = "qwen-plus"
    max_tokens: Optional[int] = 50
    temperature: Optional[float] = 0.9


# 健康检查
@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "ok",
        "dashscope_configured": bool(DASHSCOPE_API_KEY),
        "tts_initialized": synthesizer is not None,
        "static_files_dir": str(DIST_DIR),
        "static_files_exists": DIST_DIR.exists()
    }


# 记忆系统调试端点
@app.get("/api/memori/debug")
async def memori_debug():
    """记忆系统调试信息端点"""
    debug_info = {
        "memori_enabled": MEMORI_ENABLED,
        "memori_initialized": memori is not None,
        "namespace": MEMORI_NAMESPACE,
        "database": MEMORI_DATABASE,
        "conscious_ingest": True if memori else False,
        "auto_ingest": True if memori else False,
    }
    
    if memori:
        try:
            # 尝试获取更多信息
            debug_info["status"] = "active"
            # 检查memori对象是否有可用方法
            if hasattr(memori, 'enabled'):
                debug_info["memori_enabled_flag"] = memori.enabled
            if hasattr(memori, 'namespace'):
                debug_info["actual_namespace"] = memori.namespace
        except Exception as e:
            debug_info["status"] = "error"
            debug_info["error"] = str(e)
    else:
        debug_info["status"] = "disabled"
    
    return debug_info


# TTS 服务端点（流式处理）
@app.post("/api/tts")
async def text_to_speech(request: TTSRequest):
    """
    文本转语音服务（流式处理）
    使用 CosyVoice Python SDK 将文本转换为语音，流式返回音频数据
    """
    if not synthesizer:
        raise HTTPException(
            status_code=503,
            detail="TTS 服务不可用。请检查 CosyVoice SDK 是否已安装并配置了 API Key。"
        )
    
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="文本内容不能为空")
    
    # 验证文本长度（CosyVoice通常限制在500字以内）
    text_length = len(request.text.strip())
    MAX_TEXT_LENGTH = 500
    if text_length > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400, 
            detail=f"文本长度超过限制：{text_length}字（最大{MAX_TEXT_LENGTH}字）。请缩短文本长度。"
        )
    
    # 用于存储检测到的音频格式（在generator外部定义，以便在StreamingResponse中使用）
    detected_audio_format = {"format": "audio/mpeg"}  # 使用字典以便在内部函数中修改
    
    async def generate_audio_stream():
        """
        生成 TTS 音频的异步生成器（单层 try/except，逻辑尽量简单清晰）
        """
        request_synthesizer = None
        
        try:
            # 基础检查
            if not DASHSCOPE_API_KEY:
                raise Exception("DashScope API Key 未配置")
            
            # 为当前请求创建新的 synthesizer 实例
            # 约定：所有 TTS 参数（model、voice 等）只在 Python 端维护，
            #       前端只负责上传文本内容。
            request_synthesizer = SpeechSynthesizer(
                model=COSYVOICE_MODEL,
                voice=COSYVOICE_VOICE,
                speech_rate=COSYVOICE_SPEECH_RATE,  # 设置语速（1.0为正常语速）
            )
            
            # 使用纯文本（SSML 不支持流式调用）
            tts_text = request.text.strip()
            
            # 调用 TTS 接口（当前模型返回 bytes 音频数据）
            result = request_synthesizer.call(text=tts_text)
            print(f"[TTS调试] call() 返回值类型: {type(result)}")

            if result is None:
                raise Exception("TTS API 返回 None，未返回任何音频数据")

            if not isinstance(result, (bytes, bytearray)):
                raise Exception(f"TTS API 返回格式异常：期望 bytes，实际为 {type(result)}")

            # 直接将字节数据分块写入响应
            audio_bytes = bytes(result)
            chunk_size = 8192
            for i in range(0, len(audio_bytes), chunk_size):
                chunk = audio_bytes[i:i + chunk_size]
                if chunk:
                    yield chunk
            return
                    
        except httpx.HTTPError as http_error:
            import traceback

            error_msg = f"HTTP请求失败: {str(http_error)}"
            print(f"TTS 转换错误: {error_msg}")
            print(traceback.format_exc())
            raise Exception(error_msg)
        except Exception as e:
            import traceback

            error_msg = str(e) if e else "未知错误"
            print(f"TTS 转换错误: {error_msg}")
            print(traceback.format_exc())
            # 继续抛出，让上层 StreamingResponse 处理
            raise
        finally:
            # 显式清理 synthesizer 引用，帮助释放底层资源
            if request_synthesizer is not None:
                del request_synthesizer
    
    # 返回流式音频响应
    # 注意：StreamingResponse会在实际读取generator时才执行，所以这里的try-except
    # 只能捕获创建StreamingResponse对象时的错误，不能捕获generator内部的错误
    # generator内部的错误会在客户端读取流时发生，FastAPI会自动处理
    # 注意：由于generator是异步执行的，audio_format可能在generator执行后才确定
    # 所以这里使用默认值，实际格式会在响应头中动态设置（如果可能）
    return StreamingResponse(
        generate_audio_stream(),
        media_type=detected_audio_format["format"],  # 使用检测到的格式，默认为audio/mpeg
        headers={
            "Content-Disposition": "inline; filename=tts_audio.mp3",
            "Cache-Control": "no-cache",
            "Transfer-Encoding": "chunked",
            "X-Accel-Buffering": "no"  # 禁用Nginx缓冲，确保真正的流式传输
        }
    )


# 解说员文本生成端点
@app.post("/api/commentary")
async def generate_commentary(request: CommentaryRequest):
    """
    生成游戏解说文本
    使用 Qwen (DashScope) API 生成游戏解说
    """
    if not DASHSCOPE_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="文本生成服务不可用。请配置 DASHSCOPE_API_KEY 环境变量。"
        )
    
    if not request.events or len(request.events) == 0:
        raise HTTPException(status_code=400, detail="事件列表不能为空")
    
    response = None  # 提前声明，避免在异常场景下出现 UnboundLocalError

    try:
        # 构建系统提示词
        system_prompt = """你是电竞赛事解说员，解说Git卡牌对战。

【游戏规则】生命100，能量每回合+1(最多10)，手牌最多7张。卡牌：攻击型(Add/Commit/Push/Merge/Clone)、治疗型(Pull/Revert)、特殊型(Rebase/Reset/Branch/Stash/Cherry Pick)。

【输出要求】
- 输出15-30字短句
- 用中文，口语化，有情绪

你可以自由选择任何话题和角度进行解说，不受限制。"""
        
        # 构建用户提示词（完整上下文）
        # 使用所有事件，不限制数量
        user_prompt = '【事件】'
        for event in request.events:
            event_text = event_to_text(event)
            if event_text:
                user_prompt += f" {event_text};"
        
        if request.game_state:
            summary = get_game_state_summary(request.game_state)
            user_prompt += f"\n【战况】玩家{summary['playerHealth']}HP 对手{summary['opponentHealth']}HP 第{summary['turnNumber']}回合"
            
            # 关键状态
            critical = []
            if summary['playerHealth'] <= 30:
                critical.append('玩家血量告急')
            if summary['opponentHealth'] <= 30:
                critical.append('对手血量告急')
            if summary.get('playerBuffs'):
                buff_names = [b.get('name', '') for b in summary['playerBuffs']]
                if buff_names:
                    critical.append(f"玩家有buff:{','.join(buff_names)}")
            if summary.get('opponentBuffs'):
                buff_names = [b.get('name', '') for b in summary['opponentBuffs']]
                if buff_names:
                    critical.append(f"对手有buff:{','.join(buff_names)}")
            if critical:
                user_prompt += f" {' '.join(critical)}"
            
            # 手牌信息（完整信息，包括卡牌类型、消耗、效果等）
            player_hand = summary.get('playerHand', [])
            opponent_hand = summary.get('opponentHand', [])
            
            if player_hand:
                hand_cards = []
                for c in player_hand:
                    card_info = f"{c.get('icon', '')}{c.get('name', '')}"
                    card_type = c.get('type', '')
                    cost = c.get('cost', 0)
                    power = c.get('power', 0)
                    heal = c.get('heal', 0)
                    draw = c.get('draw', 0)
                    effects = []
                    if card_type:
                        effects.append(f"类型:{card_type}")
                    if cost > 0:
                        effects.append(f"消耗:{cost}")
                    if power > 0:
                        effects.append(f"伤害{power}")
                    if heal > 0:
                        effects.append(f"治疗{heal}")
                    if draw > 0:
                        effects.append(f"抽{draw}张")
                    if effects:
                        card_info += f"({','.join(effects)})"
                    hand_cards.append(card_info)
                user_prompt += f"\n【玩家手牌】{','.join(hand_cards)}"
            
            if opponent_hand:
                hand_cards = []
                for c in opponent_hand:
                    card_info = f"{c.get('icon', '')}{c.get('name', '')}"
                    card_type = c.get('type', '')
                    cost = c.get('cost', 0)
                    power = c.get('power', 0)
                    heal = c.get('heal', 0)
                    draw = c.get('draw', 0)
                    effects = []
                    if card_type:
                        effects.append(f"类型:{card_type}")
                    if cost > 0:
                        effects.append(f"消耗:{cost}")
                    if power > 0:
                        effects.append(f"伤害{power}")
                    if heal > 0:
                        effects.append(f"治疗{heal}")
                    if draw > 0:
                        effects.append(f"抽{draw}张")
                    if effects:
                        card_info += f"({','.join(effects)})"
                    hand_cards.append(card_info)
                user_prompt += f"\n【对手手牌】{','.join(hand_cards)}"
        
        user_prompt += '\n【输出】15-30字短句。'
        
        # 确保 API Key 已设置
        if not DASHSCOPE_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="文本生成服务不可用: 未配置 DASHSCOPE_API_KEY"
            )
        
        # 构建消息列表
        messages = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ]
        
        # 使用 OpenAI 兼容接口调用 DashScope（Memori 会自动拦截 OpenAI 客户端调用）
        if not openai_client:
            raise HTTPException(
                status_code=503,
                detail="文本生成服务不可用: 未配置 DASHSCOPE_API_KEY"
            )
        
        # 记忆系统调试信息
        if MEMORI_ENABLED and memori:
            print(f"\n{'='*60}")
            print(f"[记忆系统调试] 开始生成解说")
            print(f"{'='*60}")
            print(f"[记忆系统] 状态: 已启用")
            print(f"[记忆系统] 命名空间: {MEMORI_NAMESPACE}")
            print(f"[记忆系统] 数据库: {MEMORI_DATABASE}")
            
            # 尝试获取当前记忆统计信息
            try:
                # 检查记忆系统是否有检索功能
                if hasattr(memori, 'search') or hasattr(memori, 'get_memories'):
                    print(f"[记忆系统] 记忆检索功能: 可用")
                else:
                    print(f"[记忆系统] 记忆检索功能: 通过自动拦截实现")
            except Exception as e:
                print(f"[记忆系统] 获取统计信息时出错: {e}")
            
            # 记录调用前的消息
            print(f"[记忆系统] 调用前消息数量: {len(messages)}")
            print(f"[记忆系统] 系统提示词长度: {len(system_prompt)} 字符")
            print(f"[记忆系统] 用户提示词长度: {len(user_prompt)} 字符")
            print(f"[记忆系统] 事件数量: {len(request.events)}")
        else:
            print(f"[记忆系统调试] 记忆系统未启用")
        
        # 使用 OpenAI 客户端调用（Memori 会自动拦截并注入记忆）
        try:
            completion = openai_client.chat.completions.create(
                model=request.model or "qwen-plus",
                messages=messages,
                max_tokens=request.max_tokens or 50,
                temperature=request.temperature or 0.9
            )
            
            # 记录调用后的信息
            if MEMORI_ENABLED and memori:
                print(f"[记忆系统] API调用成功")
                # 检查是否有额外的消息被注入（Memori可能会在messages中添加记忆）
                if hasattr(completion, 'usage'):
                    usage = completion.usage
                    print(f"[记忆系统] Token使用情况:")
                    if hasattr(usage, 'prompt_tokens'):
                        print(f"  - 提示词Token: {usage.prompt_tokens}")
                    if hasattr(usage, 'completion_tokens'):
                        print(f"  - 生成Token: {usage.completion_tokens}")
                    if hasattr(usage, 'total_tokens'):
                        print(f"  - 总Token: {usage.total_tokens}")
        except Exception as e:
            if MEMORI_ENABLED and memori:
                print(f"[记忆系统] API调用失败: {e}")
            raise
        
        # 从响应中提取文本
        if hasattr(completion, 'choices') and len(completion.choices) > 0:
            commentary = completion.choices[0].message.content
        else:
            raise HTTPException(
                status_code=500,
                detail="文本生成失败: API 响应格式异常"
            )
        
        commentary = str(commentary).strip()
        if not commentary:
            raise HTTPException(
                status_code=500,
                detail="文本生成失败: 生成的解说文本为空"
            )
        
        # 记忆系统调试信息 - 调用后
        if MEMORI_ENABLED and memori:
            print(f"[记忆系统] 生成的解说文本: {commentary}")
            print(f"[记忆系统] 解说文本长度: {len(commentary)} 字符")
            
            # 尝试获取记忆系统状态
            try:
                # Memori会在调用后自动存储记忆，这里记录状态
                print(f"[记忆系统] 记忆已自动存储（如果启用auto_ingest）")
            except Exception as e:
                print(f"[记忆系统] 获取记忆状态时出错: {e}")
            
            print(f"{'='*60}")
            print(f"[记忆系统调试] 解说生成完成")
            print(f"{'='*60}\n")
        
        return {
            "commentary": commentary,  # 纯文本，用于UI显示和TTS
            "status": "success"
        }
            
    except Exception as e:
        import traceback
        print(f"文本生成错误: {e}")
        if MEMORI_ENABLED and memori:
            print(f"[记忆系统调试] 错误发生在记忆系统调用过程中")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"文本生成失败: {str(e)}")


# 辅助函数：将事件转换为文本
def event_to_text(event):
    """将事件转换为文本描述"""
    event_type = event.get('type', '')
    data = event.get('data', {})
    
    if event_type == 'game_start':
        return '游戏开始！'
    elif event_type == 'card_played':
        player = '玩家' if data.get('player') == 'player' else '对手'
        card = data.get('card', {})
        card_name = card.get('name', '未知卡牌')
        card_icon = card.get('icon', '')
        return f"{player}使用了{card_icon} {card_name}"
    elif event_type == 'damage_dealt':
        target = '玩家' if data.get('target') == 'player' else '对手'
        amount = data.get('amount', 0)
        return f"{target}受到了{amount}点伤害"
    elif event_type == 'heal':
        target = '玩家' if data.get('target') == 'player' else '对手'
        amount = data.get('amount', 0)
        return f"{target}恢复了{amount}点生命值"
    elif event_type == 'turn_start':
        player = '玩家' if data.get('player') == 'player' else '对手'
        return f"{player}的回合开始"
    elif event_type == 'turn_end':
        player = '玩家' if data.get('player') == 'player' else '对手'
        return f"{player}的回合结束"
    elif event_type == 'game_over':
        winner = '玩家' if data.get('winner') == 'player' else '对手'
        return f"游戏结束！{winner}获胜"
    else:
        return ''


# 辅助函数：获取游戏状态摘要
def get_game_state_summary(game_state):
    """获取游戏状态摘要（完整上下文）"""
    player = game_state.get('player', {})
    opponent = game_state.get('opponent', {})
    
    result = {
        'playerHealth': player.get('health', 100),
        'playerMaxHealth': player.get('maxHealth', 100),
        'playerMana': player.get('mana', 0),
        'playerMaxMana': player.get('maxMana', 0),
        'opponentHealth': opponent.get('health', 100),
        'opponentMaxHealth': opponent.get('maxHealth', 100),
        'opponentMana': opponent.get('mana', 0),
        'opponentMaxMana': opponent.get('maxMana', 0),
        'turn': game_state.get('turn', 'player'),
        'turnNumber': game_state.get('turnNumber', 1)
    }
    
    # 添加手牌信息（完整信息，如果存在）
    if 'playerHand' in game_state:
        result['playerHand'] = game_state.get('playerHand', [])
    if 'opponentHand' in game_state:
        result['opponentHand'] = game_state.get('opponentHand', [])
    
    # 添加buff信息（如果存在）
    if 'buffs' in player:
        result['playerBuffs'] = player.get('buffs', [])
    if 'buffs' in opponent:
        result['opponentBuffs'] = opponent.get('buffs', [])
    
    return result


# 托管静态文件（游戏打包后的文件）
if DIST_DIR.exists():
    # 挂载静态文件目录
    app.mount("/", StaticFiles(directory=str(DIST_DIR), html=True), name="static")
    print(f"✓ 静态文件目录已挂载: {DIST_DIR}")
else:
    print(f"⚠ 警告: 静态文件目录不存在: {DIST_DIR}")
    print("   请先运行 'npm run build' 构建游戏")
    
    @app.get("/")
    async def root():
        return {
            "message": "游戏文件未找到",
            "hint": "请先运行 'npm run build' 构建游戏",
            "dist_dir": str(DIST_DIR)
        }


if __name__ == "__main__":
    import uvicorn
    
    # 从环境变量读取配置
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "18000"))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    print(f"\n{'='*50}")
    print(f"🚀 游戏服务器启动中...")
    print(f"{'='*50}")
    print(f"📁 静态文件目录: {DIST_DIR}")
    print(f"🌐 服务器地址: http://{host}:{port}")
    print(f"📊 健康检查: http://{host}:{port}/health")
    print(f"🎤 TTS 服务: http://{host}:{port}/api/tts")
    print(f"💬 解说生成: http://{host}:{port}/api/commentary")
    if MEMORI_ENABLED and memori:
        print(f"🧠 记忆系统调试: http://{host}:{port}/api/memori/debug")
    print(f"🔧 调试模式: {'开启' if debug else '关闭'}")
    print(f"{'='*50}\n")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug
    )

