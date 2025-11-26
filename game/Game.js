/**
 * 主游戏类
 * 使用组合模式整合所有模块
 */
class Game {
    constructor() {
        // 核心模块
        this.gameState = new GameState();
        
        // 创建效果注册表并初始化
        this.effectRegistry = new EffectRegistry();
        if (typeof initializeEffects === 'function') {
            initializeEffects(this.effectRegistry);
        }
        
        // 创建卡牌工厂（使用新的效果注册表）
        this.cardFactory = new CardFactory(this.effectRegistry);

        // 游戏逻辑模块
        this.cardEffect = new CardEffect(this.gameState, null, this.cardFactory); // logSystem稍后设置
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

        // UI元素引用
        this.elements = {};

        // 初始化
        this.initializeElements();
        this.initializeComponents();
        this.initializeManagers();
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
            turnNumberEl: document.getElementById('turn-number'),
            playerBuffsEl: document.getElementById('player-buffs'),
            opponentBuffsEl: document.getElementById('opponent-buffs'),
            screenDamageFlash: document.getElementById('screen-damage-flash')
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

        // Buff渲染器
        const buffRenderer = new BuffRenderer();

        // 显示管理器
        this.displayManager = new DisplayManager(this.elements, {
            playerHealthBar,
            opponentHealthBar,
            playerManaDisplay,
            opponentManaDisplay,
            buffRenderer
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
     * 初始化管理器（组合模式）
     */
    initializeManagers() {
        // 手牌动画管理器
        this.handAnimationManager = new HandAnimationManager(
            this.animationSystem,
            this.elements
        );

        // 屏幕特效管理器
        this.screenEffectManager = new ScreenEffectManager(this.elements.screenDamageFlash);

        // 连击Buff处理器
        this.comboBuffHandler = new ComboBuffHandler(this.gameState, this.logSystem);

        // 卡牌打出管理器
        this.cardPlayManager = new CardPlayManager(
            this.gameState,
            this.cardEffect,
            this.cardAnimation,
            this.cardRenderer,
            this.logSystem,
            this.handAnimationManager
        );

        // UI管理器
        this.uiManager = new GameUIManager(
            this.gameState,
            this.elements,
            {
                displayManager: this.displayManager,
                cardRenderer: this.cardRenderer,
                handAnimationManager: this.handAnimationManager
            }
        );
        this.uiManager.initializeTooltips();

        // 游戏流程控制器
        this.flowController = new GameFlowController(
            this.gameState,
            this.cardFactory,
            this.turnManager,
            this.ai,
            {
                uiManager: this.uiManager,
                cardPlayManager: this.cardPlayManager,
                cardAnimation: this.cardAnimation,
                logSystem: this.logSystem,
                displayManager: this.displayManager,
                cardRenderer: this.cardRenderer,
                elements: this.elements,
                getCardPlayOptions: () => this.getCardPlayOptions()
            }
        );

        // 游戏事件管理器
        this.eventManager = new GameEventManager(this.gameState, {
            onCardDrawn: (data) => {
                this.uiManager.markNewCard(data.player, data.card.id);
            },
            onCardPlayed: (data) => {
                this.comboBuffHandler.processComboBuff(data.player);
            },
            onPlayerDamage: () => {
                this.screenEffectManager.triggerDamageFlash();
            },
            onPlayerHeal: () => {
                this.screenEffectManager.triggerHealFlash();
            },
            onCardRemoved: (data) => {
                const player = data.player === 'player' ? 'player' : 'opponent';
                this.cardPlayManager.addForcedDiscardCardToPile(
                    data.card,
                    player,
                    this.elements.playedCardsContainer
                );
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

    // ========== 游戏流程方法（委托给 flowController） ==========

    /**
     * 开始游戏
     */
    startGame() {
        this.flowController.startGame();
    }

    /**
     * 结束回合
     */
    endTurn() {
        this.flowController.endTurn();
    }

    // ========== 卡牌操作方法（委托给 cardPlayManager） ==========

    /**
     * 检查卡牌是否禁用
     */
    isCardDisabled(card) {
        return this.cardPlayManager.isCardDisabled(card);
    }

    /**
     * 打出卡牌
     */
    playCard(card) {
        this.cardPlayManager.playCard(card, () => {
            this.updateDisplay();
            this.flowController.checkGameOver();
            this.flowController.checkAutoEndTurn();
        });
    }

    // ========== UI更新方法（委托给 uiManager） ==========

    /**
     * 获取卡牌交互选项
     */
    getCardPlayOptions() {
        return {
            isCardDisabled: (card) => this.isCardDisabled(card),
            onCardClick: (card) => this.playCard(card),
            onCardDoubleClick: (card) => this.uiManager.showCardDetails(card),
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
        };
    }

    /**
     * 更新显示
     */
    updateDisplay() {
        this.uiManager.updateDisplay(this.getCardPlayOptions());
    }

    /**
     * 显示卡牌详情
     */
    showCardDetails(card) {
        this.uiManager.showCardDetails(card);
    }
}
