/**
 * 队伍系统
 * 负责管理队伍和玩家分组
 */
class Team {
    constructor(id, name, color = '#3fb950') {
        this.id = id;
        this.name = name;
        this.color = color;
        this.players = []; // 玩家列表
        this.isAlive = true; // 队伍是否存活
    }

    /**
     * 添加玩家到队伍
     */
    addPlayer(player) {
        if (!this.players.includes(player)) {
            this.players.push(player);
            player.team = this;
        }
    }

    /**
     * 从队伍移除玩家
     */
    removePlayer(player) {
        const index = this.players.indexOf(player);
        if (index !== -1) {
            this.players.splice(index, 1);
            player.team = null;
        }
    }

    /**
     * 检查队伍是否存活（至少有一个玩家存活）
     */
    checkAlive() {
        this.isAlive = this.players.some(player => player.health > 0);
        return this.isAlive;
    }

    /**
     * 获取队伍中存活的玩家
     */
    getAlivePlayers() {
        return this.players.filter(player => player.health > 0);
    }

    /**
     * 获取队伍总生命值
     */
    getTotalHealth() {
        return this.players.reduce((sum, player) => sum + player.health, 0);
    }

    /**
     * 获取队伍最大生命值
     */
    getTotalMaxHealth() {
        return this.players.reduce((sum, player) => sum + player.maxHealth, 0);
    }
}

