/**
 * GitGraph 生成器
 * 负责将卡牌打出历史转换为 mermaid GitGraph
 */
class GitGraphGenerator {
    constructor(gameState) {
        this.gameState = gameState;
    }

    /**
     * 生成 mermaid GitGraph 代码
     * @returns {string} mermaid GitGraph 代码
     */
    generateGitGraph() {
        const history = this.gameState.cardPlayHistory;
        
        if (history.length === 0) {
            return `gitGraph
    commit id: "游戏尚未开始"
`;
        }

        let graph = 'gitGraph\n';
        
        // 初始化分支
        let playerBranch = 'main';
        let opponentBranch = 'opponent';
        let currentBranch = 'main';
        let commitCount = 0;
        
        // 按回合分组
        const turns = {};
        history.forEach(record => {
            if (!turns[record.turnNumber]) {
                turns[record.turnNumber] = [];
            }
            turns[record.turnNumber].push(record);
        });

        // 生成图形
        const turnNumbers = Object.keys(turns).sort((a, b) => parseInt(a) - parseInt(b));
        
        turnNumbers.forEach(turnNum => {
            const records = turns[turnNum];
            
            records.forEach((record, index) => {
                const playerName = record.player === 'player' ? '玩家' : '对手';
                const commitMessage = `${record.cardIcon} ${record.cardName}`;
                const commitId = `"${commitMessage}"`;
                
                // 如果是玩家，使用 main 分支
                // 如果是对手，使用 opponent 分支
                if (record.player === 'opponent' && currentBranch !== opponentBranch) {
                    // 切换到对手分支
                    graph += `    branch ${opponentBranch}\n`;
                    graph += `    checkout ${opponentBranch}\n`;
                    currentBranch = opponentBranch;
                } else if (record.player === 'player' && currentBranch !== playerBranch) {
                    // 切换回主分支
                    graph += `    checkout ${playerBranch}\n`;
                    currentBranch = playerBranch;
                }
                
                // 添加提交
                graph += `    commit id: ${commitId}\n`;
                commitCount++;
            });
        });

        return graph;
    }

    /**
     * 生成简化的 mermaid GitGraph（所有提交都在 main 分支）
     * @returns {string} mermaid GitGraph 代码
     */
    generateSimpleGitGraph() {
        const history = this.gameState.cardPlayHistory;
        
        if (history.length === 0) {
            return `gitGraph
    commit id: "游戏尚未开始"
`;
        }

        let graph = 'gitGraph\n';
        
        history.forEach((record, index) => {
            const commitMessage = `${record.cardIcon} ${record.cardName} (${record.player === 'player' ? '玩家' : '对手'})`;
            const sanitized = this.sanitizeString(commitMessage);
            const commitId = `"${sanitized}"`;
            graph += `    commit id: ${commitId}\n`;
        });

        return graph;
    }

    /**
     * 生成带分支的 mermaid GitGraph（玩家和对手使用不同分支）
     * @returns {string} mermaid GitGraph 代码
     */
    generateBranchGitGraph() {
        const history = this.gameState.cardPlayHistory;
        
        if (history.length === 0) {
            return `gitGraph
    commit id: "游戏尚未开始"
`;
        }

        let graph = 'gitGraph\n';
        let currentBranch = 'main';
        let hasOpponentBranch = false;
        let hasInitialCommit = false;
        
        history.forEach((record, index) => {
            const commitMessage = `${record.cardIcon} ${record.cardName}`;
            const sanitized = this.sanitizeString(commitMessage);
            const commitId = `"${sanitized}"`;
            
            // 根据玩家切换分支
            if (record.player === 'opponent' && currentBranch !== 'opponent') {
                if (!hasOpponentBranch) {
                    // 确保在创建分支前至少有一个提交
                    if (!hasInitialCommit) {
                        const firstRecord = history[0];
                        const firstMessage = `${firstRecord.cardIcon} ${firstRecord.cardName}`;
                        const firstId = `"${this.sanitizeString(firstMessage)}"`;
                        graph += `    commit id: ${firstId}\n`;
                        hasInitialCommit = true;
                    }
                    graph += `    branch opponent\n`;
                    hasOpponentBranch = true;
                }
                graph += `    checkout opponent\n`;
                currentBranch = 'opponent';
            } else if (record.player === 'player' && currentBranch !== 'main') {
                graph += `    checkout main\n`;
                currentBranch = 'main';
            }
            
            graph += `    commit id: ${commitId}\n`;
            hasInitialCommit = true;
        });

        return graph;
    }

    /**
     * 清理字符串，移除可能导致 mermaid 语法错误的字符
     */
    sanitizeString(str) {
        if (!str) return 'card';
        // 保留 emoji、中文字符、字母、数字和空格
        // 移除引号、换行符等可能导致问题的字符
        // 特殊处理：将可能的关键字（如 worktree）转换为更安全的格式
        return str
            .replace(/["'\n\r]/g, '')  // 移除引号和换行符
            .replace(/\bworktree\b/gi, 'work-tree')  // 将 worktree 转换为 work-tree，避免可能的语法冲突
            .replace(/\s+/g, ' ')       // 多个空格合并为一个
            .trim() || 'card';
    }

    /**
     * 获取卡牌类型
     */
    getCardType(cardName) {
        if (typeof CARD_DATA !== 'undefined') {
            const card = CARD_DATA.find(c => c.name === cardName);
            return card ? card.type : 'attack';
        }
        return 'attack';
    }

    /**
     * 判断提交类型（利用 mermaid 的 commit type 特性）
     */
    getCommitType(cardName, cardType) {
        // 重要卡牌使用 HIGHLIGHT
        if (cardName === 'Clone' || cardName === 'Merge') {
            return 'HIGHLIGHT';
        }
        // 治疗卡牌使用 REVERSE（表示恢复/撤销）
        if (cardType === 'heal') {
            return 'REVERSE';
        }
        // 默认 NORMAL
        return 'NORMAL';
    }

    /**
     * 生成充分利用 mermaid 特性的 GitGraph
     * @returns {string} mermaid GitGraph 代码
     */
    generateSmartGitGraph() {
        const history = this.gameState.cardPlayHistory;
        
        if (history.length === 0) {
            return `gitGraph
    commit id: "游戏尚未开始"
`;
        }

        let graph = 'gitGraph\n';
        let currentBranch = 'main';
        let hasOpponentBranch = false;
        let hasInitialCommit = false;
        const branchMap = new Map(); // 记录已创建的分支
        const autoBotBranchMap = new Map(); // 记录自动机器人的分支映射 playerId -> branchName
        const tagCounter = { player: 0, opponent: 0 }; // 标签计数器
        
        history.forEach((record, index) => {
            const cardName = record.cardName;
            const cardType = this.getCardType(cardName);
            const player = record.player;
            const isAutoBot = record.isAutoBot || false;
            const autoBotType = record.autoBotType || null;
            
            // 确定目标分支
            let targetBranch = 'main';
            if (isAutoBot && autoBotType) {
                // 自动机器人使用专属分支
                if (!autoBotBranchMap.has(player)) {
                    // 为自动机器人创建分支名称（使用类型）
                    const branchName = `bot-${autoBotType}`;
                    autoBotBranchMap.set(player, branchName);
                }
                targetBranch = autoBotBranchMap.get(player);
            } else if (player === 'opponent') {
                targetBranch = 'opponent';
            }
            
            const commitType = this.getCommitType(cardName, cardType);
            
            // 确保对手分支存在（非自动机器人）
            if (player === 'opponent' && !isAutoBot && !hasOpponentBranch) {
                if (!hasInitialCommit) {
                    const commitMessage = `${record.cardIcon} ${cardName}`;
                    const commitId = `"${this.sanitizeString(commitMessage)}"`;
                    graph += `    commit id: ${commitId}\n`;
                    hasInitialCommit = true;
                }
                graph += `    branch opponent\n`;
                hasOpponentBranch = true;
            }
            
            // 确保自动机器人分支存在
            if (isAutoBot && autoBotType) {
                const botBranchName = autoBotBranchMap.get(player);
                if (!branchMap.has(botBranchName)) {
                    // 确保在创建分支前至少有一个提交
                    if (!hasInitialCommit) {
                        const commitMessage = `${record.cardIcon} ${cardName}`;
                        const commitId = `"${this.sanitizeString(commitMessage)}"`;
                        graph += `    commit id: ${commitId}\n`;
                        hasInitialCommit = true;
                    }
                    graph += `    branch ${botBranchName}\n`;
                    branchMap.set(botBranchName, true);
                }
            }
            
            // 特殊卡牌处理：Branch -> 创建新分支（但自动机器人不使用此逻辑，它们已有专属分支）
            if (cardName === 'Branch' && !isAutoBot) {
                const featureBranch = `feature-${player}-${index}`;
                if (!branchMap.has(featureBranch)) {
                    graph += `    branch ${featureBranch}\n`;
                    branchMap.set(featureBranch, true);
                }
                graph += `    checkout ${featureBranch}\n`;
                currentBranch = featureBranch;
            }
            // 特殊卡牌处理：Checkout -> 切换回目标分支
            else if (cardName === 'Checkout') {
                if (currentBranch !== targetBranch) {
                    graph += `    checkout ${targetBranch}\n`;
                    currentBranch = targetBranch;
                }
            }
            // 特殊卡牌处理：Merge -> 合并当前分支
            else if (cardName === 'Merge') {
                // 如果当前在功能分支上，先合并再提交
                if (currentBranch !== targetBranch && currentBranch.startsWith('feature-')) {
                    graph += `    checkout ${targetBranch}\n`;
                    graph += `    merge ${currentBranch}\n`;
                    currentBranch = targetBranch;
                }
            }
            // 特殊卡牌处理：Cherry Pick -> 使用 cherry-pick
            else if (cardName === 'Cherry Pick' && index > 0) {
                // Cherry Pick 会复制之前的某个提交
                // 在 mermaid 中，cherry-pick 需要先切换到目标分支，然后提交
                // 这里我们模拟 cherry-pick 的效果：从其他分支复制提交
                if (currentBranch !== targetBranch) {
                    graph += `    checkout ${targetBranch}\n`;
                    currentBranch = targetBranch;
                }
                // 注意：mermaid 的 cherry-pick 语法是 `cherry-pick <commit-id>`
                // 但我们需要知道具体的 commit id，这里先简化处理
            }
            // 普通情况：切换分支（如果需要）
            else if (currentBranch !== targetBranch && !currentBranch.startsWith('feature-')) {
                graph += `    checkout ${targetBranch}\n`;
                currentBranch = targetBranch;
            }
            
            // 添加提交（使用 commit type）
            const commitMessage = `${record.cardIcon} ${cardName}`;
            const commitId = `"${this.sanitizeString(commitMessage)}"`;
            
            // 检查是否需要添加标签（Tag卡牌或重要卡牌）
            let tagName = null;
            if (cardName === 'Tag') {
                tagCounter[player]++;
                // 使用简单的标签名称，避免特殊字符，确保以字母开头
                tagName = `tag${player === 'player' ? 'p' : 'o'}${tagCounter[player]}`;
            } else if ((cardName === 'Clone' || cardName === 'Merge') && index > 0 && index % 5 === 0) {
                tagCounter[player]++;
                tagName = `milestone${player === 'player' ? 'p' : 'o'}${tagCounter[player]}`;
            }
            
            // 生成commit行，如果需要标签则在同一行添加
            if (commitType === 'NORMAL') {
                if (tagName) {
                    // tag 应该和 commit 在同一行，格式为 commit id: "..." tag: "tagName"
                    // tagName 需要用引号包裹
                    graph += `    commit id: ${commitId} tag: "${tagName}"\n`;
                } else {
                    graph += `    commit id: ${commitId}\n`;
                }
            } else {
                if (tagName) {
                    // 同时有type和tag的情况，tagName 需要用引号包裹
                    graph += `    commit id: ${commitId} type: ${commitType} tag: "${tagName}"\n`;
                } else {
                    graph += `    commit id: ${commitId} type: ${commitType}\n`;
                }
            }
            hasInitialCommit = true;
        });

        return graph;
    }

    /**
     * 获取推荐的 GitGraph（根据历史长度选择）
     * @returns {string} mermaid GitGraph 代码
     */
    getRecommendedGitGraph() {
        // 始终使用智能分支版本，让图形更有层次
        return this.generateSmartGitGraph();
    }
}

