/**
 * 游戏事件监听和转换
 * 负责将游戏事件转换为AI解说员可以理解的格式
 */
export class CommentatorEvents {
    constructor() {
        this.eventQueue = [];
    }

    /**
     * 记录游戏事件
     * @param {string} type - 事件类型
     * @param {object} data - 事件数据
     */
    recordEvent(type, data) {
        this.eventQueue.push({
            type,
            data,
            timestamp: Date.now()
        });
    }

    /**
     * 获取最近的事件（用于生成解说）
     */
    getRecentEvents(count = 5) {
        return this.eventQueue.slice(-count);
    }

    /**
     * 清空事件队列
     */
    clear() {
        this.eventQueue = [];
    }

    /**
     * 将事件转换为文本描述
     */
    eventToText(event) {
        const { type, data } = event;
        
        switch (type) {
            case 'game_start':
                return '游戏开始！';
            case 'card_played':
                return `${data.player === 'player' ? '玩家' : '对手'}使用了${data.card.icon} ${data.card.name}`;
            case 'damage_dealt':
                return `${data.target === 'player' ? '玩家' : '对手'}受到了${data.amount}点伤害`;
            case 'heal':
                return `${data.target === 'player' ? '玩家' : '对手'}恢复了${data.amount}点生命值`;
            case 'turn_start':
                return `${data.player === 'player' ? '玩家' : '对手'}的回合开始`;
            case 'turn_end':
                return `${data.player === 'player' ? '玩家' : '对手'}的回合结束`;
            case 'game_over':
                return `游戏结束！${data.winner === 'player' ? '玩家' : '对手'}获胜`;
            default:
                return '';
        }
    }

    /**
     * 获取游戏状态摘要
     */
    getGameStateSummary(gameState) {
        return {
            playerHealth: gameState.player.health,
            playerMana: gameState.player.mana,
            playerHand: gameState.player.hand.map(card => ({
                id: card.id,
                name: card.name,
                icon: card.icon,
                type: card.type,
                cost: card.cost,
                power: card.power,
                heal: card.heal || 0,
                draw: card.draw || 0
            })),
            opponentHealth: gameState.opponent.health,
            opponentMana: gameState.opponent.mana,
            opponentHand: gameState.opponent.hand.map(card => ({
                id: card.id,
                name: card.name,
                icon: card.icon,
                type: card.type,
                cost: card.cost,
                power: card.power,
                heal: card.heal || 0,
                draw: card.draw || 0
            })),
            turn: gameState.turn,
            turnNumber: gameState.turnNumber
        };
    }
}

