# Git竞技场 ⚔️

一个基于Git操作的卡牌对战游戏！将各种Git命令转化为技能卡牌，在竞技场中与对手一较高下。

## 🎮 游戏介绍

Git竞技场是一款创新的卡牌对战游戏，将开发者熟悉的Git操作转化为游戏中的技能卡牌。每张卡牌代表一个Git命令，具有独特的战斗效果。

## 🎯 游戏特色

- **12种Git操作卡牌**：Commit、Push、Pull、Merge、Rebase、Reset、Branch、Stash、Cherry Pick、Revert、Fetch、Clone
- **回合制对战**：策略性地使用卡牌，管理能量资源
- **多样化卡牌类型**：
  - 🗡️ **攻击型**：造成伤害（Commit、Push、Merge、Clone等）
  - 💚 **治疗型**：恢复生命值（Pull、Revert）
  - ⭐ **特殊型**：复合效果（Rebase、Reset、Branch、Stash、Cherry Pick、Fetch）
- **现代化UI**：渐变背景、流畅动画、响应式设计
- **智能AI对手**：与AI对手进行对战

## 🚀 快速开始

1. 克隆或下载此仓库
2. 直接在浏览器中打开 `index.html` 文件
3. 点击"开始游戏"按钮
4. 享受游戏！

## 📋 卡牌说明

### 攻击型卡牌
- **Commit** (💾) - 消耗1能量，造成10点伤害
- **Push** (⬆️) - 消耗2能量，造成20点伤害
- **Merge** (🔀) - 消耗3能量，造成30点伤害
- **Clone** (📋) - 消耗4能量，造成35点巨大伤害

### 治疗型卡牌
- **Pull** (⬇️) - 消耗2能量，恢复15点生命值
- **Revert** (↩️) - 消耗3能量，恢复25点生命值

### 特殊型卡牌
- **Rebase** (🔄) - 消耗3能量，造成25点伤害并抽一张牌
- **Reset** (⏪) - 消耗2能量，移除对手一张手牌
- **Branch** (🌿) - 消耗1能量，抽两张牌
- **Stash** (📦) - 消耗1能量，抽一张牌
- **Cherry Pick** (🍒) - 消耗2能量，造成15点伤害并抽一张牌
- **Fetch** (📥) - 消耗1能量，抽一张牌

## 🎯 游戏规则

1. **生命值**：双方初始生命值为100点
2. **能量系统**：每回合开始时恢复能量，最多10点
3. **手牌限制**：最多持有7张手牌
4. **回合流程**：
   - 玩家回合：出牌 → 结束回合
   - 对手回合：AI自动出牌
5. **胜利条件**：将对手生命值降至0

## 🛠️ 技术栈

- HTML5
- CSS3 (渐变、动画、响应式设计)
- 原生JavaScript (ES6+)

## 📝 文件结构

```
GameJamGStar2025/
├── index.html              # 主页面
├── css/                    # CSS样式模块（组合式设计）
│   ├── base/              # 基础样式
│   ├── layout/            # 布局样式
│   ├── components/        # 组件样式
│   ├── animations/        # 动画定义
│   └── responsive/        # 响应式设计
├── core/                   # 核心数据模型
│   ├── Card.js            # 卡牌类
│   ├── Player.js          # 玩家类
│   └── GameState.js       # 游戏状态
├── data/                   # 数据层
│   ├── CardData.js        # 卡牌数据
│   └── CardFactory.js     # 卡牌工厂
├── gameplay/               # 游戏逻辑
│   ├── CardEffect.js      # 卡牌效果
│   ├── TurnManager.js     # 回合管理
│   └── AI.js              # AI逻辑
├── ui/                     # UI组件
│   ├── CardRenderer.js    # 卡牌渲染
│   ├── DisplayManager.js  # 显示管理
│   ├── HealthBar.js       # 血量条
│   ├── ManaDisplay.js     # 能量显示
│   └── LogSystem.js       # 日志系统
├── animation/              # 动画系统
│   ├── AnimationSystem.js  # 动画框架
│   └── CardAnimation.js   # 卡牌动画
├── interaction/            # 交互系统
│   └── DragDrop.js        # 拖拽交互
├── game/                   # 游戏主类
│   └── Game.js            # 游戏核心逻辑
└── README.md               # 说明文档
```

## 🎨 游戏截图

游戏采用现代化的渐变设计，包含：
- 紫色渐变背景
- 流畅的卡牌动画效果
- 实时战斗日志
- 生命值和能量显示

## 🔮 未来计划

- [ ] 添加更多Git操作卡牌
- [ ] 实现多人对战模式
- [ ] 添加卡牌收集系统
- [ ] 增加成就系统
- [ ] 优化AI难度等级
- [ ] 添加音效和背景音乐

## 📄 许可证

查看 LICENSE 文件了解详情。

---

**享受游戏，用Git操作征服对手！** 🎮⚔️