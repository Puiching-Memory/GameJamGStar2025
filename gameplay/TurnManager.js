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
     */
    startPlayerTurn() {
        this.gameState.turn = 'player';
        this.gameState.startTurn();
    }

    /**
     * 开始对手回合
     */
    startOpponentTurn() {
        this.gameState.turn = 'opponent';
        this.gameState.startTurn();
    }

    /**
     * 结束当前回合
     */
    endTurn() {
        if (this.gameState.turn === 'player') {
            this.startOpponentTurn();
        } else {
            this.startPlayerTurn();
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

