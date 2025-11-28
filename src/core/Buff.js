/**
 * Buff数据模型
 * 负责管理buff/debuff效果
 */
export class Buff {
    constructor(data) {
        this.id = data.id || 'buff_' + Date.now() + '_' + Math.random();
        this.name = data.name; // buff名称
        this.icon = data.icon || '✨'; // buff图标
        this.type = data.type; // buff类型: 'attack', 'defense', 'mana', 'draw', 'heal', 'special'
        this.value = data.value || 0; // buff数值
        this.duration = data.duration || 1; // 持续回合数
        this.maxDuration = this.duration; // 最大持续回合数
        this.description = data.description || ''; // buff描述
        this.stackable = data.stackable || false; // 是否可叠加
        this.onApply = data.onApply || null; // 应用时的回调
        this.onRemove = data.onRemove || null; // 移除时的回调
        this.onTurnStart = data.onTurnStart || null; // 回合开始时的回调
        this.onTurnEnd = data.onTurnEnd || null; // 回合结束时的回调
    }

    /**
     * 减少持续时间
     */
    decreaseDuration() {
        this.duration = Math.max(0, this.duration - 1);
    }

    /**
     * 检查是否已过期
     */
    isExpired() {
        return this.duration <= 0;
    }

    /**
     * 获取剩余回合数
     */
    getRemainingTurns() {
        return this.duration;
    }

    /**
     * 克隆buff
     */
    clone() {
        return new Buff({
            id: this.id + '_clone',
            name: this.name,
            icon: this.icon,
            type: this.type,
            value: this.value,
            duration: this.duration,
            description: this.description,
            stackable: this.stackable,
            onApply: this.onApply,
            onRemove: this.onRemove,
            onTurnStart: this.onTurnStart,
            onTurnEnd: this.onTurnEnd
        });
    }
}

