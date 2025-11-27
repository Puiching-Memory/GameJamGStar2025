/**
 * Console 日志管理器
 * 负责管理 Console 窗口的显示、更新和交互
 */
class ConsoleManager {
    constructor(elements, logSystem) {
        this.elements = elements;
        this.logSystem = logSystem;
        this.autoScroll = true; // 默认开启自动滚动
        
        // 初始化按钮文本
        if (this.elements.consoleAutoScrollBtn) {
            this.elements.consoleAutoScrollBtn.textContent = 
                `自动滚动: ${this.autoScroll ? '开启' : '关闭'}`;
        }
    }

    /**
     * 显示 Console 窗口
     */
    show() {
        if (!this.elements.consoleModal || !this.elements.consoleContainer) {
            return;
        }

        // 显示模态框
        this.elements.consoleModal.style.display = 'block';
        
        // 更新日志显示
        this.update();
        
        // 如果自动滚动开启，滚动到底部
        if (this.autoScroll) {
            this.scrollToBottom();
        }
    }

    /**
     * 更新 Console 显示
     */
    update() {
        if (!this.elements.consoleContainer) {
            return;
        }

        const messages = this.logSystem.getMessageLog().getAllMessages();
        
        // 清空容器
        this.elements.consoleContainer.innerHTML = '';
        
        // 添加所有消息
        messages.forEach(message => {
            this.renderMessage(message);
        });
        
        // 如果自动滚动开启，滚动到底部
        if (this.autoScroll) {
            this.scrollToBottom();
        }
    }

    /**
     * 渲染单条消息
     */
    renderMessage(message) {
        const logEntry = document.createElement('div');
        logEntry.className = `console-entry console-${message.source}`;
        
        const timestamp = new Date(message.timestamp).toLocaleTimeString();
        // 使用开发者友好的显示文本
        const displayText = message.getDevDisplayText();
        
        logEntry.innerHTML = `
            <span class="console-timestamp">[${timestamp}]</span>
            <span class="console-source">${message.source}</span>
            <span class="console-message">${displayText}</span>
        `;
        
        // 设置颜色样式
        if (message.color) {
            logEntry.style.setProperty('--message-color', message.color);
        }
        
        this.elements.consoleContainer.appendChild(logEntry);
    }

    /**
     * 清空 Console
     */
    clear() {
        if (this.elements.consoleContainer) {
            this.elements.consoleContainer.innerHTML = '';
        }
        if (this.logSystem) {
            this.logSystem.clear();
        }
    }

    /**
     * 切换自动滚动
     */
    toggleAutoScroll() {
        this.autoScroll = !this.autoScroll;
        if (this.elements.consoleAutoScrollBtn) {
            this.elements.consoleAutoScrollBtn.textContent = 
                `自动滚动: ${this.autoScroll ? '开启' : '关闭'}`;
        }
        if (this.autoScroll) {
            this.scrollToBottom();
        }
    }

    /**
     * 滚动 Console 到底部
     */
    scrollToBottom() {
        if (this.elements.consoleContainer) {
            this.elements.consoleContainer.scrollTop = this.elements.consoleContainer.scrollHeight;
        }
    }

    /**
     * 添加日志到 Console（由 LogSystem 调用）
     */
    addLog(message, source = 'system', options = {}) {
        if (!this.elements.consoleContainer) {
            return;
        }

        const logEntry = document.createElement('div');
        logEntry.className = `console-entry console-${source}`;
        
        const timestamp = new Date().toLocaleTimeString();
        const gameMessage = this.logSystem.getMessageLog().getAllMessages().slice(-1)[0];
        // 使用开发者友好的显示文本
        const displayText = gameMessage?.getDevDisplayText() || message;
        
        logEntry.innerHTML = `
            <span class="console-timestamp">[${timestamp}]</span>
            <span class="console-source">${source}</span>
            <span class="console-message">${displayText}</span>
        `;
        
        // 设置颜色样式
        if (gameMessage?.color) {
            logEntry.style.setProperty('--message-color', gameMessage.color);
        }
        
        this.elements.consoleContainer.appendChild(logEntry);
        
        // 如果自动滚动开启，滚动到底部
        if (this.autoScroll) {
            this.scrollToBottom();
        }
    }

    /**
     * 获取自动滚动状态
     */
    isAutoScrollEnabled() {
        return this.autoScroll;
    }
}

