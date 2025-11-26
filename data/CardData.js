/**
 * 卡牌数据定义
 * 包含所有卡牌的基础数据
 */
const CARD_DATA = [
    {
        id: 'commit',
        name: 'Commit',
        icon: '💾',
        cost: 1,
        power: 10,
        description: '提交更改，造成基础伤害',
        type: 'attack'
    },
    {
        id: 'push',
        name: 'Push',
        icon: '⬆️',
        cost: 2,
        power: 20,
        description: '推送代码到远程仓库',
        type: 'attack'
    },
    {
        id: 'pull',
        name: 'Pull',
        icon: '⬇️',
        cost: 2,
        power: 0,
        heal: 15,
        description: '拉取远程代码，恢复生命值',
        type: 'heal'
    },
    {
        id: 'merge',
        name: 'Merge',
        icon: '🔀',
        cost: 3,
        power: 30,
        description: '合并分支，造成大量伤害',
        type: 'attack'
    },
    {
        id: 'rebase',
        name: 'Rebase',
        icon: '🔄',
        cost: 3,
        power: 25,
        draw: 1,
        description: '变基操作，造成伤害并抽一张牌',
        type: 'special'
    },
    {
        id: 'reset',
        name: 'Reset',
        icon: '⏪',
        cost: 2,
        power: 0,
        description: '重置操作，移除对手一张手牌',
        type: 'special'
    },
    {
        id: 'branch',
        name: 'Branch',
        icon: '🌿',
        cost: 1,
        power: 0,
        draw: 2,
        description: '创建分支，抽两张牌',
        type: 'special'
    },
    {
        id: 'stash',
        name: 'Stash',
        icon: '📦',
        cost: 1,
        power: 0,
        draw: 1,
        description: '暂存更改，抽一张牌',
        type: 'special'
    },
    {
        id: 'cherry-pick',
        name: 'Cherry Pick',
        icon: '🍒',
        cost: 2,
        power: 15,
        draw: 1,
        description: '精选提交，造成伤害并抽牌',
        type: 'special'
    },
    {
        id: 'revert',
        name: 'Revert',
        icon: '↩️',
        cost: 3,
        power: 0,
        heal: 25,
        description: '撤销操作，恢复大量生命值',
        type: 'heal'
    },
    {
        id: 'fetch',
        name: 'Fetch',
        icon: '📥',
        cost: 1,
        power: 0,
        draw: 1,
        description: '获取远程更新，抽一张牌',
        type: 'special'
    },
    {
        id: 'clone',
        name: 'Clone',
        icon: '📋',
        cost: 4,
        power: 35,
        description: '克隆仓库，造成巨大伤害',
        type: 'attack'
    }
];

