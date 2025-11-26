/**
 * 卡牌数据模型
 * 负责卡牌的基础数据和行为
 * 使用效果组件系统
 */
class Card {
    constructor(data) {
        this.id = data.id + '_' + Date.now() + '_' + Math.random();
        this.name = data.name;
        this.icon = data.icon;
        this.cost = data.cost;
        this.power = data.power || 0;
        this.heal = data.heal || 0;
        this.draw = data.draw || 0;
        this.description = data.description;
        this.type = data.type;
        
        // 效果组件
        this.effectComponent = data.effectComponent || null;
    }

    /**
     * 检查是否可以打出（基于能量）
     */
    canPlay(mana) {
        return mana >= this.cost;
    }

    /**
     * 检查是否有效果
     */
    hasEffect() {
        return this.effectComponent !== null;
    }

    /**
     * 计算卡牌的净能量消耗（考虑能量恢复效果）
     * 返回实际消耗的能量值（可能是负数，如果恢复的能量大于消耗）
     * 注意：能量恢复允许超过上限
     * @param {number} manaBeforeCard - 打出卡牌前的能量值（已不再使用，保留以兼容现有代码）
     * @param {number} maxMana - 最大能量值（已不再使用，保留以兼容现有代码）
     * @returns {number} 净能量消耗（正数表示消耗，负数表示净增加）
     */
    getNetManaCost(manaBeforeCard = 0, maxMana = 10) {
        if (!this.effectComponent) {
            return this.cost;
        }
        
        // 递归查找所有能量恢复效果
        const findManaRestore = (effect) => {
            if (!effect) return 0;
            
            // 检查是否是能量恢复效果（通过检查构造函数名称或类名）
            const effectName = effect.constructor?.name || '';
            if (effectName === 'ManaRestoreEffect' || (effect.amount !== undefined && effectName.includes('ManaRestore'))) {
                // 允许能量恢复超过上限，直接返回恢复量
                return effect.amount || 0;
            }
            
            // 如果是组合效果，递归查找所有子效果
            if (effectName === 'CompositeEffect' && effect.effects && Array.isArray(effect.effects)) {
                let totalRestore = 0;
                for (const subEffect of effect.effects) {
                    totalRestore += findManaRestore(subEffect);
                }
                return totalRestore;
            }
            
            return 0;
        };

        const restoreAmount = findManaRestore(this.effectComponent);
        
        // 净消耗 = 卡牌消耗 - 恢复的能量
        return this.cost - restoreAmount;
    }
}

