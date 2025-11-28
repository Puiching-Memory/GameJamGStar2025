/**
 * Tooltip系统
 * 负责显示浮动提示窗口
 */
export class Tooltip {
    constructor() {
        this.tooltipEl = null;
        this.showTimer = null;
        this.hideTimer = null;
        this.currentTarget = null;
        this.delay = 500; // 显示延迟（毫秒）
        this.init();
    }

    /**
     * 初始化tooltip元素
     */
    init() {
        this.tooltipEl = document.createElement('div');
        this.tooltipEl.className = 'tooltip';
        this.tooltipEl.id = 'game-tooltip';
        document.body.appendChild(this.tooltipEl);
    }

    /**
     * 绑定tooltip到元素
     * @param {HTMLElement} element - 目标元素
     * @param {string|Function} content - tooltip内容（可以是字符串或返回字符串的函数）
     * @param {Object} options - 选项 {delay, position}
     */
    attach(element, content, options = {}) {
        if (!element) return;

        const delay = options.delay !== undefined ? options.delay : this.delay;
        const position = options.position || 'top'; // top, bottom, left, right

        // 鼠标进入
        element.addEventListener('mouseenter', (e) => {
            this.clearTimers();
            this.currentTarget = element;
            
            this.showTimer = setTimeout(() => {
                this.show(e, content, position);
            }, delay);
        });

        // 鼠标离开
        element.addEventListener('mouseleave', () => {
            this.clearTimers();
            this.hide();
        });

        // 鼠标移动时更新位置
        element.addEventListener('mousemove', (e) => {
            if (this.tooltipEl.classList.contains('visible')) {
                this.updatePosition(e, position);
            }
        });
    }

    /**
     * 显示tooltip
     * @param {MouseEvent} e - 鼠标事件
     * @param {string|Function} content - tooltip内容
     * @param {string} position - 位置
     */
    show(e, content, position = 'top') {
        if (!this.tooltipEl) return;

        // 获取实际内容（支持函数）
        const text = typeof content === 'function' ? content() : content;
        
        if (!text) return;

        this.tooltipEl.textContent = text;
        this.tooltipEl.className = `tooltip tooltip-${position}`;
        this.tooltipEl.classList.add('visible');
        
        this.updatePosition(e, position);
    }

    /**
     * 更新tooltip位置
     * @param {MouseEvent} e - 鼠标事件
     * @param {string} position - 位置
     */
    updatePosition(e, position = 'top') {
        if (!this.tooltipEl) return;

        const rect = this.tooltipEl.getBoundingClientRect();
        const offset = 10; // 距离鼠标的偏移量
        let x = e.clientX;
        let y = e.clientY;

        switch (position) {
            case 'top':
                x = e.clientX - rect.width / 2;
                y = e.clientY - rect.height - offset;
                break;
            case 'bottom':
                x = e.clientX - rect.width / 2;
                y = e.clientY + offset;
                break;
            case 'left':
                x = e.clientX - rect.width - offset;
                y = e.clientY - rect.height / 2;
                break;
            case 'right':
                x = e.clientX + offset;
                y = e.clientY - rect.height / 2;
                break;
        }

        // 确保tooltip不超出视窗
        const padding = 5;
        if (x < padding) x = padding;
        if (y < padding) y = padding;
        if (x + rect.width > window.innerWidth - padding) {
            x = window.innerWidth - rect.width - padding;
        }
        if (y + rect.height > window.innerHeight - padding) {
            y = window.innerHeight - rect.height - padding;
        }

        this.tooltipEl.style.left = `${x}px`;
        this.tooltipEl.style.top = `${y}px`;
    }

    /**
     * 隐藏tooltip
     */
    hide() {
        if (!this.tooltipEl) return;
        this.tooltipEl.classList.remove('visible');
        this.currentTarget = null;
    }

    /**
     * 清除所有定时器
     */
    clearTimers() {
        if (this.showTimer) {
            clearTimeout(this.showTimer);
            this.showTimer = null;
        }
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
    }

    /**
     * 销毁tooltip
     */
    destroy() {
        this.clearTimers();
        if (this.tooltipEl && this.tooltipEl.parentNode) {
            this.tooltipEl.parentNode.removeChild(this.tooltipEl);
        }
        this.tooltipEl = null;
    }
}

