import { GameMessageLog } from '../core/GameMessageLog.js';

/**
 * 日志系统
 * 负责管理游戏日志显示
 */
export class LogSystem {
    constructor(container, messageLog = null) {
        this.container = container;
        this.messageLog = messageLog || new GameMessageLog();
    }

    /**
     * 添加日志消息
     * @param {string} message - 消息内容
     * @param {string} source - 消息来源 ('player', 'opponent', 'system', 'game')
     * @param {object} options - 可选参数 (icon, color)
     */
    addLog(message, source = 'system', options = {}) {
        // 添加到消息日志
        const gameMessage = this.messageLog.addMessage(message, source, options);

        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `danmaku-item danmaku-${source}`;
        // 如果消息本身已包含图标，直接使用；否则使用GameMessage的显示文本
        const displayText = message.includes(gameMessage.icon) ? message : gameMessage.getDisplayText();
        messageEl.textContent = displayText;
        messageEl.dataset.messageId = gameMessage.id;
        messageEl.dataset.source = source;

        // 设置颜色样式
        if (gameMessage.color) {
            messageEl.style.setProperty('--message-color', gameMessage.color);
        }

        // 添加到容器顶部
        const firstChild = this.container.firstChild;
        if (firstChild) {
            this.container.insertBefore(messageEl, firstChild);
        } else {
            this.container.appendChild(messageEl);
        }

        // 限制同时显示的消息数量（最多4条）
        const messages = this.container.querySelectorAll('.danmaku-item');
        if (messages.length > 4) {
            messages[messages.length - 1].remove();
        }

        // 动画结束后移除元素（2.5秒动画 + 0.3秒缓冲）
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, 2800);
    }

    /**
     * 清空日志
     */
    clear() {
        this.container.innerHTML = '';
        if (this.messageLog) {
            this.messageLog.clear();
        }
    }

    /**
     * 获取消息日志管理器
     */
    getMessageLog() {
        return this.messageLog;
    }
}

