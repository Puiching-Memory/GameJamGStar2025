/**
 * 玩家状态栏组件
 * 用于显示单个玩家的状态（生命值、能量、buff等）
 */
class PlayerStatusBar {
    constructor(player, container, components) {
        this.player = player;
        this.container = container;
        this.components = components;
        this.elements = this.createElements();
        this.update();
    }

    /**
     * 创建DOM元素
     */
    createElements() {
        const statusBar = document.createElement('div');
        statusBar.className = 'player-status-bar';
        statusBar.dataset.playerId = this.player.name;
        
        // 如果是自动机器人，添加特殊样式
        if (this.player.isAutoBot) {
            statusBar.classList.add('auto-bot-status');
            statusBar.dataset.botType = this.player.autoBotType;
        }
        
        // 如果有队伍，添加队伍颜色边框
        if (this.player.team) {
            statusBar.style.borderLeft = `4px solid ${this.player.team.color}`;
        }

        const playerName = document.createElement('div');
        playerName.className = 'player-name';
        let nameIcon = '👤';
        if (this.player.isAutoBot) {
            nameIcon = this.player.autoBotType === 'github-action' ? '🔄' : '🤖';
        } else if (this.player.isAI) {
            nameIcon = '🤖';
        }
        playerName.textContent = `${nameIcon} ${this.getDisplayName()}`;
        
        // 如果是自动机器人，添加剩余回合数显示
        let turnsRemainingEl = null;
        if (this.player.isAutoBot) {
            turnsRemainingEl = document.createElement('div');
            turnsRemainingEl.className = 'auto-bot-turns-remaining';
            turnsRemainingEl.id = `turns-remaining-${this.player.name}`;
        }

        const statsContainer = document.createElement('div');
        statsContainer.className = 'stats-container';

        // 如果是自动机器人，不显示血条和能量条
        let healthBarInstance = null;
        let manaDisplayInstance = null;
        
        if (!this.player.isAutoBot) {
            // 生命值条
            const healthWrapper = document.createElement('div');
            healthWrapper.className = 'health-bar-wrapper';
            const healthBar = document.createElement('div');
            healthBar.className = 'health-bar';
            const healthFill = document.createElement('div');
            healthFill.className = 'health-fill';
            healthFill.id = `health-${this.player.name}`;
            const healthText = document.createElement('span');
            healthText.className = 'health-text';
            healthText.id = `health-text-${this.player.name}`;
            healthBar.appendChild(healthFill);
            healthBar.appendChild(healthText);
            healthWrapper.appendChild(healthBar);

            // 能量条
            const manaBar = document.createElement('div');
            manaBar.className = 'mana-bar';
            const manaFill = document.createElement('div');
            manaFill.className = 'mana-fill';
            manaFill.id = `mana-${this.player.name}`;
            const manaText = document.createElement('span');
            manaText.className = 'mana-text';
            manaText.id = `mana-text-${this.player.name}`;
            manaBar.appendChild(manaFill);
            manaBar.appendChild(manaText);

            statsContainer.appendChild(healthWrapper);
            statsContainer.appendChild(manaBar);

            // 创建HealthBar和ManaDisplay实例
            healthBarInstance = new HealthBar(healthFill, healthText);
            manaDisplayInstance = new ManaDisplay(manaFill, manaText);
        }

        // Buff容器
        const buffsContainer = document.createElement('div');
        buffsContainer.className = 'buffs-container';
        buffsContainer.id = `buffs-${this.player.name}`;

        statusBar.appendChild(playerName);
        // 如果是自动机器人，不添加statsContainer，但添加剩余回合数
        if (!this.player.isAutoBot) {
            statusBar.appendChild(statsContainer);
        } else if (turnsRemainingEl) {
            statusBar.appendChild(turnsRemainingEl);
        }
        statusBar.appendChild(buffsContainer);

        this.container.appendChild(statusBar);

        return {
            statusBar,
            playerName,
            statsContainer: this.player.isAutoBot ? null : statsContainer,
            healthBar: healthBarInstance,
            manaDisplay: manaDisplayInstance,
            buffsContainer,
            turnsRemainingEl: turnsRemainingEl
        };
    }

    /**
     * 获取显示名称
     */
    getDisplayName() {
        if (this.player.isAutoBot) {
            return this.player.autoBotType === 'github-action' ? 'GitHub Action' : 'CL自动机器人';
        }
        if (this.player.name === 'player') {
            return '你';
        }
        if (this.player.name === 'opponent') {
            return '对手';
        }
        return this.player.name;
    }

    /**
     * 更新显示
     */
    update() {
        // 更新生命值
        if (this.elements.healthBar) {
            this.elements.healthBar.update(this.player.health, this.player.maxHealth);
        }

        // 更新能量
        if (this.elements.manaDisplay) {
            this.elements.manaDisplay.update(this.player.mana, this.player.maxMana);
        }

        // 更新自动机器人的剩余回合数
        if (this.player.isAutoBot && this.elements.turnsRemainingEl) {
            const remaining = this.player.autoBotTurnsRemaining !== undefined 
                ? this.player.autoBotTurnsRemaining 
                : 0;
            this.elements.turnsRemainingEl.textContent = `剩余 ${remaining} 回合`;
        }

        // 更新buff
        if (this.components.buffRenderer && this.elements.buffsContainer) {
            this.components.buffRenderer.update(this.elements.buffsContainer, this.player.buffs);
        }

        // 更新当前回合高亮
        if (this.elements.statusBar) {
            // 这里需要从gameState获取当前回合玩家
            // 暂时移除，由外部控制
        }
    }

    /**
     * 设置是否为当前回合
     */
    setCurrentTurn(isCurrent) {
        if (this.elements.statusBar) {
            if (isCurrent) {
                this.elements.statusBar.classList.add('current-turn');
            } else {
                this.elements.statusBar.classList.remove('current-turn');
            }
        }
    }

    /**
     * 销毁
     */
    destroy() {
        if (this.elements.statusBar && this.elements.statusBar.parentNode) {
            this.elements.statusBar.parentNode.removeChild(this.elements.statusBar);
        }
    }
}

