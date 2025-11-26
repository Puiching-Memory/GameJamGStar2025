/**
 * 卡牌数据定义
 * 包含所有卡牌的基础数据（基于git所有原子操作）
 * 重新设计：更具策略性和趣味性
 */
const CARD_DATA = [
    // ========== 基础操作 ==========
    {
        id: 'add',
        name: 'Add',
        icon: '➕',
        cost: 1,
        power: 5,
        description: '暂存文件\n造成伤害',
        type: 'attack'
    },
    {
        id: 'commit',
        name: 'Commit',
        icon: '💾',
        cost: 1,
        power: 6,
        description: '提交更改\n造成伤害',
        type: 'attack'
    },
    {
        id: 'push',
        name: 'Push',
        icon: '⬆️',
        cost: 2,
        power: 12,
        description: '推送代码到远程仓库\n造成伤害',
        type: 'attack'
    },
    {
        id: 'pull',
        name: 'Pull',
        icon: '⬇️',
        cost: 2,
        power: 0,
        heal: 10,
        description: '拉取远程代码\n恢复生命值',
        type: 'heal'
    },
    {
        id: 'fetch',
        name: 'Fetch',
        icon: '📥',
        cost: 1,
        power: 0,
        draw: 1,
        description: '获取远程更新\n抽牌',
        type: 'special'
    },
    {
        id: 'clone',
        name: 'Clone',
        icon: '📋',
        cost: 5,
        power: 20,
        description: '克隆仓库\n造成伤害\n消耗对手能量',
        type: 'attack'
    },

    // ========== 分支操作 ==========
    {
        id: 'branch',
        name: 'Branch',
        icon: '🌿',
        cost: 1,
        power: 0,
        draw: 2,
        description: '创建分支\n抽牌',
        type: 'special'
    },
    {
        id: 'checkout',
        name: 'Checkout',
        icon: '🔀',
        cost: 2,
        power: 8,
        draw: 1,
        description: '切换分支\n造成伤害\n抽牌',
        type: 'special'
    },
    {
        id: 'merge',
        name: 'Merge',
        icon: '🔀',
        cost: 3,
        power: 16,
        description: '合并分支\n造成伤害',
        type: 'attack'
    },
    {
        id: 'rebase',
        name: 'Rebase',
        icon: '🔄',
        cost: 3,
        power: 10,
        draw: 1,
        description: '变基操作\n造成伤害\n抽牌',
        type: 'special'
    },

    // ========== 历史操作 ==========
    {
        id: 'log',
        name: 'Log',
        icon: '📜',
        cost: 1,
        power: 0,
        draw: 1,
        description: '查看提交历史\n抽牌',
        type: 'special'
    },
    {
        id: 'show',
        name: 'Show',
        icon: '👁️',
        cost: 2,
        power: 7,
        draw: 1,
        description: '显示提交详情\n造成伤害\n抽牌',
        type: 'special'
    },
    {
        id: 'diff',
        name: 'Diff',
        icon: '🔍',
        cost: 2,
        power: 10,
        description: '查看差异\n造成伤害',
        type: 'attack'
    },
    {
        id: 'blame',
        name: 'Blame',
        icon: '👤',
        cost: 2,
        power: 0,
        description: '追溯代码\n移除对手手牌\n消耗对手能量',
        type: 'special'
    },
    {
        id: 'bisect',
        name: 'Bisect',
        icon: '🔎',
        cost: 3,
        power: 12,
        draw: 1,
        description: '二分查找bug\n造成伤害\n抽牌',
        type: 'special'
    },

    // ========== 撤销操作 ==========
    {
        id: 'reset',
        name: 'Reset',
        icon: '⏪',
        cost: 2,
        power: 0,
        description: '重置操作\n移除对手手牌\n消耗对手能量\n获得护盾',
        type: 'special'
    },
    {
        id: 'revert',
        name: 'Revert',
        icon: '↩️',
        cost: 3,
        power: 0,
        heal: 15,
        description: '撤销操作\n恢复生命值',
        type: 'heal'
    },
    {
        id: 'stash',
        name: 'Stash',
        icon: '📦',
        cost: 1,
        power: 0,
        draw: 1,
        description: '暂存更改\n抽牌\n获得护盾',
        type: 'special'
    },
    {
        id: 'cherry-pick',
        name: 'Cherry Pick',
        icon: '🍒',
        cost: 2,
        power: 9,
        draw: 1,
        description: '精选提交\n造成伤害\n抽牌',
        type: 'special'
    },

    // ========== 远程操作 ==========
    {
        id: 'remote',
        name: 'Remote',
        icon: '🌐',
        cost: 2,
        power: 9,
        description: '管理远程仓库\n造成伤害',
        type: 'attack'
    },
    {
        id: 'submodule',
        name: 'Submodule',
        icon: '📁',
        cost: 4,
        power: 18,
        description: '子模块操作\n造成伤害\n恢复能量',
        type: 'attack'
    },
    {
        id: 'worktree',
        name: 'Worktree',
        icon: '🌳',
        cost: 2,
        power: 8,
        draw: 1,
        description: '工作树操作\n造成伤害\n抽牌',
        type: 'special'
    },

    // ========== 标签操作 ==========
    {
        id: 'tag',
        name: 'Tag',
        icon: '🏷️',
        cost: 2,
        power: 0,
        description: '创建标签\n获得攻击力提升\n每回合额外抽牌',
        type: 'special'
    },

    // ========== 其他操作 ==========
    {
        id: 'status',
        name: 'Status',
        icon: '📊',
        cost: 1,
        power: 0,
        draw: 1,
        description: '查看状态\n抽牌\n恢复能量',
        type: 'special'
    },
    {
        id: 'clean',
        name: 'Clean',
        icon: '🧹',
        cost: 2,
        power: 0,
        description: '清理未跟踪文件\n移除对手手牌\n造成伤害',
        type: 'special'
    },
    {
        id: 'init',
        name: 'Init',
        icon: '🚀',
        cost: 3,
        power: 0,
        heal: 12,
        draw: 1,
        description: '初始化仓库\n恢复生命值\n抽牌',
        type: 'special'
    },
    {
        id: 'config',
        name: 'Config',
        icon: '⚙️',
        cost: 2,
        power: 0,
        description: '配置仓库\n增加生命上限\n每回合恢复生命\n获得护盾\n每回合恢复能量',
        type: 'special'
    },

    // ========== 自动化工具 ==========
    {
        id: 'github-action',
        name: 'GitHub Action',
        icon: '🔄',
        cost: 3,
        power: 0,
        description: '自动工作流\n能量上限提升\n每回合恢复能量',
        type: 'special'
    },
    {
        id: 'cl-bot',
        name: 'CL自动机器人',
        icon: '🤖',
        cost: 3,
        power: 0,
        description: '自动化助手\n每回合自动攻击\n获得连击：每使用卡牌造成额外伤害',
        type: 'special'
    }
];
