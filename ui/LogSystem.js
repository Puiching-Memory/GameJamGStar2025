/**
 * 日志系统
 * 负责管理游戏日志显示
 */
class LogSystem {
    constructor(container, messageLog = null, consoleCallback = null) {
        this.container = container;
        this.messageLog = messageLog || new GameMessageLog();
        this.consoleCallback = consoleCallback; // 用于将日志输出到console窗口的回调
    }

    /**
     * 添加日志消息
     * @param {string|object} messageOrData - 消息内容或消息数据对象
     *   - 字符串：向后兼容，同时用作用户和开发者消息
     *   - 对象：{ userMessage, devMessage } 或 { message }（向后兼容）
     * @param {string} source - 消息来源 ('player', 'opponent', 'system', 'game')
     * @param {object} options - 可选参数 (icon, color, userMessage, devMessage)
     */
    addLog(messageOrData, source = 'system', options = {}) {
        // 处理消息数据
        let messageData = {};
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
        
        // 添加到消息日志
        const gameMessage = this.messageLog.addMessage(messageData, source, options);

        // 弹幕只显示系统信息（'system' 或 'game'），不显示打牌时的log（'player' 或 'opponent'）
        const shouldShowInDanmaku = source === 'system' || source === 'game';
        
        if (shouldShowInDanmaku) {
            // 创建消息元素（使用用户友好消息）
            const messageEl = document.createElement('div');
            messageEl.className = `danmaku-item danmaku-${source}`;
            
            // 获取用户友好的显示文本
            const userMessage = gameMessage.userMessage || gameMessage.devMessage || '';
            const displayText = userMessage.includes(gameMessage.icon) 
                ? userMessage 
                : gameMessage.getUserDisplayText();
            
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

        // 如果提供了console回调，输出开发者友好消息到console窗口（所有消息都输出到console）
        if (this.consoleCallback) {
            const devMessage = gameMessage.devMessage || gameMessage.userMessage || messageOrData;
            this.consoleCallback(devMessage, source, options);
        }
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

