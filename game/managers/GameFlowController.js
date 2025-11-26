/**
 * 游戏流程控制器
 * 负责管理游戏流程（开始、回合、结束等）
 */
class GameFlowController {
    constructor(gameState, cardFactory, turnManager, ai, components) {
        this.gameState = gameState;
        this.cardFactory = cardFactory;
        this.turnManager = turnManager;
        this.ai = ai;
        this.components = components; // { uiManager, cardPlayManager, cardAnimation, logSystem }
    }

    /**
     * 开始游戏
     */
    startGame() {
        this.gameState.reset();
        this.gameState.gameStarted = true;

        // 关闭游戏结束对话框（如果打开）
        if (this.components.elements.gameOverModal) {
            this.components.elements.gameOverModal.style.display = 'none';
        }

        // 初始化卡组
        this.gameState.player.deck = this.cardFactory.getRandomCards(20);
        this.gameState.opponent.deck = this.cardFactory.getRandomCards(20);

        // 初始手牌
        this.gameState.player.hand = this.cardFactory.getRandomCards(5);
        this.gameState.opponent.hand = this.cardFactory.getRandomCards(5);

        // 标记初始手牌为"新获得"，用于首回合入场动画
        this.gameState.player.hand.forEach(card => {
            this.components.uiManager.markNewCard('player', card.id);
        });

        // 清空已打出的卡牌
        if (this.components.elements.playedCardsContainer) {
            this.components.elements.playedCardsContainer.innerHTML = '';
        }

        // 清除高亮
        this.components.cardAnimation.clearTurnHighlights(this.gameState.currentTurnCards);

        this.components.elements.startBtn.disabled = true;
        this.components.elements.endTurnBtn.disabled = false;

        // 更新回合高亮
        this.components.uiManager.updateTurnHighlight();

        // 更新回合数显示
        this.components.uiManager.updateTurnNumber();

        this.components.uiManager.updateDisplay(
            this.components.getCardPlayOptions ? this.components.getCardPlayOptions() : undefined
        );
        this.components.logSystem.addLog('游戏开始！', 'game');
        this.components.logSystem.addLog('你的回合！', 'player');
    }

    /**
     * 结束回合
     */
    endTurn() {
        if (this.gameState.turn !== 'player' || !this.gameState.gameStarted) return;

        // 传递日志回调函数，用于记录buff效果
        this.turnManager.endTurn((message, source) => {
            if (this.components.logSystem) {
                this.components.logSystem.addLog(message, source);
            }
        });
        this.components.elements.endTurnBtn.disabled = true;
        this.components.logSystem.addLog('对手的回合！', 'opponent');

        // 更新回合高亮
        this.components.uiManager.updateTurnHighlight();

        // 立即更新能量显示和对手手牌（确保显示同步）
        this.components.displayManager.update(this.gameState);
        this.components.displayManager.updateHand('opponent', this.gameState.opponent.hand, this.components.cardRenderer, {
            draggable: false
        });

        // 对手回合
        setTimeout(() => {
            this.opponentTurn();
        }, 1000);
    }

    /**
     * 对手回合
     */
    opponentTurn() {
        // 清除上一回合的卡牌高亮
        this.components.cardAnimation.clearTurnHighlights(this.gameState.currentTurnCards);

        // 处理场上卡牌的透明度和删除（每回合执行）
        this.processPlayedCardsFade();

        // 对手回合开始时抽一张牌（与玩家一致）
        {
            const newCard = this.cardFactory.getRandomCard();
            if (this.gameState.opponent.drawCard(newCard)) {
                this.components.uiManager.markNewCard('opponent', newCard.id);
            }
        }
        
        // 立即更新显示，确保抽牌效果可见（同步更新）
        // 对手回合不需要玩家卡牌交互选项，只需更新显示
        this.components.uiManager.updateDisplay();
        
        // 确保对手手牌已更新（显式更新）
        this.components.displayManager.updateHand('opponent', this.gameState.opponent.hand, this.components.cardRenderer, {
            draggable: false
        });

        // 对手AI：尽可能打光能量
        const cardsToPlay = this.ai.selectCardsToPlay();

        // 计算总延迟时间（每张牌800ms + 额外缓冲）
        const totalDelay = cardsToPlay.length * 800 + 1000;

        // 按顺序出牌
        if (cardsToPlay.length > 0) {
            this.components.cardPlayManager.playOpponentCardSequence(
                cardsToPlay, 
                0, 
                () => this.components.uiManager.updateDisplay()
            );
        }

        // 结束对手回合，开始玩家回合
        setTimeout(() => {
            this.startPlayerTurn();
        }, totalDelay);
    }

    /**
     * 开始玩家回合
     */
    startPlayerTurn() {
        // 传递日志回调函数，用于记录buff效果
        this.turnManager.startPlayerTurn((message, source) => {
            if (this.components.logSystem) {
                this.components.logSystem.addLog(message, source);
            }
        });
        // 玩家回合开始时增加回合数
        this.gameState.turnNumber++;
        this.components.uiManager.updateTurnNumber();
        {
            const newCard = this.cardFactory.getRandomCard();
            if (this.gameState.player.drawCard(newCard)) {
                this.components.uiManager.markNewCard('player', newCard.id);
            }
        }
        this.components.elements.endTurnBtn.disabled = false;
        this.components.logSystem.addLog('你的回合！', 'player');

        // 清除上一回合的卡牌高亮
        this.components.cardAnimation.clearTurnHighlights(this.gameState.currentTurnCards);

        // 处理场上卡牌的透明度和删除
        this.processPlayedCardsFade();

        // 更新回合高亮
        this.components.uiManager.updateTurnHighlight();

        this.components.uiManager.updateDisplay(
            this.components.getCardPlayOptions ? this.components.getCardPlayOptions() : undefined
        );
        this.checkGameOver();
    }

    /**
     * 检查是否自动结束回合
     */
    checkAutoEndTurn() {
        if (this.turnManager.canAutoEndTurn()) {
            if (this.gameState.player.hand.length > 0) {
                this.components.logSystem.addLog(`剩余能量(${this.gameState.player.mana})不足以打出任何卡牌，自动结束回合！`, 'system');
            } else {
                this.components.logSystem.addLog('手牌已空，自动结束回合！', 'system');
            }

            setTimeout(() => {
                if (this.turnManager.canAutoEndTurn()) {
                    this.endTurn();
                }
            }, 1500);
        }
    }

    /**
     * 检查游戏结束
     */
    checkGameOver() {
        const winner = this.gameState.checkGameOver();
        if (winner === 'opponent') {
            this.components.logSystem.addLog('你被击败了！游戏结束！', 'game');
            this.gameOver('opponent');
        } else if (winner === 'player') {
            this.components.logSystem.addLog('你获胜了！恭喜！', 'game');
            this.gameOver('player');
        }
    }

    /**
     * 游戏结束
     */
    gameOver(winner) {
        this.gameState.gameStarted = false;
        this.components.elements.endTurnBtn.disabled = true;
        this.components.elements.startBtn.disabled = false;
        this.components.elements.startBtn.textContent = '重新开始';

        // 显示游戏结束对话框
        if (this.components.elements.gameOverModal) {
            if (winner === 'player') {
                // 玩家获胜
                this.components.elements.gameOverIcon.textContent = '🎉';
                this.components.elements.gameOverTitle.textContent = '恭喜获胜！';
                this.components.elements.gameOverMessage.textContent = '你成功击败了对手！';
                this.components.elements.gameOverModal.classList.add('victory');
                this.components.elements.gameOverModal.classList.remove('defeat');
            } else if (winner === 'opponent') {
                // 对手获胜
                this.components.elements.gameOverIcon.textContent = '💀';
                this.components.elements.gameOverTitle.textContent = '游戏结束';
                this.components.elements.gameOverMessage.textContent = '你被击败了，再接再厉！';
                this.components.elements.gameOverModal.classList.add('defeat');
                this.components.elements.gameOverModal.classList.remove('victory');
            }
            this.components.elements.gameOverModal.style.display = 'block';
        }
    }

    /**
     * 处理场上卡牌的透明度和删除
     * 每回合降低透明度和颜色饱和度，按生命周期删除卡牌
     */
    processPlayedCardsFade() {
        if (!this.components.elements.playedCardsContainer) {
            return;
        }

        const playedCards = Array.from(this.components.elements.playedCardsContainer.children);
        const opacityDecrease = 0.15; // 每回合降低的透明度
        const saturationDecrease = 0.15; // 每回合降低的颜色饱和度
        const fadeOutDuration = 500; // 淡出动画时长（毫秒）

        // 需要删除的卡牌列表
        const cardsToRemove = [];

        // 降低所有卡牌的透明度、颜色饱和度和生命周期
        playedCards.forEach(cardEl => {
            // 获取当前透明度，如果没有则默认为1
            let currentOpacity = parseFloat(cardEl.style.opacity) || 1;
            // 获取当前颜色饱和度，如果没有则默认为1
            let currentSaturation = parseFloat(cardEl.dataset.saturation) || 1;
            // 获取当前生命周期，如果没有则默认为初始值
            let lifetime = parseFloat(cardEl.dataset.lifetime) || 8;
            
            // 降低生命周期
            lifetime = lifetime - 1;
            cardEl.dataset.lifetime = lifetime.toString();

            // 如果生命周期<=0，先播放淡出动画，然后删除
            if (lifetime <= 0) {
                // 将透明度和饱和度设置为0，触发过渡动画
                cardEl.style.opacity = '0';
                cardEl.style.filter = 'saturate(0)';
                cardEl.dataset.opacity = '0';
                cardEl.dataset.saturation = '0';
                
                // 标记为待删除
                cardsToRemove.push(cardEl);
            } else {
                // 正常降低透明度和饱和度
                currentOpacity = Math.max(0, currentOpacity - opacityDecrease);
                currentSaturation = Math.max(0, currentSaturation - saturationDecrease);
                
                cardEl.style.opacity = currentOpacity;
                cardEl.dataset.opacity = currentOpacity.toString();
                cardEl.style.filter = `saturate(${currentSaturation})`;
                cardEl.dataset.saturation = currentSaturation.toString();
            }
        });

        // 等待过渡动画完成后删除生命周期已耗尽的卡牌
        if (cardsToRemove.length > 0) {
            setTimeout(() => {
                cardsToRemove.forEach(cardEl => {
                    if (cardEl && cardEl.parentNode) {
                        cardEl.remove();
                    }
                });
            }, fadeOutDuration);
        }
    }
}

