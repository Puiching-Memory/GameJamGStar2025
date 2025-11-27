/**
 * 游戏状态管理
 * 负责管理游戏的整体状态和玩家数据
 * 支持多人对战和队伍系统
 */
class GameState {
    constructor() {
        // 玩家列表（支持多人）
        this.players = [];
        // 队伍列表
        this.teams = [];
        
        // 创建默认玩家
        const player = new Player('player');
        const opponent = new Player('opponent');
        this.players.push(player);
        this.players.push(opponent);
        
        // 创建默认队伍
        this.playerTeam = new Team('player-team', '玩家队伍', '#3fb950');
        this.opponentTeam = new Team('opponent-team', '对手队伍', '#f85149');
        this.playerTeam.addPlayer(player);
        this.opponentTeam.addPlayer(opponent);
        this.teams.push(this.playerTeam);
        this.teams.push(this.opponentTeam);
        
        // 当前回合索引（指向players数组）
        this.turnIndex = 0;
        this.gameStarted = false;
        this.currentTurnCards = []; // 当前回合打出的卡牌元素
        this.turnNumber = 0; // 当前回合数
        this.eventSystem = new EventSystem(); // 事件系统
        this.cardPlayHistory = []; // 卡牌打出历史记录
        this.gameUUID = null; // 游戏UUID，每局游戏独立
        
        // AI管理器（管理所有自动机器人）
        this.aiManager = new Map(); // playerId -> AI实例
    }
    
    /**
     * 获取玩家（快捷方式）
     */
    get player() {
        return this.players.find(p => p.name === 'player') || null;
    }
    
    /**
     * 获取对手（快捷方式）
     */
    get opponent() {
        return this.players.find(p => p.name === 'opponent') || null;
    }

    /**
     * 生成UUID
     * @returns {string} UUID字符串
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * 获取当前回合的玩家
     */
    getCurrentPlayer() {
        return this.players[this.turnIndex] || null;
    }

    /**
     * 获取对手（返回所有敌对玩家）
     */
    getOpponent() {
        const currentPlayer = this.getCurrentPlayer();
        if (!currentPlayer || !currentPlayer.team) {
            return this.players.find(p => p !== currentPlayer) || null;
        }
        // 返回敌对队伍的玩家
        const enemyTeam = this.teams.find(t => t !== currentPlayer.team && t.isAlive);
        return enemyTeam ? enemyTeam.getAlivePlayers()[0] : null;
    }

    /**
     * 根据名称获取玩家
     */
    getPlayerByName(playerName) {
        return this.players.find(p => p.name === playerName) || null;
    }

    /**
     * 获取所有敌对玩家（排除自动机器人）
     */
    getEnemyPlayers() {
        const currentPlayer = this.getCurrentPlayer();
        if (!currentPlayer || !currentPlayer.team) {
            // 排除自动机器人和当前玩家
            return this.players.filter(p => 
                p !== currentPlayer && 
                p.health > 0 && 
                !p.isAutoBot
            );
        }
        // 返回所有敌对队伍的玩家（排除自动机器人）
        const enemyTeams = this.teams.filter(t => t !== currentPlayer.team && t.isAlive);
        return enemyTeams.flatMap(t => t.getAlivePlayers().filter(p => !p.isAutoBot));
    }

    /**
     * 切换回合到下一个玩家
     */
    switchTurn() {
        // 切换到下一个存活的玩家
        do {
            this.turnIndex = (this.turnIndex + 1) % this.players.length;
        } while (this.players[this.turnIndex].health <= 0 && this.players.some(p => p.health > 0));
    }

    /**
     * 添加玩家到游戏
     */
    addPlayer(player, team = null) {
        if (!this.players.includes(player)) {
            this.players.push(player);
            if (team) {
                team.addPlayer(player);
            } else {
                // 默认添加到对手队伍
                const opponentTeam = this.teams.find(t => t.id === 'opponent-team');
                if (opponentTeam) {
                    opponentTeam.addPlayer(player);
                }
            }
        }
    }

    /**
     * 注册AI（自动机器人）
     */
    registerAI(playerId, ai) {
        this.aiManager.set(playerId, ai);
    }

    /**
     * 获取玩家的AI
     */
    getAI(playerId) {
        return this.aiManager.get(playerId);
    }

    /**
     * 移除AI
     */
    removeAI(playerId) {
        this.aiManager.delete(playerId);
    }

    /**
     * 检查是否存在指定类型的自动机器人
     * @param {string} botType - 自动机器人类型 ('github-action' 或 'cl-bot')
     * @param {Player} player - 检查该玩家所在队伍
     * @returns {boolean} 如果存在返回true
     */
    hasAutoBotOfType(botType, player) {
        if (!player || !player.team) return false;
        
        // 检查该队伍中是否有相同类型的自动机器人
        return player.team.players.some(p => 
            p.isAutoBot && p.autoBotType === botType && p.health > 0
        );
    }

    /**
     * 移除自动机器人
     * @param {Player} botPlayer - 要移除的自动机器人玩家
     * @param {Function} logCallback - 可选的日志回调函数
     */
    removeAutoBot(botPlayer, logCallback = null) {
        if (!botPlayer || !botPlayer.isAutoBot) return;
        
        const botName = botPlayer.autoBotType === 'github-action' 
            ? 'GitHub Action' 
            : 'CL自动机器人';
        
        // 从队伍中移除
        if (botPlayer.team) {
            botPlayer.team.removePlayer(botPlayer);
        }
        
        // 从players数组中移除
        const index = this.players.indexOf(botPlayer);
        if (index !== -1) {
            this.players.splice(index, 1);
        }
        
        // 移除AI
        this.removeAI(botPlayer.name);
        
        // 触发玩家移除事件
        if (this.eventSystem) {
            this.eventSystem.emit('player:removed', {
                playerId: botPlayer.name,
                isAutoBot: true,
                autoBotType: botPlayer.autoBotType
            });
        }
        
        // 记录日志
        if (logCallback) {
            logCallback(`🤖 ${botName} 生命周期结束，已自动移除`, 'system');
        }
    }

    /**
     * 开始新回合
     * @param {Function} logCallback - 可选的日志回调函数 (message, source) => void
     * @returns {boolean} 如果游戏已结束返回false，否则返回true
     */
    startTurn(logCallback = null) {
        // 先检查游戏是否已结束
        if (this.checkGameOver()) {
            return false;
        }
        
        const currentPlayer = this.getCurrentPlayer();
        if (!currentPlayer || currentPlayer.health <= 0) {
            // 如果当前玩家已死亡，切换到下一个
            this.switchTurn();
            return this.startTurn(logCallback);
        }
        
        // 获取上一个玩家（用于处理回合结束buff）
        const previousIndex = (this.turnIndex - 1 + this.players.length) % this.players.length;
        const previousPlayer = this.players[previousIndex];
        
        // 处理上一个玩家回合结束时的buff
        if (previousPlayer && previousPlayer.health > 0) {
        previousPlayer.processTurnEndBuffs();
        }
        
        // 检查游戏是否已结束（处理buff后可能生命值为0）
        if (this.checkGameOver()) {
            return false;
        }
        
        // 恢复能量（自动机器人能量固定为999，不需要恢复）
        if (!currentPlayer.isAutoBot) {
        currentPlayer.restoreMana();
        }
        
        // 处理当前玩家回合开始时的buff
        currentPlayer.processTurnStartBuffs(logCallback, this);
        
        // 再次检查游戏是否已结束（处理buff后可能生命值为0）
        if (this.checkGameOver()) {
            return false;
        }
        
        // 如果是自动机器人，处理生命周期和抽牌
        if (currentPlayer.isAutoBot) {
            // 先检查游戏是否已结束（可能在之前的伤害中触发）
            if (this.checkGameOver()) {
                return false;
            }
            
            // 减少剩余回合数
            if (currentPlayer.autoBotTurnsRemaining !== undefined) {
                currentPlayer.autoBotTurnsRemaining--;
                
                // 如果生命周期结束，移除自动机器人
                if (currentPlayer.autoBotTurnsRemaining <= 0) {
                    this.removeAutoBot(currentPlayer, logCallback);
                    // 切换到下一个玩家
                    this.switchTurn();
                    return this.startTurn(logCallback);
                }
            }
            
            // 执行自动机器人回合（直接抽牌并打出，不需要手牌管理）
            const ai = this.getAI(currentPlayer.name);
            if (ai) {
                // 直接执行回合（AI内部会抽牌并打出）
                ai.executeTurn(logCallback);
                
                // 执行完自动机器人回合后，检查游戏是否已结束
                if (this.checkGameOver()) {
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * 重置游戏状态
     */
    reset() {
        // 清理自动机器人和AI
        this.aiManager.clear();
        
        // 移除所有自动机器人玩家（保留player和opponent）
        const autoBots = this.players.filter(p => p.isAutoBot);
        autoBots.forEach(bot => {
            // 从队伍中移除
            if (bot.team) {
                bot.team.removePlayer(bot);
            }
            // 从players数组中移除
            const index = this.players.indexOf(bot);
            if (index !== -1) {
                this.players.splice(index, 1);
            }
        });
        
        // 重置所有玩家
        this.players.forEach(player => player.reset());
        
        // 重置所有队伍
        this.teams.forEach(team => {
            team.checkAlive();
            // 清理队伍中的自动机器人
            const botPlayers = team.players.filter(p => p.isAutoBot);
            botPlayers.forEach(bot => team.removePlayer(bot));
        });
        
        // 确保player和opponent在players数组中
        const player = this.players.find(p => p.name === 'player');
        const opponent = this.players.find(p => p.name === 'opponent');
        if (!player) {
            const newPlayer = new Player('player');
            this.players.push(newPlayer);
            this.playerTeam.addPlayer(newPlayer);
        }
        if (!opponent) {
            const newOpponent = new Player('opponent');
            this.players.push(newOpponent);
            this.opponentTeam.addPlayer(newOpponent);
        }
        
        // 确保player和opponent在正确的队伍中
        if (player && !this.playerTeam.players.includes(player)) {
            this.playerTeam.addPlayer(player);
        }
        if (opponent && !this.opponentTeam.players.includes(opponent)) {
            this.opponentTeam.addPlayer(opponent);
        }
        
        this.turnIndex = 0;
        this.gameStarted = false;
        this.currentTurnCards = [];
        this.turnNumber = 0;
        this.cardPlayHistory = [];
        // 生成新的游戏UUID
        this.gameUUID = this.generateUUID();
    }

    /**
     * 获取游戏UUID
     * @returns {string} 游戏UUID
     */
    getGameUUID() {
        // 如果还没有UUID，生成一个
        if (!this.gameUUID) {
            this.gameUUID = this.generateUUID();
        }
        return this.gameUUID;
    }

    /**
     * 记录卡牌打出历史
     * @param {Card} card - 打出的卡牌
     * @param {string} player - 玩家类型 ('player' 或 'opponent')
     * @param {number} turnNumber - 回合数
     */
    recordCardPlay(card, player, turnNumber) {
        // 检查是否为自动机器人
        const playerObj = this.players.find(p => p.name === player) || null;
        const isAutoBot = playerObj && playerObj.isAutoBot;
        const autoBotType = playerObj ? playerObj.autoBotType : null;
        
        this.cardPlayHistory.push({
            cardName: card.name,
            cardIcon: card.icon,
            player: player,
            turnNumber: turnNumber,
            timestamp: Date.now(),
            isAutoBot: isAutoBot || false,
            autoBotType: autoBotType || null
        });
    }

    /**
     * 检查游戏是否结束
     * @returns {string|null} 返回获胜队伍ID，如果游戏未结束返回null
     */
    checkGameOver() {
        // 先更新所有队伍的状态
        this.teams.forEach(team => team.checkAlive());
        
        // 检查是否有队伍全部死亡
        const aliveTeams = this.teams.filter(team => team.isAlive);
        
        if (aliveTeams.length === 1) {
            const winnerTeam = aliveTeams[0];
            // 返回获胜队伍对应的玩家名称（向后兼容）
            if (winnerTeam.id === 'player-team') {
                return 'player';
            } else if (winnerTeam.id === 'opponent-team') {
                return 'opponent';
            }
            return winnerTeam.id;
        } else if (aliveTeams.length === 0) {
            return 'draw'; // 平局
        }
        return null;
    }
}

