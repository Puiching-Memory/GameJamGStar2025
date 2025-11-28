import { GameMessage } from './GameMessage.js';

/**
 * 游戏消息日志管理器
 * 负责维护游戏信息数据表
 */
export class GameMessageLog {
    constructor() {
        this.messages = []; // 消息历史记录
        this.maxHistorySize = 100; // 最大历史记录数
    }

    /**
     * 添加消息到日志
     * @param {string} message - 消息内容
     * @param {string} source - 消息来源 ('player', 'opponent', 'system', 'game')
     * @param {object} options - 可选参数 (icon, color)
     */
    addMessage(message, source = 'system', options = {}) {
        const gameMessage = new GameMessage({
            message,
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

