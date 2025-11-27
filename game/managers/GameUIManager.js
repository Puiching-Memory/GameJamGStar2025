/**
 * 游戏UI管理器
 * 负责管理UI更新、动画、tooltip等
 * 合并了 DisplayManager 的功能
 */
class GameUIManager {
    constructor(gameState, elements, components) {
        this.gameState = gameState;
        this.elements = elements;
        this.components = components; // { playerHealthBar, opponentHealthBar, playerManaDisplay, opponentManaDisplay, buffRenderer }
        this.cardRenderer = components.cardRenderer;
        this.animationManager = components.handAnimationManager; // 实际上是 AnimationManager
        this.tooltip = null;
        
        // 多人显示管理器
        this.multiPlayerDisplay = null;
        if (elements.multiPlayerStatusContainer) {
            this.multiPlayerDisplay = new MultiPlayerDisplay(
                elements.multiPlayerStatusContainer,
                components
            );
        }
        
        // 本回合新获得的手牌（用于入场动画）
        this.newPlayerHandCardIds = new Set();
        this.newOpponentHandCardIds = new Set();
        
        // 记录上一次手牌数量，用于判断是否需要播放重排动画
        this.prevPlayerHandSize = 0;
        this.prevOpponentHandSize = 0;
    }

    /**
     * 初始化Tooltip系统
     */
    initializeTooltips() {
        this.tooltip = new Tooltip();

        // 为玩家血量条容器添加tooltip
        const playerHealthWrapper = this.elements.playerHealthEl?.parentElement?.parentElement;
        if (playerHealthWrapper) {
            this.tooltip.attach(playerHealthWrapper, () => {
                const player = this.gameState.player;
                return `💚 生命值\n当前: ${player.health}/${player.maxHealth}\n\n生命值归零时游戏失败`;
            }, { position: 'bottom' });
        }

        // 为对手血量条容器添加tooltip
        const opponentHealthWrapper = this.elements.opponentHealthEl?.parentElement?.parentElement;
        if (opponentHealthWrapper) {
            this.tooltip.attach(opponentHealthWrapper, () => {
                const opponent = this.gameState.opponent;
                return `💚 对手生命值\n当前: ${opponent.health}/${opponent.maxHealth}\n\n将对手生命值降为0即可获胜`;
            }, { position: 'bottom' });
        }

        // 为玩家能量条容器添加tooltip
        const playerManaBar = this.elements.playerManaEl?.parentElement;
        if (playerManaBar) {
            this.tooltip.attach(playerManaBar, () => {
                const player = this.gameState.player;
                return `⚡ 能量值\n当前: ${player.mana}/${player.maxMana}\n\n每回合自动恢复，打出卡牌需要消耗能量`;
            }, { position: 'bottom' });
        }

        // 为对手能量条容器添加tooltip
        const opponentManaBar = this.elements.opponentManaEl?.parentElement;
        if (opponentManaBar) {
            this.tooltip.attach(opponentManaBar, () => {
                const opponent = this.gameState.opponent;
                return `⚡ 对手能量值\n当前: ${opponent.mana}/${opponent.maxMana}\n\n每回合自动恢复`;
            }, { position: 'bottom' });
        }

        // 为回合数添加tooltip
        if (this.elements.turnNumberEl) {
            this.tooltip.attach(this.elements.turnNumberEl, () => {
                return `📊 回合信息\n当前回合: ${this.gameState.turnNumber}\n\n回合数越高，每回合恢复的能量越多`;
            }, { position: 'bottom' });
        }

        // 为Buff容器添加动态tooltip（会在updateDisplay时更新）
        this.setupBuffTooltips();
    }

    /**
     * 设置Buff的tooltip（动态更新）
     */
    setupBuffTooltips() {
        // 使用MutationObserver监听buff容器的变化
        if (this.elements.playerBuffsEl) {
            this.observeBuffContainer(this.elements.playerBuffsEl, 'player');
        }
        if (this.elements.opponentBuffsEl) {
            this.observeBuffContainer(this.elements.opponentBuffsEl, 'opponent');
        }
    }

    /**
     * 监听Buff容器变化并添加tooltip
     */
    observeBuffContainer(container, playerType) {
        const observer = new MutationObserver(() => {
            // 为所有buff项添加tooltip
            const buffItems = container.querySelectorAll('.buff-item');
            buffItems.forEach(buffEl => {
                // 如果已经有tooltip事件监听器，跳过
                if (buffEl.dataset.tooltipAttached) return;

                const buffId = buffEl.dataset.buffId;
                const player = playerType === 'player' ? this.gameState.player : this.gameState.opponent;
                const buff = player.buffs.find(b => b.id === buffId);

                if (buff) {
                    this.tooltip.attach(buffEl, () => {
                        return `${buff.icon} ${buff.name}\n${buff.description}\n剩余回合: ${buff.duration}`;
                    }, { position: 'bottom', delay: 300 });
                    buffEl.dataset.tooltipAttached = 'true';
                }
            });
        });

        observer.observe(container, {
            childList: true,
            subtree: true
        });
    }

    /**
     * 更新回合高亮
     */
    updateTurnHighlight() {
        if (!this.elements.playerHeaderInfo || !this.elements.opponentHeaderInfo) return;

        const currentPlayer = this.gameState.getCurrentPlayer();
        if (currentPlayer && currentPlayer.name === 'player') {
            // 玩家回合：高亮玩家信息区域
            this.elements.playerHeaderInfo.classList.add('active-turn');
            this.elements.opponentHeaderInfo.classList.remove('active-turn');
        } else {
            // 对手回合：高亮对手信息区域
            this.elements.opponentHeaderInfo.classList.add('active-turn');
            this.elements.playerHeaderInfo.classList.remove('active-turn');
        }
    }

    /**
     * 更新回合数显示
     */
    updateTurnNumber() {
        if (this.elements.turnNumberEl) {
            this.elements.turnNumberEl.textContent = `第 ${this.gameState.turnNumber} 回合`;
        }
    }

    /**
     * 更新所有显示（合并自 DisplayManager）
     */
    update(gameState) {
        // 更新原有玩家和对手的显示
        if (this.components.playerHealthBar) {
            this.components.playerHealthBar.update(gameState.player.health, gameState.player.maxHealth);
        }
        if (this.components.opponentHealthBar) {
            this.components.opponentHealthBar.update(gameState.opponent.health, gameState.opponent.maxHealth);
        }

        if (this.components.playerManaDisplay) {
            this.components.playerManaDisplay.update(gameState.player.mana, gameState.player.maxMana);
        }
        if (this.components.opponentManaDisplay) {
            this.components.opponentManaDisplay.update(gameState.opponent.mana, gameState.opponent.maxMana);
        }

        if (this.components.buffRenderer) {
            if (this.elements.playerBuffsEl) {
                this.components.buffRenderer.update(this.elements.playerBuffsEl, gameState.player.buffs);
            }
            if (this.elements.opponentBuffsEl) {
                this.components.buffRenderer.update(this.elements.opponentBuffsEl, gameState.opponent.buffs);
            }
        }

        // 多人模式：更新所有玩家状态栏
        if (this.multiPlayerDisplay) {
            // 如果有自动机器人或额外玩家，更新显示
            const hasAutoBots = gameState.players.some(p => p.isAutoBot);
            const hasExtraPlayers = gameState.players.some(p => 
                p.name !== 'player' && p.name !== 'opponent' && !p.isAutoBot
            );
            
            if (hasAutoBots || hasExtraPlayers) {
                this.multiPlayerDisplay.update(gameState);
            } else {
                // 清除多人状态栏（回到双人模式）
                this.multiPlayerDisplay.clear();
            }
        }
    }

    /**
     * 更新手牌显示（合并自 DisplayManager）
     */
    updateHand(player, hand, cardRenderer, options = {}) {
        const handEl = player === 'player' 
            ? this.elements.playerHandEl 
            : this.elements.opponentHandEl;
        
        if (handEl && cardRenderer) {
            cardRenderer.renderHand(handEl, hand, player, options);
        }
    }

    /**
     * 更新显示
     */
    updateDisplay(cardPlayOptions) {
        this.update(this.gameState);

        // 记录更新前的手牌数量
        const currentPlayerHandSize = this.gameState.player.hand.length;
        const currentOpponentHandSize = this.gameState.opponent.hand.length;

        // 记录对手手牌浮动窗口的旧宽度，用于做平滑尺寸过渡
        let opponentOldWidth = 0;
        if (this.elements.opponentHandEl) {
            opponentOldWidth = this.elements.opponentHandEl.offsetWidth;
        }

        // 更新手牌
        this.updateHand('player', this.gameState.player.hand, this.cardRenderer, {
            enterAnimationCardIds: this.newPlayerHandCardIds,
            ...cardPlayOptions
        });

        this.updateHand('opponent', this.gameState.opponent.hand, this.cardRenderer, {
            draggable: false,
            enterAnimationCardIds: this.newOpponentHandCardIds
        });

        // 手牌渲染完成后，清空"新获得"标记，避免重复播放动画
        this.newPlayerHandCardIds.clear();
        this.newOpponentHandCardIds.clear();

        // 如果手牌数量发生变化，为对应手牌区域添加一次轻微的重排动画
        if (currentPlayerHandSize !== this.prevPlayerHandSize && this.elements.playerHandEl) {
            this.animationManager.triggerHandReflowAnimation(this.elements.playerHandEl);
        }
        if (currentOpponentHandSize !== this.prevOpponentHandSize && this.elements.opponentHandEl) {
            this.animationManager.triggerHandReflowAnimation(this.elements.opponentHandEl);
            this.animationManager.animateOpponentHandResize(this.elements.opponentHandEl, opponentOldWidth);
        }

        // 更新缓存的手牌数量
        this.prevPlayerHandSize = currentPlayerHandSize;
        this.prevOpponentHandSize = currentOpponentHandSize;
    }

    /**
     * 标记新获得的手牌
     */
    markNewCard(player, cardId) {
        if (player === 'player') {
            this.newPlayerHandCardIds.add(cardId);
        } else {
            this.newOpponentHandCardIds.add(cardId);
        }
    }

    /**
     * 显示卡牌详情
     */
    showCardDetails(card) {
        const detailsEl = document.getElementById('card-details');
        if (detailsEl) {
            const typeNames = {
                'attack': '攻击',
                'heal': '治疗',
                'special': '特殊'
            };

            detailsEl.innerHTML = `
                <h2>${card.icon} ${card.name}</h2>
                <p><strong>类型：</strong>${typeNames[card.type] || card.type}</p>
                <p><strong>消耗：</strong>${card.cost} 能量</p>
                ${card.power > 0 ? `<p><strong>威力：</strong>${card.power}</p>` : ''}
                <p><strong>描述：</strong>${card.description}</p>
            `;
            this.elements.cardModal.style.display = 'block';
        }
    }
}

