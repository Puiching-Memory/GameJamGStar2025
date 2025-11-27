/**
 * 日志系统
 * 负责管理游戏日志显示、消息历史记录和消息数据模型
 */
class LogSystem {
    constructor(container, consoleCallback = null) {
        this.container = container;
        this.consoleCallback = consoleCallback; // 用于将日志输出到console窗口的回调
        
        // 消息历史记录
        this.messages = [];
        this.maxHistorySize = 100; // 最大历史记录数
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
        
        // 创建游戏消息对象
        const gameMessage = this._createMessage({
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
     * 创建游戏消息对象（内部方法）
     * @private
     */
    _createMessage(data) {
        const message = {
            id: data.id || 'msg_' + Date.now() + '_' + Math.random(),
            source: data.source || 'system',
            timestamp: data.timestamp || Date.now(),
            icon: data.icon || this._getDefaultIcon(data.source),
            color: data.color || this._getDefaultColor(data.source)
        };
        
        // 支持两种消息格式：
        // - userMessage: 用户友好的消息（用于弹幕显示）
        // - devMessage: 开发者友好的消息（用于日志显示）
        // 如果只提供了 message，则同时用作两种消息（向后兼容）
        if (data.userMessage !== undefined || data.devMessage !== undefined) {
            message.userMessage = data.userMessage || data.message || '';
            message.devMessage = data.devMessage || data.message || '';
        } else {
            // 向后兼容：如果只提供了 message，同时用作两种消息
            message.userMessage = data.message || '';
            message.devMessage = data.message || '';
        }
        
        // 添加方法
        message.getUserDisplayText = () => {
            const msg = message.userMessage || message.devMessage || '';
            return `${message.icon} ${msg}`;
        };
        
        message.getDevDisplayText = () => {
            const msg = message.devMessage || message.userMessage || '';
            return `${message.icon} ${msg}`;
        };
        
        message.getDisplayText = () => message.getUserDisplayText();
        
        return message;
    }

    /**
     * 根据来源获取默认图标
     * @private
     */
    _getDefaultIcon(source) {
        const icons = {
            'player': '👤',
            'opponent': '🤖',
            'system': '⚙️',
            'game': '🎮'
        };
        return icons[source] || '📢';
    }

    /**
     * 根据来源获取默认颜色
     * @private
     */
    _getDefaultColor(source) {
        const colors = {
            'player': '#4facfe', // 蓝色
            'opponent': '#f5576c', // 红色
            'system': '#667eea', // 紫色
            'game': '#fbbf24' // 金色
        };
        return colors[source] || '#ffffff';
    }

    /**
     * 清空日志
     */
    clear() {
        this.container.innerHTML = '';
        this.messages = [];
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
     * 获取最近N条消息
     */
    getRecentMessages(count = 10) {
        return this.messages.slice(-count);
    }

    /**
     * 获取消息日志管理器（向后兼容）
     * @deprecated 使用 LogSystem 的方法直接访问
     */
    getMessageLog() {
        return this;
    }
}
