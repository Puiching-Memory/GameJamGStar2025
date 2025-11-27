/**
 * 游戏消息日志管理器
 * 负责维护游戏信息数据表
 */
class GameMessageLog {
    constructor() {
        this.messages = []; // 消息历史记录
        this.maxHistorySize = 100; // 最大历史记录数
    }

    /**
     * 添加消息到日志
     * @param {string|object} messageOrData - 消息内容（字符串）或消息数据对象
     *   - 如果是字符串：向后兼容，同时用作用户和开发者消息
     *   - 如果是对象：{ userMessage, devMessage } 或 { message }（向后兼容）
     * @param {string} source - 消息来源 ('player', 'opponent', 'system', 'game')
     * @param {object} options - 可选参数 (icon, color, userMessage, devMessage)
     */
    addMessage(messageOrData, source = 'system', options = {}) {
        let messageData = {};
        
        // 处理不同的输入格式
        if (typeof messageOrData === 'string') {
            // 向后兼容：字符串格式
            messageData.message = messageOrData;
        } else if (typeof messageOrData === 'object') {
            // 新格式：对象格式
            messageData = { ...messageOrData };
        }
        
        // 如果 options 中提供了 userMessage 或 devMessage，优先使用
        if (options.userMessage !== undefined) {
            messageData.userMessage = options.userMessage;
        }
        if (options.devMessage !== undefined) {
            messageData.devMessage = options.devMessage;
        }
        
        const gameMessage = new GameMessage({
            ...messageData,
            source,
            icon: options.icon,
            color: options.color
        });

        // 添加到历史记录
        this.messages.push(gameMessage);
        
        // 限制历史记录大小
        if (this.messages.length > this.maxHistorySize) {
            this.messages.shift();
        }

        return gameMessage;
    }

    /**
     * 获取所有消息
     */
    getAllMessages() {
        return this.messages;
    }

    /**
     * 根据来源获取消息
     */
    getMessagesBySource(source) {
        return this.messages.filter(msg => msg.source === source);
    }

    /**
     * 清空消息历史
     */
    clear() {
        this.messages = [];
    }

    /**
     * 获取最近N条消息
     */
    getRecentMessages(count = 10) {
        return this.messages.slice(-count);
    }
}

