/**
 * 卡牌工厂
 * 负责创建卡牌实例和卡牌效果
 * 使用效果组件系统，支持组合和扩展
 */
class CardFactory {
    constructor(effectRegistry = null) {
        // 如果提供了效果注册表，使用它；否则创建新的
        this.effectRegistry = effectRegistry || new EffectRegistry();
        
        // 初始化效果定义（如果还没有初始化）
        if (typeof initializeEffects === 'function') {
            initializeEffects(this.effectRegistry);
        }
    }

    /**
     * 创建卡牌实例
     */
    createCard(cardData) {
        const baseId = cardData.id;
        let effectComponent = null;
        
        // 使用效果组件系统
        if (typeof CARD_EFFECT_DEFINITIONS !== 'undefined' && CARD_EFFECT_DEFINITIONS[baseId]) {
            const effectDef = CARD_EFFECT_DEFINITIONS[baseId];
            
            if (effectDef.type === 'composite') {
                // 组合效果
                const effects = effectDef.config.effects.map(e => {
                    const effect = this.effectRegistry.create(e.type, e.config);
                    if (e.priority !== undefined) {
                        effect.priority = e.priority;
                    }
                    return effect;
                });
                // 按优先级排序
                effects.sort((a, b) => (b.priority || 0) - (a.priority || 0));
                effectComponent = new CompositeEffect({
                    effects: effects
                });
            } else {
                // 单一效果
                effectComponent = this.effectRegistry.create(effectDef.type, effectDef.config);
            }
        } else {
            console.warn(`卡牌 ${baseId} 没有定义效果，将创建无效果卡牌`);
        }
        
        return new Card({
            ...cardData,
            effectComponent: effectComponent
        });
    }

    /**
     * 获取随机卡牌
     */
    getRandomCard() {
        const randomIndex = Math.floor(Math.random() * CARD_DATA.length);
        return this.createCard(CARD_DATA[randomIndex]);
    }

    /**
     * 获取多张随机卡牌
     */
    getRandomCards(count) {
        const cards = [];
        for (let i = 0; i < count; i++) {
            cards.push(this.getRandomCard());
        }
        return cards;
    }

}
