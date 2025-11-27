/**
 * 回合管理器
 * 负责管理游戏回合流程
 */
class TurnManager {
    constructor(gameState, cardFactory) {
        this.gameState = gameState;
        this.cardFactory = cardFactory;
    }

    /**
     * 开始玩家回合
     * @param {Function} logCallback - 可选的日志回调函数 (message, source) => void
     * @returns {boolean} 如果游戏已结束返回false，否则返回true
     */
    startPlayerTurn(logCallback = null) {
        // 找到玩家并设置turnIndex
        const playerIndex = this.gameState.players.findIndex(p => p.name === 'player');
        if (playerIndex !== -1) {
            this.gameState.turnIndex = playerIndex;
        }
        return this.gameState.startTurn(logCallback);
    }

    /**
     * 开始对手回合
     * @param {Function} logCallback - 可选的日志回调函数 (message, source) => void
     * @returns {boolean} 如果游戏已结束返回false，否则返回true
     */
    startOpponentTurn(logCallback = null) {
        // 找到对手并设置turnIndex
        const opponentIndex = this.gameState.players.findIndex(p => p.name === 'opponent');
        if (opponentIndex !== -1) {
            this.gameState.turnIndex = opponentIndex;
        }
        return this.gameState.startTurn(logCallback);
    }

    /**
     * 结束当前回合
     * @param {Function} logCallback - 可选的日志回调函数 (message, source) => void
     * @returns {boolean} 如果游戏已结束返回false，否则返回true
     */
    endTurn(logCallback = null) {
        // 切换到下一个玩家
        this.gameState.switchTurn();
        return this.gameState.startTurn(logCallback);
    }

    /**
     * 处理自动机器人回合
     * @param {Function} logCallback - 可选的日志回调函数
     */
    async processAutoBotTurn(logCallback = null) {
        const currentPlayer = this.gameState.getCurrentPlayer();
        if (!currentPlayer || !currentPlayer.isAutoBot) {
            return;
        }

        const ai = this.gameState.getAI(currentPlayer.name);
        if (ai) {
            // 执行自动机器人的回合
            ai.executeTurn(logCallback);
        }
    }

    /**
     * 检查是否可以自动结束回合
     */
    canAutoEndTurn() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        if (!currentPlayer || currentPlayer.name !== 'player' || !this.gameState.gameStarted) {
            return false;
        }

        return !currentPlayer.hasPlayableCard();
    }
}

