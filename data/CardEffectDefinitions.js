/**
 * 卡牌效果定义映射
 * 将卡牌ID映射到效果配置
 * 重新设计：更具策略性和趣味性
 */
const CARD_EFFECT_DEFINITIONS = {
    // ========== 基础操作 ==========
    'add': {
        type: 'damage',
        config: { damage: 5 }
    },
    'commit': {
        type: 'damage',
        config: { damage: 6 }
    },
    'push': {
        type: 'damage',
        config: { damage: 12 }
    },
    'pull': {
        type: 'heal',
        config: { heal: 10 }
    },
    'fetch': {
        type: 'draw',
        config: { count: 1 }
    },
    'clone': {
        type: 'composite',
        config: {
            effects: [
                { type: 'damage', config: { damage: 20 }, priority: 1 },
                { type: 'manaDrain', config: { amount: 2 }, priority: 0 }
            ]
        }
    },

    // ========== 分支操作 ==========
    'branch': {
        type: 'draw',
        config: { count: 2 }
    },
    'checkout': {
        type: 'damageAndDraw',
        config: { damage: 8, draw: 1 }
    },
    'merge': {
        type: 'damage',
        config: { damage: 16 }
    },
    'rebase': {
        type: 'damageAndDraw',
        config: { damage: 10, draw: 1 }
    },

    // ========== 历史操作 ==========
    'log': {
        type: 'draw',
        config: { count: 1 }
    },
    'show': {
        type: 'damageAndDraw',
        config: { damage: 7, draw: 1 }
    },
    'diff': {
        type: 'damage',
        config: { damage: 10 }
    },
    'blame': {
        type: 'composite',
        config: {
            effects: [
                { type: 'removeCard', config: { count: 1 }, priority: 1 },
                { type: 'manaDrain', config: { amount: 1 }, priority: 0 }
            ]
        }
    },
    'bisect': {
        type: 'damageAndDraw',
        config: { damage: 12, draw: 1 }
    },

    // ========== 撤销操作 ==========
    'reset': {
        type: 'composite',
        config: {
            effects: [
                { type: 'removeCard', config: { count: 1 }, priority: 2 },
                { type: 'manaDrain', config: { amount: 1 }, priority: 1 },
                { type: 'shield', config: { amount: 5, duration: 2 }, priority: 0 }
            ]
        }
    },
    'revert': {
        type: 'heal',
        config: { heal: 15 }
    },
    'stash': {
        type: 'composite',
        config: {
            effects: [
                { type: 'draw', config: { count: 1 }, priority: 1 },
                { type: 'shield', config: { amount: 3, duration: 2 }, priority: 0 }
            ]
        }
    },
    'cherry-pick': {
        type: 'damageAndDraw',
        config: { damage: 9, draw: 1 }
    },

    // ========== 远程操作 ==========
    'remote': {
        type: 'damage',
        config: { damage: 9 }
    },
    'submodule': {
        type: 'composite',
        config: {
            effects: [
                { type: 'damage', config: { damage: 18 }, priority: 1 },
                { type: 'manaRestore', config: { amount: 1 }, priority: 0 }
            ]
        }
    },
    'worktree': {
        type: 'damageAndDraw',
        config: { damage: 8, draw: 1 }
    },

    // ========== 标签操作 ==========
    'tag': {
        type: 'composite',
        config: {
            effects: [
                { 
                    type: 'attackBuff', 
                    config: {
                        name: '标签标记',
                        icon: '🏷️',
                        value: 4,
                        duration: 4,
                        stackable: false
                    },
                    priority: 1
                },
                { 
                    type: 'drawBonusBuff', 
                    config: {
                        name: '标签激励',
                        icon: '📚',
                        count: 1,
                        duration: 2,
                        stackable: false
                    },
                    priority: 0
                }
            ]
        }
    },

    // ========== 其他操作 ==========
    'status': {
        type: 'composite',
        config: {
            effects: [
                { type: 'draw', config: { count: 1 }, priority: 1 },
                { type: 'manaRestore', config: { amount: 1 }, priority: 0 }
            ]
        }
    },
    'clean': {
        type: 'composite',
        config: {
            effects: [
                { type: 'removeCard', config: { count: 1 }, priority: 1 },
                { type: 'damage', config: { damage: 5 }, priority: 0 }
            ]
        }
    },
    'init': {
        type: 'healAndDraw',
        config: { heal: 12, draw: 1 }
    },
    'config': {
        type: 'composite',
        config: {
            effects: [
                { 
                    type: 'maxHealth', 
                    config: { amount: 15 },
                    priority: 3
                },
                { 
                    type: 'regenBuff', 
                    config: { 
                        heal: 4, 
                        duration: 4, 
                        name: '自然恢复', 
                        icon: '💚' 
                    },
                    priority: 2
                },
                { 
                    type: 'shield', 
                    config: { amount: 8, duration: 3 },
                    priority: 1
                },
                { 
                    type: 'manaRegenBuff', 
                    config: {
                        name: '能量恢复',
                        icon: '⚡',
                        amount: 1,
                        duration: 3,
                        stackable: false
                    },
                    priority: 0
                }
            ]
        }
    },

    // ========== 自动化工具 ==========
    'github-action': {
        type: 'composite',
        config: {
            effects: [
                { 
                    type: 'manaBuff', 
                    config: {
                        name: 'GitHub Action',
                        icon: '🔄',
                        value: 2,
                        duration: 6,
                        stackable: false
                    },
                    priority: 1
                },
                { 
                    type: 'manaRegenBuff', 
                    config: {
                        name: '自动恢复',
                        icon: '⚡',
                        amount: 1,
                        duration: 6,
                        stackable: false
                    },
                    priority: 0
                }
            ]
        }
    },
    'cl-bot': {
        type: 'composite',
        config: {
            effects: [
                { 
                    type: 'autoAttackBuff', 
                    config: {
                        name: 'CL自动机器人',
                        icon: '🤖',
                        damage: 6,
                        duration: 6,
                        stackable: false
                    },
                    priority: 1
                },
                { 
                    type: 'comboBuff', 
                    config: {
                        name: '连击',
                        icon: '⚡',
                        damage: 3,
                        duration: 4,
                        stackable: false
                    },
                    priority: 0
                }
            ]
        }
    }
};
