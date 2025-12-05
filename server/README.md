# 游戏服务器

基于 FastAPI 的 HTTP 服务器，提供：
- 游戏静态文件托管（dist 目录）
- CosyVoice TTS 服务
- Qwen 文本生成服务（游戏解说）

## 安装

本项目使用 [uv](https://github.com/astral-sh/uv) 管理 Python 依赖。uv 是一个快速的 Python 包管理器和项目管理工具。

1. **安装 uv**：
   ```bash
   # macOS/Linux
   curl -LsSf https://astral.sh/uv/install.sh | sh
   
   # Windows
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
   
   # 或使用 pip
   pip install uv
   ```

2. **安装依赖**：
   ```bash
   cd server
   uv sync
   ```
   这会自动创建虚拟环境并安装所有依赖。

3. **配置环境变量**：
   ```bash
   # 复制示例配置文件
   cp env.example .env
   
   # 编辑 .env 文件，填入你的 DashScope API Key
   # DASHSCOPE_API_KEY=your_api_key_here
   ```

## 运行

### 开发模式

```bash
cd server
uv run python run.py
```

或使用启动脚本：
```bash
# Linux/Mac
./start.sh

# Windows
start.bat
```

### 生产模式（使用 uvicorn）

```bash
cd server
uv run uvicorn main:app --host 0.0.0.0 --port 18000
```

### 使用 Gunicorn（推荐生产环境）

```bash
cd server
uv add gunicorn
uv run gunicorn -k uvicorn.workers.UvicornWorker -w 4 -b 0.0.0.0:18000 main:app
```

## API 端点

### 健康检查
```
GET /health
```

### TTS 服务
```
POST /api/tts
Content-Type: application/json

{
  "text": "要转换的文本",
  "voice": "longxiaochun_v2",  // 可选
  "language_type": "Chinese"    // 可选
}
```

或使用 GET 方式：
```
GET /api/tts?text=要转换的文本&voice=longxiaochun_v2
```

### 解说员文本生成服务
```
POST /api/commentary
Content-Type: application/json

{
  "events": [
    {
      "type": "card_played",
      "data": {
        "player": "player",
        "card": {
          "name": "Push",
          "icon": "⬆️"
        }
      },
      "timestamp": 1234567890
    }
  ],
  "game_state": {
    "player": {
      "health": 80,
      "mana": 5
    },
    "opponent": {
      "health": 60,
      "mana": 3
    },
    "turn": "player",
    "turnNumber": 3
  },
  "model": "qwen-plus",        // 可选，默认 qwen-plus
  "max_tokens": 50,            // 可选，默认 50
  "temperature": 0.9           // 可选，默认 0.9
}
```

响应：
```json
{
  "commentary": "漂亮！玩家一记Push打出10点伤害！",
  "status": "success"
}
```

## 环境变量

- `DASHSCOPE_API_KEY`: DashScope API Key（必需，用于 CosyVoice TTS）
- `COSYVOICE_MODEL`: CosyVoice 模型名称（默认: cosyvoice-v2）
- `COSYVOICE_VOICE`: 语音类型（默认: longxiaochun_v2）
- `HOST`: 服务器监听地址（默认: 0.0.0.0）
- `PORT`: 服务器端口（默认: 18000）
- `DEBUG`: 是否启用调试模式（默认: false）

**注意**: 也可以使用 `COSYVOICE_API_KEY` 作为环境变量名（向后兼容）

## 注意事项

1. 在运行服务器之前，请先构建游戏：
   ```bash
   npm run build
   ```

2. 静态文件将从 `dist/` 目录提供

3. 如果 DashScope SDK 未安装或未配置 API Key，TTS 和文本生成服务将不可用，但静态文件服务仍可正常工作

4. CosyVoice 和 Qwen 都通过 DashScope API 提供，使用同一个 DASHSCOPE_API_KEY

5. 前端会自动优先使用后端服务，如果后端不可用会自动回退到直接调用 DashScope API

## 依赖管理

本项目使用 `uv` 管理 Python 依赖。主要文件：

- `pyproject.toml` - 项目配置和依赖定义
- `uv.lock` - 锁定的依赖版本（自动生成，建议提交到版本控制）

### 常用 uv 命令

```bash
# 安装依赖
uv sync

# 添加新依赖
uv add package-name

# 添加开发依赖
uv add --dev package-name

# 移除依赖
uv remove package-name

# 运行命令
uv run python run.py
uv run uvicorn main:app --host 0.0.0.0 --port 8000

# 更新依赖
uv sync --upgrade

# 查看依赖树
uv tree
```

## 打包为 Windows exe

使用 PyInstaller 将服务器打包为独立的 exe 文件：

### 方法一：使用打包脚本（推荐）

```bash
cd server
build_exe.bat
```

打包完成后，exe 文件位于 `dist/server/server.exe`，所有依赖文件在 `dist/server/_internal/` 目录中。

### 方法二：手动打包

1. **安装 PyInstaller**：
   ```bash
   pip install pyinstaller
   ```

2. **执行打包**：
   ```bash
   cd server
   pyinstaller server.spec
   ```

### 打包后的使用

1. **配置文件**：
   - 将 `env.example` 复制为 `.env`（与 exe 同目录）
   - 或设置环境变量 `DASHSCOPE_API_KEY`

2. **静态文件**：
   - 如果打包时 `dist` 目录存在，静态文件已包含在 `dist/server/dist/` 目录中
   - 否则需要将游戏构建后的 `dist` 目录放在 `dist/server/` 目录下

3. **运行**：
   ```bash
   dist\server\server.exe
   ```

### 打包配置说明

- `server.spec`：PyInstaller 配置文件
- 打包模式：目录模式（one-folder）
  - exe 文件位于 `dist/server/server.exe`
  - 所有依赖库位于 `dist/server/_internal/` 目录
  - 数据文件位于 `dist/server/` 目录
- 打包时会自动包含：
  - 所有 Python 依赖
  - `.env` 示例文件
  - `dist` 目录（如果存在）
- 目录模式的优点：
  - 启动速度更快
  - 文件结构清晰
  - 便于调试和维护

### 注意事项

1. 首次打包可能需要较长时间（5-10分钟）
2. 打包后的目录包含所有依赖文件，总大小约 50-100MB
3. 分发时需要将整个 `dist/server/` 目录一起分发
4. 如果遇到模块导入错误，可以在 `server.spec` 的 `hiddenimports` 中添加缺失的模块
5. 建议在打包前先测试运行 `python run.py` 确保一切正常