/**
 * 游戏状态管理
 * 负责管理游戏的整体状态和玩家数据
 */
class GameState {
    constructor() {
        this.player = new Player('player');
        this.opponent = new Player('opponent');
        this.turn = 'player';
        this.gameStarted = false;
        this.currentTurnCards = []; // 当前回合打出的卡牌元素
        this.turnNumber = 0; // 当前回合数
        this.eventSystem = new EventSystem(); // 事件系统
    }

    /**
     * 获取当前回合的玩家
     */
    getCurrentPlayer() {
        return this.turn === 'player' ? this.player : this.opponent;
    }

    /**
     * 获取对手
     */
    getOpponent() {
        return this.turn === 'player' ? this.opponent : this.player;
    }

    /**
     * 切换回合
     */
    switchTurn() {
        this.turn = this.turn === 'player' ? 'opponent' : 'player';
    }

    /**
     * 开始新回合
     * @param {Function} logCallback - 可选的日志回调函数 (message, source) => void
     */
    startTurn(logCallback = null) {
        const currentPlayer = this.getCurrentPlayer();
        const previousPlayer = this.getOpponent();
        
        // 处理上一个玩家回合结束时的buff
        previousPlayer.processTurnEndBuffs();
        
        // 恢复能量
        currentPlayer.restoreMana();
        
        // 处理当前玩家回合开始时的buff
        currentPlayer.processTurnStartBuffs(logCallback, this);
    }

    /**
     * 重置游戏状态
     */
    reset() {
        this.player.reset();
        this.opponent.reset();
        this.turn = 'player';
        this.gameStarted = false;
        this.currentTurnCards = [];
        this.turnNumber = 0;
    }

    /**
     * 检查游戏是否结束
     */
    checkGameOver() {
        if (this.player.health <= 0) {
            return 'opponent';
        } else if (this.opponent.health <= 0) {
            return 'player';
        }
        return null;
    }
}

