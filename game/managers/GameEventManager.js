/**
 * 游戏事件管理器
 * 负责管理游戏事件监听和处理
 */
class GameEventManager {
    constructor(gameState, components) {
        this.gameState = gameState;
        this.components = components; // { comboBuffHandler, forcedDiscardHandler }
        this.setupEventListeners();
    }

    /**
     * 设置游戏事件监听器
     */
    setupEventListeners() {
        if (!this.gameState || !this.gameState.eventSystem) {
            return;
        }

        // 监听抽牌事件，用于触发手牌动画
        this.gameState.eventSystem.on('card:drawn', (data) => {
            if (this.components.onCardDrawn) {
                this.components.onCardDrawn(data);
            }
        });

        // 监听卡牌使用事件，用于触发连击buff
        this.gameState.eventSystem.on('card:played', (data) => {
            if (this.components.onCardPlayed) {
                this.components.onCardPlayed(data);
            }
        });

        // 监听玩家扣血事件，用于触发屏幕红色闪烁
        this.gameState.eventSystem.on('player:damage', (data) => {
            if (this.components.onPlayerDamage && data.player === 'player' && data.damage > 0) {
                this.components.onPlayerDamage(data);
            }
        });

        // 监听玩家治疗事件，用于触发屏幕绿色闪烁
        this.gameState.eventSystem.on('player:heal', (data) => {
            if (this.components.onPlayerHeal && data.player === 'player' && data.heal > 0) {
                this.components.onPlayerHeal(data);
            }
        });

        // 监听卡牌移除事件，将被强制拆下的卡牌也放到牌堆中
        this.gameState.eventSystem.on('card:removed', (data) => {
            if (this.components.onCardRemoved && data.isForcedDiscard && data.card) {
                this.components.onCardRemoved(data);
            }
        });
    }
}

