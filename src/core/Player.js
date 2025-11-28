/**
 * 玩家数据模型
 * 负责管理单个玩家的状态数据
 */
export class Player {
    constructor(name) {
        this.name = name;
        this.maxHealth = 100; // 最大生命值
        this.health = 100;
        this.hand = [];
        this.deck = [];
        this.mana = 3;
        this.maxMana = 3;
        this.buffs = []; // buff列表
    }

    /**
     * 设置生命值
     */
    setHealth(value) {
        this.health = Math.max(0, Math.min(this.maxHealth, value));
    }

    /**
     * 增加最大生命值
     */
    increaseMaxHealth(amount) {
        this.maxHealth += amount;
        // 同时增加当前生命值
        this.health += amount;
        // 确保不超过新的最大生命值
        this.health = Math.min(this.health, this.maxHealth);
    }

    /**
     * 增加生命值
     */
    addHealth(amount) {
        this.setHealth(this.health + amount);
    }

    /**
     * 减少生命值（考虑防御buff）
     */
    takeDamage(amount) {
        // 计算防御buff效果
        const defenseBonus = this.getBuffValue('defense');
        const actualDamage = Math.max(0, amount - defenseBonus);
        
        // 扣除生命值
        if (actualDamage > 0) {
            this.setHealth(this.health - actualDamage);
        }
        
        return actualDamage; // 返回实际造成的伤害
    }

    /**
     * 消耗能量
     */
    consumeMana(amount) {
        if (this.mana >= amount) {
            this.mana -= amount;
            return true;
        }
        return false;
    }

    /**
     * 恢复能量
     */
    restoreMana() {
        this.maxMana = Math.min(10, this.maxMana + 1);
        this.mana = this.maxMana;
    }

    /**
     * 抽牌
     */
    drawCard(card) {
        if (this.hand.length < 7) {
            this.hand.push(card);
            return true;
        }
        return false;
    }

    /**
     * 移除手牌
     */
    removeCard(cardId) {
        const index = this.hand.findIndex(c => c.id === cardId);
        if (index !== -1) {
            return this.hand.splice(index, 1)[0];
        }
        return null;
    }

    /**
     * 移除随机手牌
     */
    removeRandomCard() {
        if (this.hand.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * this.hand.length);
        return this.hand.splice(randomIndex, 1)[0];
    }

    /**
     * 检查是否有可用卡牌（能量足够）
     */
    hasPlayableCard() {
        return this.hand.some(card => card.cost <= this.mana);
    }

    /**
     * 添加buff
     */
    addBuff(buff) {
        // 检查是否可叠加
        if (buff.stackable) {
            this.buffs.push(buff);
            if (buff.onApply) {
                buff.onApply(this);
            }
        } else {
            // 不可叠加，检查是否已存在相同类型的buff
            const existingIndex = this.buffs.findIndex(b => b.name === buff.name);
            if (existingIndex !== -1) {
                // 刷新持续时间
                this.buffs[existingIndex].duration = buff.duration;
                this.buffs[existingIndex].maxDuration = buff.duration;
            } else {
                this.buffs.push(buff);
                if (buff.onApply) {
                    buff.onApply(this);
                }
            }
        }
    }

    /**
     * 移除buff
     */
    removeBuff(buffId) {
        const index = this.buffs.findIndex(b => b.id === buffId);
        if (index !== -1) {
            const buff = this.buffs[index];
            if (buff.onRemove) {
                buff.onRemove(this);
            }
            this.buffs.splice(index, 1);
            return buff;
        }
        return null;
    }

    /**
     * 获取指定类型的buff总值
     */
    getBuffValue(type) {
        return this.buffs
            .filter(buff => buff.type === type)
            .reduce((sum, buff) => sum + buff.value, 0);
    }

    /**
     * 获取所有指定类型的buff
     */
    getBuffsByType(type) {
        return this.buffs.filter(buff => buff.type === type);
    }

    /**
     * 处理回合开始时的buff效果
     * @param {Function} logCallback - 可选的日志回调函数 (message, source) => void
     */
    processTurnStartBuffs(logCallback = null) {
        this.buffs.forEach(buff => {
            if (buff.onTurnStart) {
                const result = buff.onTurnStart(this, logCallback);
                // 如果buff的onTurnStart返回了日志消息，且提供了日志回调，则记录日志
                if (result && typeof result === 'object' && result.message && logCallback) {
                    logCallback(result.message, result.source || 'system');
                }
            }
        });
    }

    /**
     * 处理回合结束时的buff效果并减少持续时间
     */
    processTurnEndBuffs() {
        const expiredBuffs = [];
        this.buffs.forEach(buff => {
            if (buff.onTurnEnd) {
                buff.onTurnEnd(this);
            }
            buff.decreaseDuration();
            if (buff.isExpired()) {
                expiredBuffs.push(buff);
            }
        });
        
        // 移除过期的buff
        expiredBuffs.forEach(buff => {
            this.removeBuff(buff.id);
        });
    }

    /**
     * 计算实际攻击力（考虑攻击buff）
     */
    calculateAttackDamage(baseDamage) {
        const attackBonus = this.getBuffValue('attack');
        return Math.max(0, baseDamage + attackBonus);
    }

    /**
     * 计算实际治疗量（考虑治疗buff）
     */
    calculateHealAmount(baseHeal) {
        const healBonus = this.getBuffValue('heal');
        return Math.max(0, baseHeal + healBonus);
    }

    /**
     * 重置玩家状态
     */
    reset() {
        this.maxHealth = 100;
        this.health = 100;
        this.hand = [];
        this.deck = [];
        this.mana = 3;
        this.maxMana = 3;
        this.buffs = [];
    }
}

