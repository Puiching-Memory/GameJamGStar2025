/**
 * Buff渲染器
 * 负责渲染buff状态
 */
class BuffRenderer {
    /**
     * 渲染玩家的buff列表
     * @param {HTMLElement} container - 容器元素
     * @param {Array<Buff>} buffs - buff列表
     */
    renderBuffs(container, buffs) {
        // 清空容器
        container.innerHTML = '';
        
        if (!buffs || buffs.length === 0) {
            return;
        }

        buffs.forEach(buff => {
            const buffEl = document.createElement('div');
            buffEl.className = 'buff-item';
            buffEl.dataset.buffId = buff.id;
            // title属性已移除，改用Tooltip系统
            
            // 根据buff类型设置样式
            let buffClass = 'buff-';
            if (buff.type === 'attack') {
                buffClass += 'attack';
            } else if (buff.type === 'defense') {
                buffClass += 'defense';
            } else if (buff.type === 'heal') {
                buffClass += 'heal';
            } else if (buff.type === 'mana') {
                buffClass += 'mana';
            } else {
                buffClass += 'special';
            }
            buffEl.classList.add(buffClass);

            buffEl.innerHTML = `
                <span class="buff-icon">${buff.icon}</span>
                <span class="buff-value">${buff.value > 0 ? '+' : ''}${buff.value}</span>
                <span class="buff-duration">${buff.duration}</span>
            `;

            container.appendChild(buffEl);
        });
    }

    /**
     * 更新buff显示
     * @param {HTMLElement} container - 容器元素
     * @param {Array<Buff>} buffs - buff列表
     */
    update(container, buffs) {
        this.renderBuffs(container, buffs);
    }
}

