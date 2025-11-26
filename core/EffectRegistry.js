/**
 * 效果注册表
 * 支持动态注册和管理效果组件
 */
class EffectRegistry {
    constructor() {
        this.effects = new Map();
        this.effectBuilders = new Map();
    }

    /**
     * 注册效果构建器
     * @param {string} effectId - 效果ID
     * @param {Function} builder - 构建函数，返回EffectComponent实例
     */
    register(effectId, builder) {
        if (typeof builder !== 'function') {
            throw new Error(`Effect builder for ${effectId} must be a function`);
        }
        this.effectBuilders.set(effectId, builder);
    }

    /**
     * 创建效果实例
     * @param {string} effectId - 效果ID
     * @param {Object} config - 效果配置
     * @returns {EffectComponent}
     */
    create(effectId, config = {}) {
        const builder = this.effectBuilders.get(effectId);
        if (!builder) {
            throw new Error(`Effect ${effectId} is not registered`);
        }
        return builder(config);
    }

    /**
     * 检查效果是否已注册
     * @param {string} effectId - 效果ID
     * @returns {boolean}
     */
    has(effectId) {
        return this.effectBuilders.has(effectId);
    }

    /**
     * 获取所有已注册的效果ID
     * @returns {string[]}
     */
    getAllIds() {
        return Array.from(this.effectBuilders.keys());
    }

    /**
     * 清除所有注册
     */
    clear() {
        this.effectBuilders.clear();
    }
}

// 暴露到全局作用域
window.EffectRegistry = EffectRegistry;

