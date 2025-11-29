/**
 * 卡牌数据模型
 * 负责卡牌的基础数据和行为
 */
export class Card {
    constructor(data) {
        this.baseId = data.id; // 存储原始基础ID，方便组合技检测
        this.id = data.id + '_' + Date.now() + '_' + Math.random();
        this.name = data.name;
        this.icon = data.icon;
        this.cost = data.cost;
        this.power = data.power || 0;
        this.heal = data.heal || 0;
        this.draw = data.draw || 0;
        this.description = data.description;
        this.type = data.type;
        this.effect = data.effect;
    }

    /**
     * 检查是否可以打出（基于能量）
     */
    canPlay(mana) {
        return mana >= this.cost;
    }

}

