/**
 * 显示管理器
 * 负责统一管理所有UI组件的更新
 */
export class DisplayManager {
    constructor(elements, components) {
        this.elements = elements;
        this.components = components;
    }

    /**
     * 更新所有显示
     */
    update(gameState) {
        // 更新生命值
        if (this.components.playerHealthBar) {
            this.components.playerHealthBar.update(gameState.player.health, gameState.player.maxHealth);
        }
        if (this.components.opponentHealthBar) {
            this.components.opponentHealthBar.update(gameState.opponent.health, gameState.opponent.maxHealth);
        }

        // 更新能量显示
        if (this.components.playerManaDisplay) {
            this.components.playerManaDisplay.update(gameState.player.mana, gameState.player.maxMana);
        }
        if (this.components.opponentManaDisplay) {
            this.components.opponentManaDisplay.update(gameState.opponent.mana, gameState.opponent.maxMana);
        }

        // 更新buff显示
        if (this.components.buffRenderer) {
            if (this.elements.playerBuffsEl) {
                this.components.buffRenderer.update(this.elements.playerBuffsEl, gameState.player.buffs);
            }
            if (this.elements.opponentBuffsEl) {
                this.components.buffRenderer.update(this.elements.opponentBuffsEl, gameState.opponent.buffs);
            }
        }

        // 更新手牌（由外部控制，因为需要交互逻辑）
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

