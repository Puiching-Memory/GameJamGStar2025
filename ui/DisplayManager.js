/**
 * 显示管理器
 * 负责统一管理所有UI组件的更新
 * 支持多人对战和自动机器人显示
 */
class DisplayManager {
    constructor(elements, components) {
        this.elements = elements;
        this.components = components;
        
        // 多人显示管理器
        this.multiPlayerDisplay = null;
        if (elements.multiPlayerStatusContainer) {
            this.multiPlayerDisplay = new MultiPlayerDisplay(
                elements.multiPlayerStatusContainer,
                components
            );
        }
    }

    /**
     * 更新所有显示
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
     * 更新手牌显示
     */
    updateHand(player, hand, cardRenderer, options = {}) {
        const handEl = player === 'player' 
            ? this.elements.playerHandEl 
            : this.elements.opponentHandEl;
        
        if (handEl && cardRenderer) {
            cardRenderer.renderHand(handEl, hand, player, options);
        }
    }
}

