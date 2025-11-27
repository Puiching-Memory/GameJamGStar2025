/**
 * DOM保护管理器
 * 负责在动画期间保护DOM元素，防止被意外更新
 */
class DOMProtectionManager {
    constructor() {
        // DOM保护：在动画期间保护的DOM元素
        this.protectedElements = new Set();
    }

    /**
     * 保护DOM元素，防止在动画期间被更新
     * @param {HTMLElement} element - 要保护的元素
     */
    protectElement(element) {
        if (element) {
            this.protectedElements.add(element);
            // 添加标记，方便识别
            element.dataset.animationProtected = 'true';
        }
    }

    /**
     * 取消保护DOM元素
     * @param {HTMLElement} element - 要取消保护的元素
     */
    unprotectElement(element) {
        if (element) {
            this.protectedElements.delete(element);
            delete element.dataset.animationProtected;
        }
    }

    /**
     * 检查元素是否受保护
     * @param {HTMLElement} element - 要检查的元素
     * @returns {boolean} 是否受保护
     */
    isProtected(element) {
        return element && this.protectedElements.has(element);
    }

    /**
     * 清理所有保护
     */
    clear() {
        this.protectedElements.forEach(element => {
            delete element.dataset.animationProtected;
        });
        this.protectedElements.clear();
    }
}

