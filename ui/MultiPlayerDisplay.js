/**
 * 多人显示管理器
 * 负责管理多个玩家的状态栏显示
 */
class MultiPlayerDisplay {
    constructor(container, components) {
        this.container = container;
        this.components = components;
        this.statusBars = new Map(); // playerId -> PlayerStatusBar
        
        // 自动机器人容器
        this.playerAutoBotContainer = document.getElementById('player-auto-bot-container');
        this.opponentAutoBotContainer = document.getElementById('opponent-auto-bot-container');
        
        // 监听窗口大小改变，重新计算位置
        window.addEventListener('resize', () => {
            this.updateAutoBotContainerPositions();
        });
        
        // 初始计算位置
        setTimeout(() => {
            this.updateAutoBotContainerPositions();
        }, 100); // 延迟一点确保DOM已渲染
    }

    /**
     * 更新所有玩家显示
     */
    update(gameState) {
        const currentPlayer = gameState.getCurrentPlayer();
        
        // 分离自动机器人和普通玩家
        const autoBots = [];
        const regularPlayers = [];
        
        gameState.players.forEach(player => {
            if (player.isAutoBot) {
                autoBots.push(player);
            } else if (player.name !== 'player' && player.name !== 'opponent') {
                regularPlayers.push(player);
            }
        });
        
        // 处理自动机器人：显示在对应队伍的状态栏下方
        autoBots.forEach(player => {
            let statusBar = this.statusBars.get(player.name);
            const targetContainer = this.getAutoBotContainer(player, gameState);
            
            if (!statusBar) {
                // 创建新的状态栏
                statusBar = new PlayerStatusBar(player, targetContainer, this.components);
                this.statusBars.set(player.name, statusBar);
            } else {
                // 如果容器改变了，需要移动元素
                const currentContainer = statusBar.elements.statusBar.parentNode;
                if (currentContainer !== targetContainer) {
                    currentContainer.removeChild(statusBar.elements.statusBar);
                    targetContainer.appendChild(statusBar.elements.statusBar);
                }
            }
            
            // 更新状态
            statusBar.update();
            
            // 设置当前回合高亮
            statusBar.setCurrentTurn(player === currentPlayer);
        });
        
        // 处理普通玩家（非player/opponent/自动机器人）：显示在多人容器中
        regularPlayers.forEach(player => {
            let statusBar = this.statusBars.get(player.name);
            
            if (!statusBar) {
                // 创建新的状态栏
                statusBar = new PlayerStatusBar(player, this.container, this.components);
                this.statusBars.set(player.name, statusBar);
            }
            
            // 更新状态
            statusBar.update();
            
            // 设置当前回合高亮
            statusBar.setCurrentTurn(player === currentPlayer);
        });

        // 移除已死亡的玩家状态栏（可选，或者显示为灰色）
        this.statusBars.forEach((statusBar, playerId) => {
            const player = gameState.players.find(p => p.name === playerId);
            if (!player || player.health <= 0) {
                // 可以选择移除或标记为死亡
                if (player && player.health <= 0) {
                    statusBar.elements.statusBar.classList.add('dead');
                }
            }
        });
        
        // 智能计算并更新自动机器人容器的位置（在DOM更新后）
        // 使用 setTimeout 确保DOM已完全更新
        setTimeout(() => {
            this.updateAutoBotContainerPositions();
        }, 0);
    }
    
    /**
     * 智能计算并更新自动机器人容器的位置
     */
    updateAutoBotContainerPositions() {
        const spacing = 35; // 状态栏和自动机器人容器之间的间距（像素）
        const handSpacing = 20; // 自动机器人容器和对手手牌之间的间距（像素）
        
        // 计算玩家状态栏的位置
        const playerHeaderInfo = document.getElementById('player-header-info');
        if (playerHeaderInfo && this.playerAutoBotContainer) {
            const rect = playerHeaderInfo.getBoundingClientRect();
            const top = rect.bottom + spacing;
            this.playerAutoBotContainer.style.top = `${top}px`;
        }
        
        // 计算对手状态栏的位置
        const opponentHeaderInfo = document.getElementById('opponent-header-info');
        if (opponentHeaderInfo && this.opponentAutoBotContainer) {
            const rect = opponentHeaderInfo.getBoundingClientRect();
            const top = rect.bottom + spacing;
            this.opponentAutoBotContainer.style.top = `${top}px`;
        }
        
        // 更新对手手牌区域的位置，避免与自动机器人容器重叠
        this.updateOpponentHandPosition(handSpacing);
    }
    
    /**
     * 更新对手手牌区域的位置，根据自动机器人容器动态调整
     */
    updateOpponentHandPosition(spacing = 20) {
        const opponentHand = document.getElementById('opponent-hand');
        if (!opponentHand) return;
        
        // 检查对手自动机器人容器是否有内容
        const hasOpponentAutoBots = this.opponentAutoBotContainer && 
            this.opponentAutoBotContainer.children.length > 0;
        
        if (hasOpponentAutoBots) {
            // 计算自动机器人容器的底部位置
            const containerRect = this.opponentAutoBotContainer.getBoundingClientRect();
            const newTop = containerRect.bottom + spacing;
            // 使用 setProperty 并添加 !important 以覆盖 CSS 中的 !important
            opponentHand.style.setProperty('top', `${newTop}px`, 'important');
        } else {
            // 没有自动机器人时，恢复到默认位置（180px）
            opponentHand.style.setProperty('top', '180px', 'important');
        }
    }

    /**
     * 获取自动机器人应该显示的容器
     */
    getAutoBotContainer(player, gameState) {
        if (!player.team) {
            // 如果没有队伍，默认显示在对手下方
            return this.opponentAutoBotContainer || this.container;
        }
        
        // 判断属于哪个队伍
        if (player.team === gameState.playerTeam) {
            return this.playerAutoBotContainer || this.container;
        } else if (player.team === gameState.opponentTeam) {
            return this.opponentAutoBotContainer || this.container;
        }
        
        // 默认显示在对手下方
        return this.opponentAutoBotContainer || this.container;
    }

    /**
     * 添加玩家状态栏
     */
    addPlayer(player, gameState = null) {
        if (!this.statusBars.has(player.name)) {
            let container = this.container;
            
            // 如果是自动机器人，使用对应的容器
            if (player.isAutoBot && gameState) {
                container = this.getAutoBotContainer(player, gameState);
            }
            
            const statusBar = new PlayerStatusBar(player, container, this.components);
            this.statusBars.set(player.name, statusBar);
        }
    }

    /**
     * 移除玩家状态栏
     */
    removePlayer(playerId) {
        const statusBar = this.statusBars.get(playerId);
        if (statusBar) {
            statusBar.destroy();
            this.statusBars.delete(playerId);
        }
    }

    /**
     * 清除所有状态栏
     */
    clear() {
        this.statusBars.forEach(statusBar => statusBar.destroy());
        this.statusBars.clear();
    }
}

