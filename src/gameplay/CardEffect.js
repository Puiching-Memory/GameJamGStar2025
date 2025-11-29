import { ComboSystem } from './ComboSystem.js';

/**
 * 卡牌效果处理器
 * 负责执行卡牌效果并处理相关逻辑
 */
export class CardEffect {
    constructor(gameState, logSystem, comboSystem = null) {
        this.gameState = gameState;
        this.logSystem = logSystem;
        this.comboSystem = comboSystem || new ComboSystem();
    }

    /**
     * 执行卡牌效果
     * @param {Card} card - 卡牌对象
     * @param {string} target - 目标
     * @param {string} cardUser - 出牌者
     * @param {Object} comboBonus - 组合技加成信息 {damageMultiplier, comboInfo}
     */
    execute(card, target, cardUser, comboBonus = null) {
        if (!card.effect) {
            return;
        }

        // 如果提供了组合技加成，将加成信息存储到gameState中，供effect函数使用
        if (comboBonus) {
            this.gameState._currentComboBonus = comboBonus;
        } else {
            this.gameState._currentComboBonus = null;
        }

        // 执行卡牌效果
        const message = card.effect(this.gameState, target, cardUser);
        
        // 抽牌效果由外部处理（在Game.js中）

        // 记录日志
        if (message && this.logSystem) {
            // 根据出牌者确定消息来源
            const source = cardUser === 'player' ? 'player' : 'opponent';
            this.logSystem.addLog(message, source);
        }

        // 清理临时组合技加成信息
        if (this.gameState._currentComboBonus) {
            delete this.gameState._currentComboBonus;
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

