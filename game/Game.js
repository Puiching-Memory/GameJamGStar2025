/**
 * 主游戏类
 * 使用组合模式整合所有模块
 */
class Game {
    constructor() {
        // 核心模块
        this.gameState = new GameState();
        this.cardFactory = new CardFactory();

        // 游戏逻辑模块
        this.cardEffect = new CardEffect(this.gameState, null); // logSystem稍后设置
        this.turnManager = new TurnManager(this.gameState, this.cardFactory);
        this.ai = new AI(this.gameState, this.cardFactory);

        // UI模块
        this.animationSystem = new AnimationSystem();
        this.logSystem = null; // 稍后初始化
        this.cardRenderer = new CardRenderer(this.animationSystem);
        this.displayManager = null; // 稍后初始化
        this.cardAnimation = null; // 稍后初始化

        // 交互模块
        this.dragDrop = null; // 稍后初始化

        // 拖拽状态
        this.draggedCard = null;

        // UI元素引用
        this.elements = {};

        // 初始化
        this.initializeElements();
        this.initializeComponents();
        this.setupEventListeners();
    }

    /**
     * 初始化DOM元素引用
     */
    initializeElements() {
        this.elements = {
            playerHealthEl: document.getElementById('player-health'),
            playerHealthTextEl: document.getElementById('player-health-text'),
            opponentHealthEl: document.getElementById('opponent-health'),
            opponentHealthTextEl: document.getElementById('opponent-health-text'),
            playerHandEl: document.getElementById('player-hand'),
            opponentHandEl: document.getElementById('opponent-hand'),
            danmakuContainer: document.getElementById('danmaku-container'),
            startBtn: document.getElementById('start-game-btn'),
            endTurnBtn: document.getElementById('end-turn-btn'),
            playerManaEl: document.getElementById('player-mana'),
            playerManaTextEl: document.getElementById('player-mana-text'),
            opponentManaEl: document.getElementById('opponent-mana'),
            opponentManaTextEl: document.getElementById('opponent-mana-text'),
            cardModal: document.getElementById('card-modal'),
            dropZone: document.getElementById('drop-zone'),
            playedCardsContainer: document.getElementById('played-cards-container'),
            dropZoneHint: document.getElementById('drop-zone-hint'),
            gameOverModal: document.getElementById('game-over-modal'),
            gameOverIcon: document.getElementById('game-over-icon'),
            gameOverTitle: document.getElementById('game-over-title'),
            gameOverMessage: document.getElementById('game-over-message'),
            gameOverCloseBtn: document.getElementById('game-over-close-btn'),
            playerHeaderInfo: document.querySelector('.player-header-info'),
            opponentHeaderInfo: document.querySelector('.opponent-header-info'),
            turnNumberEl: document.getElementById('turn-number')
        };
    }

    /**
     * 初始化组件
     */
    initializeComponents() {
        // 日志系统
        this.logSystem = new LogSystem(this.elements.danmakuContainer);
        this.cardEffect.logSystem = this.logSystem;

        // 生命值条
        const playerHealthBar = new HealthBar(
            this.elements.playerHealthEl,
            this.elements.playerHealthTextEl
        );
        const opponentHealthBar = new HealthBar(
            this.elements.opponentHealthEl,
            this.elements.opponentHealthTextEl
        );

        // 能量显示
        const playerManaDisplay = new ManaDisplay(
            this.elements.playerManaEl,
            this.elements.playerManaTextEl
        );
        const opponentManaDisplay = new ManaDisplay(
            this.elements.opponentManaEl,
            this.elements.opponentManaTextEl
        );

        // 显示管理器
        this.displayManager = new DisplayManager(this.elements, {
            playerHealthBar,
            opponentHealthBar,
            playerManaDisplay,
            opponentManaDisplay
        });

        // 卡牌动画
        this.cardAnimation = new CardAnimation(
            this.animationSystem,
            this.elements.dropZone,
            this.elements.playedCardsContainer,
            this.elements.dropZoneHint
        );

        // 拖拽处理
        this.dragDrop = new DragDrop(this.elements.dropZone, {
            onDrop: (e) => {
                if (this.draggedCard && this.gameState.turn === 'player' && this.gameState.gameStarted) {
                    this.playCard(this.draggedCard);
                    this.draggedCard = null;
                }
            }
        });
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.startGame());
        this.elements.endTurnBtn.addEventListener('click', () => this.endTurn());

        // 关闭卡牌详情模态框
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.elements.cardModal.style.display = 'none';
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target === this.elements.cardModal) {
                this.elements.cardModal.style.display = 'none';
            }
        });

        // 关闭游戏结束对话框（只能通过确定按钮关闭）
        if (this.elements.gameOverCloseBtn) {
            this.elements.gameOverCloseBtn.addEventListener('click', () => {
                if (this.elements.gameOverModal) {
                    this.elements.gameOverModal.style.display = 'none';
                }
            });
        }
    }

    /**
     * 开始游戏
     */
    startGame() {
        this.gameState.reset();
        this.gameState.gameStarted = true;

        // 关闭游戏结束对话框（如果打开）
        if (this.elements.gameOverModal) {
            this.elements.gameOverModal.style.display = 'none';
        }

        // 初始化卡组
        this.gameState.player.deck = this.cardFactory.getRandomCards(20);
        this.gameState.opponent.deck = this.cardFactory.getRandomCards(20);

        // 初始手牌
        this.gameState.player.hand = this.cardFactory.getRandomCards(5);
        this.gameState.opponent.hand = this.cardFactory.getRandomCards(5);

        // 清空已打出的卡牌
        if (this.elements.playedCardsContainer) {
            this.elements.playedCardsContainer.innerHTML = '';
        }

        // 清除高亮
        this.cardAnimation.clearTurnHighlights(this.gameState.currentTurnCards);

        this.elements.startBtn.disabled = true;
        this.elements.endTurnBtn.disabled = false;

        // 更新回合高亮
        this.updateTurnHighlight();

        // 更新回合数显示
        this.updateTurnNumber();

        this.updateDisplay();
        this.logSystem.addLog('🎮 游戏开始！');
        this.logSystem.addLog('👤 你的回合！');
    }

    /**
     * 更新回合高亮
     */
    updateTurnHighlight() {
        if (!this.elements.playerHeaderInfo || !this.elements.opponentHeaderInfo) return;

        if (this.gameState.turn === 'player') {
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
     * 更新显示
     */
    updateDisplay() {
        this.displayManager.update(this.gameState);

        // 更新手牌
        this.displayManager.updateHand('player', this.gameState.player.hand, this.cardRenderer, {
            isCardDisabled: (card) => this.isCardDisabled(card),
            onCardClick: (card) => this.playCard(card),
            onCardDoubleClick: (card) => this.showCardDetails(card),
            onDragStart: (e, card) => {
                this.draggedCard = card;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', card.id);
            },
            onDragEnd: () => {
                this.draggedCard = null;
            },
            canDrag: (card) => {
                return this.gameState.turn === 'player' && 
                       this.gameState.gameStarted && 
                       !this.isCardDisabled(card);
            }
        });

        this.displayManager.updateHand('opponent', this.gameState.opponent.hand, this.cardRenderer, {
            draggable: false
        });
    }

    /**
     * 检查卡牌是否禁用
     */
    isCardDisabled(card) {
        if (!card || !card.cost) return true;
        if (this.gameState.turn !== 'player') return true;
        if (!this.gameState.gameStarted) return true;
        return this.gameState.player.mana < card.cost;
    }

    /**
     * 打出卡牌
     */
    playCard(card) {
        if (this.gameState.turn !== 'player' || !this.gameState.gameStarted) return;
        if (this.gameState.player.mana < card.cost) {
            this.logSystem.addLog('❌ 能量不足！');
            return;
        }

        // 消耗能量
        this.gameState.player.consumeMana(card.cost);

        // 从手牌移除
        this.gameState.player.removeCard(card.id);

        // 执行卡牌效果
        const target = this.cardEffect.determineTarget(card, 'player');
        this.cardEffect.execute(card, target, 'player');

        // 处理抽牌效果
        if (card.draw > 0) {
            for (let i = 0; i < card.draw; i++) {
                this.gameState.player.drawCard(this.cardFactory.getRandomCard());
            }
        }

        // 播放出牌动画
        this.cardAnimation.animateCardPlay(
            card,
            'player',
            this.cardRenderer,
            this.gameState.currentTurnCards
        );

        this.updateDisplay();
        this.checkGameOver();

        // 检查能量是否耗尽，如果耗尽且没有可用卡牌，自动结束回合
        this.checkAutoEndTurn();
    }

    /**
     * 检查是否自动结束回合
     */
    checkAutoEndTurn() {
        if (this.turnManager.canAutoEndTurn()) {
            if (this.gameState.player.hand.length > 0) {
                this.logSystem.addLog(`⚡ 剩余能量(${this.gameState.player.mana})不足以打出任何卡牌，自动结束回合！`);
            } else {
                this.logSystem.addLog('⚡ 手牌已空，自动结束回合！');
            }

            setTimeout(() => {
                if (this.turnManager.canAutoEndTurn()) {
                    this.endTurn();
                }
            }, 1500);
        }
    }

    /**
     * 结束回合
     */
    endTurn() {
        if (this.gameState.turn !== 'player' || !this.gameState.gameStarted) return;

        this.turnManager.endTurn();
        this.elements.endTurnBtn.disabled = true;
        this.logSystem.addLog('🤖 对手的回合！');

        // 更新回合高亮
        this.updateTurnHighlight();

        // 立即更新能量显示和对手手牌（确保显示同步）
        this.displayManager.update(this.gameState);
        this.displayManager.updateHand('opponent', this.gameState.opponent.hand, this.cardRenderer, {
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
        this.cardAnimation.clearTurnHighlights(this.gameState.currentTurnCards);

        // 注意：能量恢复已经在 turnManager.endTurn() -> startOpponentTurn() -> startTurn() 中处理了
        // 这里不需要再次调用 restoreMana()

        // 对手回合开始时抽一张牌（与玩家一致）
        this.gameState.opponent.drawCard(this.cardFactory.getRandomCard());
        
        // 立即更新显示，确保抽牌效果可见（同步更新）
        this.updateDisplay();
        
        // 确保对手手牌已更新（显式更新）
        this.displayManager.updateHand('opponent', this.gameState.opponent.hand, this.cardRenderer, {
            draggable: false
        });

        // 对手AI：尽可能打光能量
        const cardsToPlay = this.ai.selectCardsToPlay();

        // 计算总延迟时间（每张牌800ms + 额外缓冲）
        const totalDelay = cardsToPlay.length * 800 + 1000;

        // 按顺序出牌
        if (cardsToPlay.length > 0) {
            this.playOpponentCardSequence(cardsToPlay, 0);
        }

        // 结束对手回合，开始玩家回合
        setTimeout(() => {
            this.startPlayerTurn();
        }, totalDelay);
    }

    /**
     * 对手出牌序列
     */
    playOpponentCardSequence(cards, index) {
        if (index >= cards.length) {
            return;
        }

        const card = cards[index];
        const cardIndex = this.gameState.opponent.hand.findIndex(c => c.id === card.id);

        if (cardIndex !== -1) {
            // 消耗能量
            this.gameState.opponent.consumeMana(card.cost);

            // 从手牌移除
            this.gameState.opponent.removeCard(card.id);

            // 执行卡牌效果
            const target = this.cardEffect.determineTarget(card, 'opponent');
            this.cardEffect.execute(card, target, 'opponent');

            // 处理抽牌效果
            if (card.draw > 0) {
                for (let i = 0; i < card.draw; i++) {
                    this.gameState.opponent.drawCard(this.cardFactory.getRandomCard());
                }
            }

            // 播放出牌动画
            this.cardAnimation.animateCardPlay(
                card,
                'opponent',
                this.cardRenderer,
                this.gameState.currentTurnCards
            );

            this.updateDisplay();

            // 延迟后出下一张牌
            setTimeout(() => {
                this.playOpponentCardSequence(cards, index + 1);
            }, 800);
        }
    }

    /**
     * 开始玩家回合
     */
    startPlayerTurn() {
        this.turnManager.startPlayerTurn();
        // 玩家回合开始时增加回合数
        this.gameState.turnNumber++;
        this.updateTurnNumber();
        this.gameState.player.drawCard(this.cardFactory.getRandomCard());
        this.elements.endTurnBtn.disabled = false;
        this.logSystem.addLog('👤 你的回合！');

        // 清除上一回合的卡牌高亮
        this.cardAnimation.clearTurnHighlights(this.gameState.currentTurnCards);

        // 更新回合高亮
        this.updateTurnHighlight();

        this.updateDisplay();
        this.checkGameOver();
    }

    /**
     * 检查游戏结束
     */
    checkGameOver() {
        const winner = this.gameState.checkGameOver();
        if (winner === 'opponent') {
            this.logSystem.addLog('💀 你被击败了！游戏结束！');
            this.gameOver('opponent');
        } else if (winner === 'player') {
            this.logSystem.addLog('🎉 你获胜了！恭喜！');
            this.gameOver('player');
        }
    }

    /**
     * 游戏结束
     */
    gameOver(winner) {
        this.gameState.gameStarted = false;
        this.elements.endTurnBtn.disabled = true;
        this.elements.startBtn.disabled = false;
        this.elements.startBtn.textContent = '重新开始';

        // 显示游戏结束对话框
        if (this.elements.gameOverModal) {
            if (winner === 'player') {
                // 玩家获胜
                this.elements.gameOverIcon.textContent = '🎉';
                this.elements.gameOverTitle.textContent = '恭喜获胜！';
                this.elements.gameOverMessage.textContent = '你成功击败了对手！';
                this.elements.gameOverModal.classList.add('victory');
                this.elements.gameOverModal.classList.remove('defeat');
            } else if (winner === 'opponent') {
                // 对手获胜
                this.elements.gameOverIcon.textContent = '💀';
                this.elements.gameOverTitle.textContent = '游戏结束';
                this.elements.gameOverMessage.textContent = '你被击败了，再接再厉！';
                this.elements.gameOverModal.classList.add('defeat');
                this.elements.gameOverModal.classList.remove('victory');
            }
            this.elements.gameOverModal.style.display = 'block';
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

