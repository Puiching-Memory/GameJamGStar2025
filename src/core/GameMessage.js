/**
 * 游戏消息数据模型
 * 负责管理游戏消息的数据结构
 */
export class GameMessage {
    constructor(data) {
        this.id = data.id || 'msg_' + Date.now() + '_' + Math.random();
        this.message = data.message;
        this.source = data.source || 'system'; // 'player', 'opponent', 'system', 'game'
        this.timestamp = data.timestamp || Date.now();
        this.icon = data.icon || this.getDefaultIcon();
        this.color = data.color || this.getDefaultColor();
    }

    /**
     * 根据来源获取默认图标
     */
    getDefaultIcon() {
        const icons = {
            'player': '👤',
            'opponent': '🤖',
            'system': '⚙️',
            'game': '🎮',
            'commentator': '🎙️'
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
            'game': '#fbbf24', // 金色
            'commentator': '#8a2be2' // 紫色（AI解说）
        };
        return colors[this.source] || '#ffffff';
    }

    /**
     * 获取消息的显示文本
     */
    getDisplayText() {
        return `${this.icon} ${this.message}`;
    }
}

