/**
 * 能量显示组件
 * 负责显示和更新能量条（类似血条样式）
 */
class ManaDisplay {
    constructor(manaFillEl, manaTextEl) {
        this.manaFillEl = manaFillEl;
        this.manaTextEl = manaTextEl;
    }

    /**
     * 更新能量显示
     */
    update(mana, maxMana) {
        if (!this.manaFillEl || !this.manaTextEl) return;

        // 使用当前玩家的maxMana计算百分比
        const percentage = maxMana > 0 ? (mana / maxMana) * 100 : 0;
        
        // 更新能量条宽度
        this.manaFillEl.style.width = `${percentage}%`;
        
        // 更新能量文本
        this.manaTextEl.textContent = `${mana}/${maxMana}`;
        
        // 根据能量值调整颜色
        if (mana === 0) {
            this.manaFillEl.style.background = 'linear-gradient(90deg, #6b7280, #4b5563)';
        } else if (mana <= maxMana * 0.3) {
            this.manaFillEl.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
        } else {
            this.manaFillEl.style.background = 'linear-gradient(90deg, #fbbf24, #f59e0b)';
        }
    }
}

