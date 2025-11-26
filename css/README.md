# CSS 架构说明

## 组合式CSS设计

本项目采用组合式设计思想，将CSS样式拆分为多个独立、可复用的模块。每个模块负责特定的功能领域，通过组合的方式构建完整的样式系统。

## 目录结构

```
css/
├── base/                    # 基础样式
│   └── reset.css           # 全局重置和基础设置
│
├── layout/                  # 布局样式
│   ├── container.css       # 游戏容器布局
│   ├── header.css          # 头部布局
│   └── main.css            # 主布局区域
│
├── components/             # 组件样式
│   ├── status-bar.css      # 状态条（血量、能量）
│   ├── card.css            # 卡牌组件
│   ├── hand.css            # 手牌区域
│   ├── drop-zone.css       # 拖拽区域
│   ├── button.css          # 按钮组件
│   ├── modal.css           # 模态框
│   └── log.css             # 日志系统
│
├── animations/             # 动画定义
│   └── keyframes.css       # 所有keyframes动画
│
└── responsive/             # 响应式设计
    └── media-queries.css   # 媒体查询
```

## 模块说明

### 基础模块 (base/)

**reset.css** - 全局重置和基础设置
- CSS重置（margin、padding、box-sizing）
- HTML和body的基础样式
- 全局字体和颜色设置

### 布局模块 (layout/)

**container.css** - 游戏容器布局
- `.game-container` - 游戏主容器

**header.css** - 头部布局
- `.game-header` - 游戏头部
- `.header-title` - 标题区域
- `.header-player-info` - 玩家信息区域
- `.stats-container` - 状态容器

**main.css** - 主布局区域
- `.main-layout` - 主布局
- `.center-panel` - 中央面板
- `.center-controls` - 控制按钮区域
- `.player-hand-container` - 玩家手牌容器

### 组件模块 (components/)

**status-bar.css** - 状态条组件
- `.health-bar` - 血量条
- `.mana-bar` - 能量条

**card.css** - 卡牌组件
- `.card` - 卡牌基础样式
- `.card-header` - 卡牌标题
- `.card-icon` - 卡牌图标
- `.card-cost` - 卡牌消耗
- `.card-power` - 攻击力显示
- `.card-heal` - 治疗显示
- `.card-draw` - 抽卡显示

**hand.css** - 手牌区域
- `#player-hand` - 玩家手牌
- `#opponent-hand` - 对手手牌
- 手牌交互效果

**drop-zone.css** - 拖拽区域
- `.drop-zone` - 拖拽区域
- `.played-cards-container` - 已打出卡牌容器
- `.played-card-in-zone` - 已打出卡牌样式

**button.css** - 按钮组件
- `.btn` - 按钮基础样式
- `.btn-primary` - 主要按钮
- `.btn-secondary` - 次要按钮

**modal.css** - 模态框
- `.modal` - 模态框容器
- `.modal-content` - 模态框内容

**log.css** - 日志系统
- `.danmaku-container` - 弹幕容器
- `.danmaku-item` - 弹幕条目

### 动画模块 (animations/)

**keyframes.css** - 动画定义
- `@keyframes messagePopUp` - 消息弹出动画
- `@keyframes fadeIn` - 淡入动画
- `@keyframes damage` - 伤害动画
- `@keyframes cardPlayedInZone` - 卡牌出现动画
- `@keyframes cardPlayed` - 卡牌打出动画
- `@keyframes lastCardPulse` - 最后一张卡牌脉冲动画

### 响应式模块 (responsive/)

**media-queries.css** - 响应式设计
- `@media (max-width: 1200px)` - 移动端适配

## 使用方式

所有CSS模块通过HTML按顺序引入：

```html
<!-- 基础样式 -->
<link rel="stylesheet" href="css/base/reset.css">

<!-- 布局样式 -->
<link rel="stylesheet" href="css/layout/container.css">
<link rel="stylesheet" href="css/layout/header.css">
<link rel="stylesheet" href="css/layout/main.css">

<!-- 组件样式 -->
<link rel="stylesheet" href="css/components/status-bar.css">
<link rel="stylesheet" href="css/components/card.css">
<!-- ... 其他组件 ... -->

<!-- 动画样式 -->
<link rel="stylesheet" href="css/animations/keyframes.css">

<!-- 响应式样式 -->
<link rel="stylesheet" href="css/responsive/media-queries.css">
```

## 组合模式的优势

1. **模块化**：每个CSS文件职责单一，易于理解和维护
2. **可复用**：组件样式可以在不同场景下复用
3. **可维护**：修改某个组件不会影响其他模块
4. **可扩展**：添加新样式只需添加新模块，不影响现有代码
5. **松耦合**：模块之间通过类名交互，降低耦合度

## 扩展指南

### 添加新组件样式
1. 在 `css/components/` 目录下创建新组件CSS文件
2. 在HTML中引入新CSS文件

### 添加新动画
1. 在 `css/animations/keyframes.css` 中添加新的 `@keyframes` 定义
2. 在相应的组件CSS中使用新动画

### 添加新的响应式断点
1. 在 `css/responsive/media-queries.css` 中添加新的 `@media` 查询

