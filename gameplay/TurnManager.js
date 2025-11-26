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
     */
    startPlayerTurn(logCallback = null) {
        this.gameState.turn = 'player';
        this.gameState.startTurn(logCallback);
    }

    /**
     * 开始对手回合
     * @param {Function} logCallback - 可选的日志回调函数 (message, source) => void
     */
    startOpponentTurn(logCallback = null) {
        this.gameState.turn = 'opponent';
        this.gameState.startTurn(logCallback);
    }

    /**
     * 结束当前回合
     * @param {Function} logCallback - 可选的日志回调函数 (message, source) => void
     */
    endTurn(logCallback = null) {
        if (this.gameState.turn === 'player') {
            this.startOpponentTurn(logCallback);
        } else {
            this.startPlayerTurn(logCallback);
        }
    }

    /**
     * 检查是否可以自动结束回合
     */
    canAutoEndTurn() {
        if (this.gameState.turn !== 'player' || !this.gameState.gameStarted) {
            return false;
        }

        const player = this.gameState.player;
        return !player.hasPlayableCard();
    }
}

