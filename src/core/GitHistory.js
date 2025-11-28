/**
 * Git历史记录系统
 * 负责记录每次卡牌打出的git操作
 */
export class GitHistory {
    constructor() {
        this.commits = []; // 存储所有commit记录
        this.branches = new Map(); // 分支映射：玩家类型 -> 分支名
        this.branchCounter = 0; // 分支计数器
        this.commitCounter = 0; // commit计数器
        
        // 初始化主分支
        this.mainBranch = 'main';
        this.branches.set('player', 'player');
        this.branches.set('opponent', 'opponent');
    }

    /**
     * 记录一次卡牌打出的git commit
     * @param {Card} card - 打出的卡牌
     * @param {string} playerType - 玩家类型 ('player' 或 'opponent')
     * @param {number} turnNumber - 回合数
     */
    recordCardPlay(card, playerType, turnNumber) {
        const branch = this.branches.get(playerType);
        const commitId = `commit${this.commitCounter++}`;
        const shortHash = this.generateShortHash(commitId);
        
        const commit = {
            id: commitId,
            hash: shortHash,
            branch: branch,
            playerType: playerType,
            card: {
                name: card.name,
                icon: card.icon,
                type: card.type,
                cost: card.cost,
                power: card.power || 0,
                heal: card.heal || 0
            },
            turnNumber: turnNumber,
            timestamp: Date.now(),
            message: this.generateCommitMessage(card, playerType)
        };

        this.commits.push(commit);
        return commit;
    }

    /**
     * 生成commit消息
     */
    generateCommitMessage(card, playerType) {
        const playerName = playerType === 'player' ? '玩家' : '对手';
        const action = this.getCardAction(card);
        return `${action}: ${card.icon} ${card.name}`;
    }

    /**
     * 根据卡牌类型获取动作描述
     */
    getCardAction(card) {
        if (card.type === 'attack') {
            return `攻击`;
        } else if (card.type === 'heal') {
            return `治疗`;
        } else if (card.type === 'special') {
            return `特殊`;
        }
        return `使用`;
    }

    /**
     * 生成短hash（模拟git commit hash）
     */
    generateShortHash(commitId) {
        // 简单的hash生成，实际可以更复杂
        let hash = 0;
        const str = commitId + Date.now().toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16).substring(0, 7);
    }

    /**
     * 生成mermaid git graph代码
     */
    generateMermaidGraph() {
        if (this.commits.length === 0) {
            return 'gitGraph:\n    commit id: "初始状态"';
        }

        let mermaid = 'gitGraph:\n';
        
        // 添加初始commit
        mermaid += '    commit id: "游戏开始"\n';
        
        // 按时间顺序添加commits
        let currentBranch = this.mainBranch;
        const createdBranches = new Set(); // 记录已创建的分支
        
        for (const commit of this.commits) {
            const branch = commit.branch;
            
            // 如果分支切换，需要先checkout
            if (branch !== currentBranch) {
                // 检查分支是否已创建
                if (!createdBranches.has(branch)) {
                    // 创建新分支（从当前分支创建）
                    mermaid += `    branch ${branch}\n`;
                    createdBranches.add(branch);
                }
                // 切换到目标分支
                mermaid += `    checkout ${branch}\n`;
                currentBranch = branch;
            }
            
            // 添加commit
            const commitLabel = this.formatCommitLabel(commit);
            // 转义特殊字符，避免破坏mermaid语法
            const escapedLabel = commitLabel.replace(/"/g, '\\"');
            mermaid += `    commit id: "${escapedLabel}"\n`;
        }
        
        return mermaid;
    }

    /**
     * 格式化commit标签
     */
    formatCommitLabel(commit) {
        const playerIcon = commit.playerType === 'player' ? '👤' : '🤖';
        const turnInfo = `T${commit.turnNumber}`;
        return `${playerIcon} ${commit.card.icon} ${turnInfo}`;
    }

    /**
     * 重置历史记录
     */
    reset() {
        this.commits = [];
        this.commitCounter = 0;
    }

    /**
     * 获取所有commits
     */
    getCommits() {
        return this.commits;
    }
}

