/**
 * 卡牌效果处理器
 * 负责执行卡牌效果并处理相关逻辑
 */
class CardEffect {
    constructor(gameState, logSystem) {
        this.gameState = gameState;
        this.logSystem = logSystem;
    }

    /**
     * 执行卡牌效果
     */
    execute(card, target, cardUser) {
        if (!card.effect) {
            return;
        }

        // 执行卡牌效果
        const message = card.effect(this.gameState, target, cardUser);
        
        // 抽牌效果由外部处理（在Game.js中）

        // 记录日志
        if (message && this.logSystem) {
            this.logSystem.addLog(message);
        }
    }

    /**
     * 确定卡牌目标
     * @param {Card} card - 卡牌
     * @param {string} cardUser - 出牌者 ('player' 或 'opponent')
     */
    determineTarget(card, cardUser) {
        // 治疗牌总是对自己使用
        if (card.type === 'heal') {
            return cardUser;
        }
        // 攻击牌对对手使用
        return cardUser === 'player' ? 'opponent' : 'player';
    }
}

