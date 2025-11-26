/**
 * 事件系统
 * 提供事件驱动的架构基础，支持模块间解耦通信
 */
class EventSystem {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * 订阅事件
     * @param {string} eventType - 事件类型
     * @param {Function} callback - 回调函数
     * @returns {Function} 取消订阅的函数
     */
    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);

        // 返回取消订阅的函数
        return () => this.off(eventType, callback);
    }

    /**
     * 取消订阅事件
     * @param {string} eventType - 事件类型
     * @param {Function} callback - 回调函数
     */
    off(eventType, callback) {
        if (!this.listeners.has(eventType)) return;
        
        const callbacks = this.listeners.get(eventType);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * 触发事件
     * @param {string} eventType - 事件类型
     * @param {*} data - 事件数据
     */
    emit(eventType, data = {}) {
        if (!this.listeners.has(eventType)) return;

        const callbacks = this.listeners.get(eventType);
        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${eventType}:`, error);
            }
        });
    }

    /**
     * 一次性订阅事件
     * @param {string} eventType - 事件类型
     * @param {Function} callback - 回调函数
     */
    once(eventType, callback) {
        const wrappedCallback = (data) => {
            callback(data);
            this.off(eventType, wrappedCallback);
        };
        this.on(eventType, wrappedCallback);
    }

    /**
     * 清除所有事件监听器
     */
    clear() {
        this.listeners.clear();
    }

    /**
     * 清除特定类型的所有监听器
     * @param {string} eventType - 事件类型
     */
    clearEvent(eventType) {
        this.listeners.delete(eventType);
    }
}

// 事件类型常量
const GameEvents = {
    // 游戏流程事件
    GAME_START: 'game:start',
    GAME_END: 'game:end',
    GAME_RESET: 'game:reset',
    
    // 回合事件
    TURN_START: 'turn:start',
    TURN_END: 'turn:end',
    TURN_SWITCH: 'turn:switch',
    
    // 卡牌事件
    CARD_PLAYED: 'card:played',
    CARD_DRAWN: 'card:drawn',
    CARD_REMOVED: 'card:removed',
    
    // 玩家事件
    PLAYER_DAMAGE: 'player:damage',
    PLAYER_HEAL: 'player:heal',
    PLAYER_MANA_CHANGE: 'player:mana:change',
    PLAYER_BUFF_ADDED: 'player:buff:added',
    PLAYER_BUFF_REMOVED: 'player:buff:removed',
    
    // UI更新事件
    UI_UPDATE: 'ui:update',
    UI_HAND_UPDATE: 'ui:hand:update',
    UI_HEALTH_UPDATE: 'ui:health:update',
    UI_MANA_UPDATE: 'ui:mana:update',
    
    // 动画事件
    ANIMATION_START: 'animation:start',
    ANIMATION_END: 'animation:end'
};

// 暴露到全局作用域
window.EventSystem = EventSystem;
window.GameEvents = GameEvents;

