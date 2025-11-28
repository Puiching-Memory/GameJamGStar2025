# Git竞技场 ⚔️

一个基于Git操作的卡牌对战游戏！将各种Git命令转化为技能卡牌，在竞技场中与对手一较高下。

## 🎮 游戏介绍

Git竞技场是一款创新的卡牌对战游戏，将开发者熟悉的Git操作转化为游戏中的技能卡牌。每张卡牌代表一个Git命令，具有独特的战斗效果。

## 🎯 游戏特色

- **30+种Git操作卡牌**：涵盖所有Git原子操作，包括Add、Commit、Push、Pull、Merge、Rebase等
- **回合制对战**：策略性地使用卡牌，管理能量资源
- **多样化卡牌类型**：
  - 🗡️ **攻击型**：造成伤害（Commit、Push、Merge、Clone等）
  - 💚 **治疗型**：恢复生命值（Pull、Revert）
  - ⭐ **特殊型**：复合效果（Rebase、Reset、Branch、Stash、Cherry Pick、Fetch等）
- **现代化UI**：渐变背景、流畅动画、响应式设计
- **智能AI对手**：与AI对手进行对战
- **AI游戏解说员**：使用Qwen（通义千问）生成生动的游戏解说（可选）
- **音效系统**：支持本地音频文件播放，增强游戏体验

## 🚀 快速开始

### 前置要求

- Node.js 16+ 和 npm

### 安装和运行

1. 克隆或下载此仓库
2. 安装依赖：
   ```bash
   npm install
   ```
3. 启动开发服务器：
   ```bash
   npm run dev
   ```
4. 在浏览器中打开显示的地址（通常是 http://localhost:3000）
5. 点击"开始游戏"按钮，享受游戏！

### 构建生产版本

```bash
npm run build
```

构建后的文件将在 `dist/` 目录中。

## 📋 卡牌说明

### 攻击型卡牌
- **Add** (➕) - 消耗1能量，造成4点伤害
- **Commit** (💾) - 消耗1能量，造成5点伤害
- **Push** (⬆️) - 消耗2能量，造成10点伤害
- **Merge** (🔀) - 消耗3能量，造成15点伤害
- **Clone** (📋) - 消耗4能量，造成18点巨大伤害

### 治疗型卡牌
- **Pull** (⬇️) - 消耗2能量，恢复8点生命值
- **Revert** (↩️) - 消耗3能量，恢复12点生命值

### 特殊型卡牌
- **Rebase** (🔄) - 消耗3能量，造成12点伤害并抽一张牌
- **Reset** (⏪) - 消耗2能量，移除对手一张手牌
- **Branch** (🌿) - 消耗1能量，抽两张牌
- **Stash** (📦) - 消耗1能量，抽一张牌
- **Cherry Pick** (🍒) - 消耗2能量，造成8点伤害并抽一张牌
- **Fetch** (📥) - 消耗1能量，抽一张牌

更多卡牌请参考游戏内说明。

## 🎯 游戏规则

1. **生命值**：双方初始生命值为100点
2. **能量系统**：每回合开始时恢复能量，最多10点
3. **手牌限制**：最多持有7张手牌
4. **回合流程**：
   - 玩家回合：出牌 → 结束回合
   - 对手回合：AI自动出牌
5. **胜利条件**：将对手生命值降至0

## 🛠️ 技术栈

- **构建工具**：Vite 5.0
- **JavaScript**：ES13 (ES2022)
- **模块系统**：ES Modules
- **AI集成**：Qwen（通义千问）API（兼容OpenAI SDK）
- **HTML5/CSS3**：现代化UI设计

## 📝 项目结构

```
GameJamGStar2025/
├── package.json              # npm配置和依赖
├── vite.config.js            # Vite构建配置
├── index.html                # 主页面（Vite入口）
├── src/                      # 源代码目录
│   ├── main.js              # 应用入口文件
│   ├── core/                # 核心数据模型
│   │   ├── Player.js        # 玩家类
│   │   ├── Card.js          # 卡牌类
│   │   ├── Buff.js          # Buff类
│   │   ├── GameState.js     # 游戏状态
│   │   ├── GameMessage.js   # 游戏消息
│   │   ├── GameMessageLog.js # 消息日志
│   │   └── GitHistory.js   # Git历史记录
│   ├── data/                # 数据层
│   │   ├── CardData.js      # 卡牌数据定义
│   │   └── CardFactory.js   # 卡牌工厂
│   ├── gameplay/            # 游戏逻辑
│   │   ├── CardEffect.js    # 卡牌效果
│   │   ├── TurnManager.js   # 回合管理
│   │   └── AI.js            # AI逻辑
│   ├── ui/                   # UI组件
│   │   ├── CardRenderer.js  # 卡牌渲染
│   │   ├── DisplayManager.js # 显示管理
│   │   ├── HealthBar.js     # 血量条
│   │   ├── ManaDisplay.js   # 能量显示
│   │   ├── BuffRenderer.js  # Buff渲染
│   │   ├── LogSystem.js     # 日志系统
│   │   ├── Tooltip.js       # 提示系统
│   │   └── GitGraphRenderer.js # Git图表渲染
│   ├── animation/           # 动画系统
│   │   ├── AnimationSystem.js # 动画框架
│   │   └── CardAnimation.js # 卡牌动画
│   ├── interaction/         # 交互系统
│   │   └── DragDrop.js      # 拖拽交互
│   ├── game/                # 游戏主类
│   │   └── Game.js          # 游戏核心逻辑（组合模式）
│   └── systems/             # 系统模块
│       ├── commentator/     # AI解说员系统
│       │   ├── CommentatorSystem.js # 解说员主类
│       │   ├── CommentatorConfig.js  # 配置管理
│       │   └── CommentatorEvents.js  # 事件处理
│       └── audio/           # 音效系统
│           ├── AudioSystem.js    # 音效系统主类
│           ├── AudioManager.js   # 音频资源管理
│           └── SoundEffects.js   # 音效定义
├── assets/                   # 资源文件
│   └── audio/               # 音效文件目录
└── css/                      # CSS样式模块
    ├── base/                # 基础样式
    ├── layout/              # 布局样式
    ├── components/          # 组件样式
    ├── animations/          # 动画定义
    └── responsive/          # 响应式设计
```

## ⚙️ 配置

### AI解说员系统（可选）

AI解说员系统使用Qwen（通义千问）API生成游戏解说，并支持文本转语音（TTS）功能。要启用此功能：

1. 在项目根目录创建 `.env` 文件
2. 添加以下内容：
   ```
   VITE_DASHSCOPE_API_KEY=your_api_key_here
   ```
   获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
   
   **注意**：同一个API Key既用于生成AI解说，也用于文本转语音，无需额外配置。
3. （可选）如果使用新加坡地域的模型，可以设置：
   ```
   VITE_DASHSCOPE_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
   ```
4. 如果没有配置API Key，AI解说员系统会自动禁用
5. 配置API Key后，AI解说会：
   - 以文本形式显示在游戏弹幕中
   - 自动转换为语音并播放（使用qwen3-tts-flash模型）
   
参考文档：https://bailian.console.aliyun.com

### 音效系统

音效系统支持本地音频文件播放。要添加音效：

1. 将音频文件（.mp3格式）放入 `assets/audio/` 目录
2. 在 `src/systems/audio/SoundEffects.js` 中定义音效ID和文件路径映射
3. 音效会在相应的游戏事件中自动播放

## 🎨 设计理念

本项目采用**组合模式**设计，所有系统通过组合的方式整合到主游戏类中：

- **核心模块**：管理游戏状态和数据
- **游戏逻辑模块**：处理游戏规则和AI
- **UI模块**：负责界面渲染和交互
- **动画模块**：处理视觉效果
- **系统模块**：AI解说员和音效等扩展功能

各模块之间通过接口通信，保持低耦合，便于维护和扩展。

## 🔮 未来计划

- [x] 使用npm管理项目依赖
- [x] 升级到ES13模块系统
- [x] 集成AI游戏解说员系统
- [x] 添加音效系统
- [ ] 添加更多Git操作卡牌
- [ ] 实现多人对战模式
- [ ] 添加卡牌收集系统
- [ ] 增加成就系统
- [ ] 优化AI难度等级
- [ ] 添加背景音乐

## 📄 许可证

查看 LICENSE 文件了解详情。

---

**享受游戏，用Git操作征服对手！** 🎮⚔️
