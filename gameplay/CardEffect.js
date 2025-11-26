/**
 * 卡牌效果处理器
 * 负责执行卡牌效果并处理相关逻辑
 * 使用效果组件系统
 */
class CardEffect {
    constructor(gameState, logSystem, cardFactory = null) {
        this.gameState = gameState;
        this.logSystem = logSystem;
        this.cardFactory = cardFactory;
    }

    /**
     * 执行卡牌效果
     */
    execute(card, target, cardUser) {
        if (!card.effectComponent) {
            console.warn(`卡牌 ${card.name} 没有效果组件`);
            return null;
        }

        const context = {
            gameState: this.gameState,
            target: target,
            cardUser: cardUser,
            card: card,
            cardFactory: this.cardFactory
        };

        // 检查是否可以执行
        if (!card.effectComponent.canExecute(context)) {
            return null;
        }

        try {
            // 执行效果
            const result = card.effectComponent.execute(context);
            
            // 触发卡牌使用事件
            if (this.gameState.eventSystem) {
                this.gameState.eventSystem.emit('card:played', {
                    card: card,
                    player: cardUser,
                    target: target
                });
            }

            // 记录日志
            if (result && result.message && this.logSystem) {
                this.logSystem.addLog(result.message, result.source || cardUser);
            }

            return result;
        } catch (error) {
            console.error(`执行卡牌 ${card.name} 的效果时发生错误:`, error);
            if (this.logSystem) {
                this.logSystem.addLog(`卡牌 ${card.name} 效果执行失败！`, 'system');
            }
            return null;
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

