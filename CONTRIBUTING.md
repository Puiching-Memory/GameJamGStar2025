# 贡献指南

欢迎为Git竞技场项目做出贡献！

## 开发环境设置

1. 克隆仓库
2. 安装依赖：`npm install`
3. 启动开发服务器：`npm run dev`

## 代码规范

- 使用ES13语法
- 遵循组合模式设计原则
- 保持模块之间的低耦合
- 使用ES模块（import/export）

## 添加新功能

### 添加新卡牌

1. 在 `src/data/CardData.js` 中添加卡牌数据
2. 在 `src/data/CardFactory.js` 中添加卡牌效果逻辑

### 添加新音效

1. 将音频文件放入 `assets/audio/` 目录
2. 在 `src/systems/audio/SoundEffects.js` 中添加音效定义
3. 在 `src/systems/audio/AudioSystem.js` 中更新文件映射

### 扩展AI解说员

1. 在 `src/systems/commentator/CommentatorEvents.js` 中添加新事件类型
2. 在游戏逻辑中记录相应事件

## 提交代码

请确保：
- 代码通过lint检查
- 所有功能正常工作
- 更新相关文档

