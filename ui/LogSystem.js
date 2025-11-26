/**
 * 日志系统
 * 负责管理游戏日志显示
 */
class LogSystem {
    constructor(container) {
        this.container = container;
    }

    /**
     * 添加日志消息
     */
    addLog(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'danmaku-item';
        messageEl.textContent = message;

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
    }
}

