/**
 * 卡牌打出管理器
 * 负责管理卡牌打出的相关逻辑
 */
class CardPlayManager {
    constructor(gameState, cardEffect, cardAnimation, cardRenderer, logSystem, handAnimationManager) {
        this.gameState = gameState;
        this.cardEffect = cardEffect;
        this.cardAnimation = cardAnimation;
        this.cardRenderer = cardRenderer;
        this.logSystem = logSystem;
        this.handAnimationManager = handAnimationManager;
    }

    /**
     * 检查卡牌是否禁用
     */
    isCardDisabled(card) {
        if (!card || !card.cost) return true;
        const currentPlayer = this.gameState.getCurrentPlayer();
        if (!currentPlayer || currentPlayer.name !== 'player') return true;
        if (!this.gameState.gameStarted) return true;
        if (this.gameState.player.mana < card.cost) return true;
        
        // 检查自动机器人卡牌：如果已存在相同类型的自动机器人，则禁用
        // 使用 baseId 或从 id 中提取基础ID
        const baseId = card.baseId || (card.id ? card.id.split('_')[0] : '');
        if (baseId === 'github-action' || baseId === 'cl-bot') {
            const botType = baseId;
            if (this.gameState.hasAutoBotOfType(botType, this.gameState.player)) {
                return true; // 已存在相同类型的自动机器人，禁用该卡牌
            }
        }
        
        return false;
    }

    /**
     * 打出卡牌
     */
    playCard(card, onComplete) {
        const currentPlayer = this.gameState.getCurrentPlayer();
        if (!currentPlayer || currentPlayer.name !== 'player' || !this.gameState.gameStarted) return;
        if (this.gameState.player.mana < card.cost) {
            this.logSystem.addLog({
                userMessage: '能量不足！',
                devMessage: `[CardPlay] 能量不足 | Card: ${card.name} | Cost: ${card.cost} | Current Mana: ${this.gameState.player.mana}/${this.gameState.player.maxMana}`
            }, 'system');
            return;
        }

        try {
            // 消耗能量
            this.gameState.player.consumeMana(card.cost);

            // 先触发手牌退出动画（如果有对应DOM），等动画结束后再重新排列手牌
            const exitPromise = this.handAnimationManager.playHandCardExitAnimation('player', card.id);

            // 从手牌移除（游戏状态）
            this.gameState.player.removeCard(card.id);

            // 执行卡牌效果
            const target = this.cardEffect.determineTarget(card, 'player');
            this.cardEffect.execute(card, target, 'player');

            // 记录卡牌打出历史
            this.gameState.recordCardPlay(card, 'player', this.gameState.turnNumber);

            // 播放出牌动画
            this.cardAnimation.animateCardPlay(
                card,
                'player',
                this.cardRenderer,
                this.gameState.currentTurnCards
            );

            // 等退出动画结束后，再更新显示和自动结束回合逻辑
            exitPromise.then(() => {
                // 触发背景 GitGraph 更新事件
                if (this.gameState.eventSystem) {
                    this.gameState.eventSystem.emit('gitgraph:update');
                }
                if (onComplete) {
                    onComplete();
                }
            }).catch((error) => {
                console.error('出牌动画处理错误:', error);
                // 触发背景 GitGraph 更新事件
                if (this.gameState.eventSystem) {
                    this.gameState.eventSystem.emit('gitgraph:update');
                }
                if (onComplete) {
                    onComplete();
                }
            });
        } catch (error) {
            console.error(`打出卡牌 ${card.name} 时发生错误:`, error);
            this.logSystem.addLog({
                userMessage: `打出卡牌 ${card.name} 失败！`,
                devMessage: `[Error] 打出卡牌失败 | Card: ${card.name} | Error: ${error.message || error.toString()} | Stack: ${error.stack || 'N/A'}`
            }, 'system');
            if (onComplete) {
                onComplete();
            }
        }
    }

    /**
     * 对手出牌序列
     */
    playOpponentCardSequence(cards, index, onCardComplete) {
        if (index >= cards.length) {
            return;
        }

        const card = cards[index];
        const cardIndex = this.gameState.opponent.hand.findIndex(c => c.id === card.id);

        if (cardIndex !== -1) {
            try {
                // 在状态更新前，为对手手牌添加退出动画，并在动画结束后再更新对手手牌排列
                const exitPromise = this.handAnimationManager.playHandCardExitAnimation('opponent', card.id);

                // 消耗能量
                this.gameState.opponent.consumeMana(card.cost);

                // 从手牌移除
                this.gameState.opponent.removeCard(card.id);

                // 执行卡牌效果
                const target = this.cardEffect.determineTarget(card, 'opponent');
                this.cardEffect.execute(card, target, 'opponent');

                // 记录卡牌打出历史
                this.gameState.recordCardPlay(card, 'opponent', this.gameState.turnNumber);

                // 播放出牌动画
                this.cardAnimation.animateCardPlay(
                    card,
                    'opponent',
                    this.cardRenderer,
                    this.gameState.currentTurnCards
                );

                // 等退出动画结束后再更新界面，并按原有节奏继续出下一张牌
                exitPromise.then(() => {
                    // 触发背景 GitGraph 更新事件
                    if (this.gameState.eventSystem) {
                        this.gameState.eventSystem.emit('gitgraph:update');
                    }
                    if (onCardComplete) {
                        onCardComplete();
                    }
                    setTimeout(() => {
                        this.playOpponentCardSequence(cards, index + 1, onCardComplete);
                    }, 800);
                }).catch((error) => {
                    console.error('对手出牌动画处理错误:', error);
                    // 触发背景 GitGraph 更新事件
                    if (this.gameState.eventSystem) {
                        this.gameState.eventSystem.emit('gitgraph:update');
                    }
                    if (onCardComplete) {
                        onCardComplete();
                    }
                    setTimeout(() => {
                        this.playOpponentCardSequence(cards, index + 1, onCardComplete);
                    }, 800);
                });
            } catch (error) {
                console.error(`对手打出卡牌 ${card.name} 时发生错误:`, error);
                if (onCardComplete) {
                    onCardComplete();
                }
                setTimeout(() => {
                    this.playOpponentCardSequence(cards, index + 1, onCardComplete);
                }, 800);
            }
        } else {
            // 如果卡牌不在手牌中，继续下一张
            setTimeout(() => {
                this.playOpponentCardSequence(cards, index + 1, onCardComplete);
            }, 800);
        }
    }

    /**
     * 将被强制拆下的卡牌添加到牌堆中
     * @param {Card} card - 被强制拆下的卡牌
     * @param {string} player - 卡牌所属玩家 ('player' 或 'opponent')
     * @param {HTMLElement} playedCardsContainer - 牌堆容器
     */
    addForcedDiscardCardToPile(card, player, playedCardsContainer) {
        if (!card || !this.cardAnimation || !this.cardRenderer) {
            return;
        }

        // 创建已打出的卡牌元素，并标记为强制拆下
        const position = this.cardAnimation.generateRandomCardPosition();
        const playedCardEl = this.cardRenderer.createPlayedCardElement(card, player);
        
        // 添加强制拆下的特殊标记
        playedCardEl.classList.add('forced-discard-card');
        playedCardEl.dataset.discardType = 'forced';
        
        playedCardEl.style.position = 'absolute';
        playedCardEl.style.left = `${position.x}px`;
        playedCardEl.style.top = `${position.y}px`;
        playedCardEl.style.setProperty('--card-rotation', `${position.rotation}deg`);

        // 添加到当前回合卡牌列表
        playedCardEl.classList.add('current-turn-card');
        this.gameState.currentTurnCards.forEach(card => {
            card.classList.remove('last-played-card');
        });
        playedCardEl.classList.add('last-played-card');
        this.gameState.currentTurnCards.push(playedCardEl);

        // 为新创建的场上卡牌添加入场动画
        playedCardEl.classList.add('played-card-enter');
        playedCardEl.addEventListener(
            'animationend',
            () => {
                playedCardEl.classList.remove('played-card-enter');
            },
            { once: true }
        );

        if (playedCardsContainer) {
            playedCardsContainer.appendChild(playedCardEl);
        }
    }
}

