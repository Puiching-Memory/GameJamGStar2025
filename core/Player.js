/**
 * 玩家数据模型
 * 负责管理单个玩家的状态数据
 */
class Player {
    constructor(name) {
        this.name = name;
        this.health = 100;
        this.hand = [];
        this.deck = [];
        this.mana = 3;
        this.maxMana = 3;
    }

    /**
     * 设置生命值
     */
    setHealth(value) {
        this.health = Math.max(0, Math.min(100, value));
    }

    /**
     * 增加生命值
     */
    addHealth(amount) {
        this.setHealth(this.health + amount);
    }

    /**
     * 减少生命值
     */
    takeDamage(amount) {
        // 扣除生命值
        if (amount > 0) {
            this.setHealth(this.health - amount);
        }
        
        return amount; // 返回实际造成的伤害
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
     * 重置玩家状态
     */
    reset() {
        this.health = 100;
        this.hand = [];
        this.deck = [];
        this.mana = 3;
        this.maxMana = 3;
    }
}

