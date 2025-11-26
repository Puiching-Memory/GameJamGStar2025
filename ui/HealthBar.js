/**
 * 生命值条组件
 * 负责显示和更新生命值
 */
class HealthBar {
    constructor(healthEl, textEl) {
        this.healthEl = healthEl;
        this.textEl = textEl;
    }

    /**
     * 更新生命值显示
     */
    update(health) {
        this.healthEl.style.width = `${health}%`;
        this.textEl.textContent = `${health}/100`;

        // 统一使用绿色，不再根据生命值改变颜色
        this.healthEl.style.background = 'linear-gradient(90deg, #4ade80, #22c55e)';
    }

}

