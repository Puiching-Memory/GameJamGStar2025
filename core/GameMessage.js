/**
 * 游戏消息数据模型
 * 负责管理游戏消息的数据结构
 * 支持用户友好消息（弹幕）和开发者友好消息（日志）
 */
class GameMessage {
    constructor(data) {
        this.id = data.id || 'msg_' + Date.now() + '_' + Math.random();
        this.source = data.source || 'system'; // 'player', 'opponent', 'system', 'game'
        this.timestamp = data.timestamp || Date.now();
        this.icon = data.icon || this.getDefaultIcon();
        this.color = data.color || this.getDefaultColor();
        
        // 支持两种消息格式：
        // - userMessage: 用户友好的消息（用于弹幕显示）
        // - devMessage: 开发者友好的消息（用于日志显示）
        // 如果只提供了 message，则同时用作两种消息（向后兼容）
        if (data.userMessage !== undefined || data.devMessage !== undefined) {
            this.userMessage = data.userMessage || data.message || '';
            this.devMessage = data.devMessage || data.message || '';
        } else {
            // 向后兼容：如果只提供了 message，同时用作两种消息
            this.userMessage = data.message || '';
            this.devMessage = data.message || '';
        }
    }

    /**
     * 根据来源获取默认图标
     */
    getDefaultIcon() {
        const icons = {
            'player': '👤',
            'opponent': '🤖',
            'system': '⚙️',
            'game': '🎮'
        };
        return icons[this.source] || '📢';
    }

    /**
     * 根据来源获取默认颜色
     */
    getDefaultColor() {
        const colors = {
            'player': '#4facfe', // 蓝色
            'opponent': '#f5576c', // 红色
            'system': '#667eea', // 紫色
            'game': '#fbbf24' // 金色
        };
        return colors[this.source] || '#ffffff';
    }

    /**
     * 获取用户友好的显示文本（用于弹幕）
     */
    getUserDisplayText() {
        const message = this.userMessage || this.devMessage || '';
        return `${this.icon} ${message}`;
    }

    /**
     * 获取开发者友好的显示文本（用于日志）
     */
    getDevDisplayText() {
        const message = this.devMessage || this.userMessage || '';
        return `${this.icon} ${message}`;
    }

    /**
     * 获取消息的显示文本（向后兼容，默认返回用户友好消息）
     */
    getDisplayText() {
        return this.getUserDisplayText();
    }
}

