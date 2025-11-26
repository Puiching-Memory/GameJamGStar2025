/**
 * 玩家数据模型
 * 负责管理单个玩家的状态数据
 */
class Player {
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
     * @param {number} amount - 治疗值
     * @param {EventSystem} eventSystem - 可选的事件系统，用于触发治疗事件
     */
    addHealth(amount, eventSystem = null) {
        const oldHealth = this.health;
        this.setHealth(this.health + amount);
        
        // 触发治疗事件（只有实际治疗时才触发）
        if (eventSystem && this.health > oldHealth && amount > 0) {
            eventSystem.emit('player:heal', {
                player: this.name,
                heal: this.health - oldHealth,
                oldHealth: oldHealth,
                newHealth: this.health
            });
        }
    }

    /**
     * 减少生命值（考虑护盾和防御buff）
     * @param {number} amount - 伤害值
     * @param {EventSystem} eventSystem - 可选的事件系统，用于触发扣血事件
     */
    takeDamage(amount, eventSystem = null) {
        // 先计算护盾吸收
        const shieldValue = this.getBuffValue('shield');
        let remainingDamage = amount;
        
        if (shieldValue > 0) {
            // 消耗护盾
            const shieldBuffs = this.getBuffsByType('shield');
            let damageToAbsorb = remainingDamage;
            
            for (const shieldBuff of shieldBuffs) {
                if (damageToAbsorb <= 0) break;
                
                const absorbAmount = Math.min(shieldBuff.value, damageToAbsorb);
                shieldBuff.value -= absorbAmount;
                damageToAbsorb -= absorbAmount;
                
                // 如果护盾被消耗完，移除buff
                if (shieldBuff.value <= 0) {
                    this.removeBuff(shieldBuff.id);
                }
            }
            
            remainingDamage = damageToAbsorb;
        }
        
        // 计算防御buff效果
        const defenseBonus = this.getBuffValue('defense');
        const actualDamage = Math.max(0, remainingDamage - defenseBonus);
        
        // 记录扣血前的生命值
        const oldHealth = this.health;
        
        // 扣除生命值
        if (actualDamage > 0) {
            this.setHealth(this.health - actualDamage);
            
            // 触发扣血事件（只有实际扣血时才触发）
            if (eventSystem && this.health < oldHealth) {
                eventSystem.emit('player:damage', {
                    player: this.name,
                    damage: actualDamage,
                    oldHealth: oldHealth,
                    newHealth: this.health
                });
            }
        }
        
        return amount - remainingDamage + actualDamage; // 返回实际造成的总伤害（护盾吸收+生命损失）
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
     * @param {GameState} gameState - 游戏状态（用于需要访问gameState的buff）
     */
    processTurnStartBuffs(logCallback = null, gameState = null) {
        this.buffs.forEach(buff => {
            if (buff.onTurnStart) {
                let result = buff.onTurnStart(this, logCallback, gameState);
                
                // 如果返回的是函数，说明需要gameState参数
                if (typeof result === 'function' && gameState) {
                    result = result(gameState);
                }
                
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

