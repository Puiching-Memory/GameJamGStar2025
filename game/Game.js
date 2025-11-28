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

        // Git历史记录模块
        this.gitHistory = new GitHistory();
        this.gitGraphRenderer = null; // 稍后初始化

        // 交互模块
        this.dragDrop = null; // 稍后初始化
        this.tooltip = null; // Tooltip系统

        // 拖拽状态
        this.draggedCard = null;

        // UI元素引用
        this.elements = {};

        // 本回合新获得的手牌（用于入场动画）
        this.newPlayerHandCardIds = new Set();
        this.newOpponentHandCardIds = new Set();

        // 记录上一次手牌数量，用于判断是否需要播放重排动画
        this.prevPlayerHandSize = 0;
        this.prevOpponentHandSize = 0;

        // 初始化
        this.initializeElements();
        this.initializeComponents();
        this.setupEventListeners();
        this.initializeTooltips();
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
            gitGraphContainer: document.getElementById('git-graph-container')
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

        // Git Graph渲染器
        if (this.elements.gitGraphContainer) {
            this.gitGraphRenderer = new GitGraphRenderer(this.elements.gitGraphContainer);
        }
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
     * 开始游戏
     */
    startGame() {
        this.gameState.reset();
        this.gitHistory.reset();
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

        // 标记初始手牌为“新获得”，用于首回合入场动画
        this.newPlayerHandCardIds = new Set(
            this.gameState.player.hand.map(card => card.id)
        );

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
        this.updateGitGraph();
        this.logSystem.addLog('游戏开始！', 'game');
        this.logSystem.addLog('你的回合！', 'player');
    }

    /**
     * 更新Git Graph显示
     */
    updateGitGraph() {
        if (this.gitGraphRenderer) {
            const mermaidCode = this.gitHistory.generateMermaidGraph();
            console.log('Updating git graph with code:', mermaidCode);
            this.gitGraphRenderer.render(mermaidCode);
        } else {
            console.warn('GitGraphRenderer not initialized');
        }
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

        // 记录更新前的手牌数量
        const currentPlayerHandSize = this.gameState.player.hand.length;
        const currentOpponentHandSize = this.gameState.opponent.hand.length;

        // 记录对手手牌浮动窗口的旧宽度，用于做平滑尺寸过渡
        let opponentOldWidth = 0;
        if (this.elements.opponentHandEl) {
            opponentOldWidth = this.elements.opponentHandEl.offsetWidth;
        }

        // 更新手牌
        this.displayManager.updateHand('player', this.gameState.player.hand, this.cardRenderer, {
            enterAnimationCardIds: this.newPlayerHandCardIds,
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
            draggable: false,
            enterAnimationCardIds: this.newOpponentHandCardIds
        });

        // 手牌渲染完成后，清空“新获得”标记，避免重复播放动画
        this.newPlayerHandCardIds.clear();
        this.newOpponentHandCardIds.clear();

        // 如果手牌数量发生变化，为对应手牌区域添加一次轻微的重排动画
        if (currentPlayerHandSize !== this.prevPlayerHandSize && this.elements.playerHandEl) {
            this.triggerHandReflowAnimation(this.elements.playerHandEl);
        }
        if (currentOpponentHandSize !== this.prevOpponentHandSize && this.elements.opponentHandEl) {
            this.triggerHandReflowAnimation(this.elements.opponentHandEl);
            this.animateOpponentHandResize(this.elements.opponentHandEl, opponentOldWidth);
        }

        // 更新缓存的手牌数量
        this.prevPlayerHandSize = currentPlayerHandSize;
        this.prevOpponentHandSize = currentOpponentHandSize;
    }

    /**
     * 触发手牌重排动画：通过类名和一次性计时器控制
     */
    triggerHandReflowAnimation(handEl) {
        // 先移除再强制回流，确保多次调用也能重新触发动画
        handEl.classList.remove('hand-reflow');
        // 读一次 offsetWidth 触发布局
        // eslint-disable-next-line no-unused-expressions
        handEl.offsetWidth;
        handEl.classList.add('hand-reflow');

        setTimeout(() => {
            handEl.classList.remove('hand-reflow');
        }, 260);
    }

    /**
     * 为对手手牌浮动窗口的大小变化添加平滑过渡动画（宽度过渡）
     * @param {HTMLElement} handEl
     * @param {number} oldWidth
     */
    animateOpponentHandResize(handEl, oldWidth) {
        if (!handEl) return;

        // 根据卡牌数量粗略估算一个视觉上“合理”的宽度，而不是直接用 scrollWidth
        const cardEls = handEl.querySelectorAll('.card');
        const cardCount = cardEls.length;

        // 基于样式：每张牌宽度约120px，左右重叠约40px，容器左右 padding 约40px
        const baseCardWidth = 120;
        const cardStep = 80; // 120 - 40 重叠
        const containerPaddingX = 40;
        const minWidth = 180; // 至少保留一个小面板的宽度

        let targetWidth;
        if (cardCount <= 0) {
            targetWidth = minWidth;
        } else {
            targetWidth = containerPaddingX + baseCardWidth + cardStep * (cardCount - 1);
            if (targetWidth < minWidth) {
                targetWidth = minWidth;
            }
        }

        if (!oldWidth || !targetWidth || Math.abs(targetWidth - oldWidth) < 1) {
            // 如果没有旧宽度或变化很小，就直接同步为目标宽度
            if (targetWidth) {
                handEl.style.width = `${targetWidth}px`;
            }
            return;
        }

        // 先把当前宽度锁定在旧值
        handEl.style.width = `${oldWidth}px`;

        // 下一帧再切换到目标宽度，由 CSS 的 transition: width 控制过渡
        requestAnimationFrame(() => {
            handEl.style.width = `${targetWidth}px`;
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
            this.logSystem.addLog('能量不足！', 'system');
            return;
        }

        // 记录git操作
        this.gitHistory.recordCardPlay(card, 'player', this.gameState.turnNumber);
        this.updateGitGraph();

        // 消耗能量
        this.gameState.player.consumeMana(card.cost);

        // 先触发手牌退出动画（如果有对应DOM），等动画结束后再重新排列手牌
        const exitPromise = this.playHandCardExitAnimation('player', card.id);

        // 从手牌移除（游戏状态）
        this.gameState.player.removeCard(card.id);

        // 执行卡牌效果
        const target = this.cardEffect.determineTarget(card, 'player');
        this.cardEffect.execute(card, target, 'player');

        // 处理抽牌效果
        if (card.draw > 0) {
            for (let i = 0; i < card.draw; i++) {
                const newCard = this.cardFactory.getRandomCard();
                if (this.gameState.player.drawCard(newCard)) {
                    this.newPlayerHandCardIds.add(newCard.id);
                }
            }
        }

        // 播放出牌动画
        this.cardAnimation.animateCardPlay(
            card,
            'player',
            this.cardRenderer,
            this.gameState.currentTurnCards
        );

        // 等退出动画结束后，再更新显示和自动结束回合逻辑
        exitPromise.then(() => {
            this.updateDisplay();
            this.checkGameOver();
            this.checkAutoEndTurn();
        });
    }

    /**
     * 检查是否自动结束回合
     */
    checkAutoEndTurn() {
        if (this.turnManager.canAutoEndTurn()) {
            if (this.gameState.player.hand.length > 0) {
                this.logSystem.addLog(`剩余能量(${this.gameState.player.mana})不足以打出任何卡牌，自动结束回合！`, 'system');
            } else {
                this.logSystem.addLog('手牌已空，自动结束回合！', 'system');
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

        // 传递日志回调函数，用于记录buff效果
        this.turnManager.endTurn((message, source) => {
            if (this.logSystem) {
                this.logSystem.addLog(message, source);
            }
        });
        this.elements.endTurnBtn.disabled = true;
        this.logSystem.addLog('对手的回合！', 'opponent');

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

        // 处理场上卡牌的透明度和删除（每回合执行）
        this.processPlayedCardsFade();

        // 对手回合开始时抽一张牌（与玩家一致）
        {
            const newCard = this.cardFactory.getRandomCard();
            if (this.gameState.opponent.drawCard(newCard)) {
                this.newOpponentHandCardIds.add(newCard.id);
            }
        }
        
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
            // 在状态更新前，为对手手牌添加退出动画，并在动画结束后再更新对手手牌排列
            const exitPromise = this.playHandCardExitAnimation('opponent', card.id);

            // 记录git操作
            this.gitHistory.recordCardPlay(card, 'opponent', this.gameState.turnNumber);
            this.updateGitGraph();

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
                    const newCard = this.cardFactory.getRandomCard();
                    if (this.gameState.opponent.drawCard(newCard)) {
                        this.newOpponentHandCardIds.add(newCard.id);
                    }
                }
            }

            // 播放出牌动画
            this.cardAnimation.animateCardPlay(
                card,
                'opponent',
                this.cardRenderer,
                this.gameState.currentTurnCards
            );

            // 等退出动画结束后再更新界面，并按原有节奏继续出下一张牌
            exitPromise.then(() => {
                this.updateDisplay();
                setTimeout(() => {
                    this.playOpponentCardSequence(cards, index + 1);
                }, 800);
            });
        }
    }

    /**
     * 开始玩家回合
     */
    startPlayerTurn() {
        // 传递日志回调函数，用于记录buff效果
        this.turnManager.startPlayerTurn((message, source) => {
            if (this.logSystem) {
                this.logSystem.addLog(message, source);
            }
        });
        // 玩家回合开始时增加回合数
        this.gameState.turnNumber++;
        this.updateTurnNumber();
        {
            const newCard = this.cardFactory.getRandomCard();
            if (this.gameState.player.drawCard(newCard)) {
                this.newPlayerHandCardIds.add(newCard.id);
            }
        }
        this.elements.endTurnBtn.disabled = false;
        this.logSystem.addLog('你的回合！', 'player');

        // 清除上一回合的卡牌高亮
        this.cardAnimation.clearTurnHighlights(this.gameState.currentTurnCards);

        // 处理场上卡牌的透明度和删除
        this.processPlayedCardsFade();

        // 更新回合高亮
        this.updateTurnHighlight();

        this.updateDisplay();
        this.checkGameOver();
    }

    /**
     * 处理场上卡牌的透明度和删除
     * 每回合降低透明度和颜色饱和度，按生命周期删除卡牌
     */
    processPlayedCardsFade() {
        if (!this.elements.playedCardsContainer) {
            return;
        }

        const playedCards = Array.from(this.elements.playedCardsContainer.children);
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

    /**
     * 检查游戏结束
     */
    checkGameOver() {
        const winner = this.gameState.checkGameOver();
        if (winner === 'opponent') {
            this.logSystem.addLog('你被击败了！游戏结束！', 'game');
            this.gameOver('opponent');
        } else if (winner === 'player') {
            this.logSystem.addLog('你获胜了！恭喜！', 'game');
            this.gameOver('player');
        }
    }

    /**
     * 为手牌播放退出动画，并在动画结束后移除对应 DOM
     * @param {'player' | 'opponent'} owner
     * @param {string} cardId
     * @returns {Promise<void>}
     */
    playHandCardExitAnimation(owner, cardId) {
        return new Promise((resolve) => {
            try {
                const handEl = owner === 'player'
                    ? this.elements.playerHandEl
                    : this.elements.opponentHandEl;

                if (!handEl || !this.animationSystem) {
                    resolve();
                    return;
                }

                const selector = `.card[data-card-id="${cardId}"]`;
                const handCardEl = handEl.querySelector(selector);
                if (!handCardEl) {
                    resolve();
                    return;
                }

                // 根据来源手牌区域打上标记类，用于保持与原手牌一致的配色/背面样式
                if (owner === 'player') {
                    handCardEl.classList.add('card-from-player-hand');
                } else {
                    handCardEl.classList.add('card-from-opponent-hand');
                }

                // 在原位置插入一个不可见占位元素，保持手牌布局不立即收缩
                const placeholder = document.createElement('div');
                placeholder.className = `${handCardEl.className} card-placeholder`;
                placeholder.style.visibility = 'hidden';
                placeholder.style.pointerEvents = 'none';
                handEl.insertBefore(placeholder, handCardEl);

                // 保护元素，避免在渲染时被立即移除
                this.animationSystem.protectElement(handCardEl);

                // 记录当前屏幕位置，并将元素从手牌布局中抽离出来，锁定在当前视觉位置
                const rect = handCardEl.getBoundingClientRect();
                const left = rect.left;
                const top = rect.top;

                if (handCardEl.parentNode !== document.body) {
                    document.body.appendChild(handCardEl);
                }

                handCardEl.style.position = 'fixed';
                handCardEl.style.left = `${left}px`;
                handCardEl.style.top = `${top}px`;
                // 不再额外添加 translate(-50%, -50%)，避免与动画中的 transform 冲突
                handCardEl.style.width = `${rect.width}px`;
                handCardEl.style.height = `${rect.height}px`;
                handCardEl.style.zIndex = '10000';

                handCardEl.classList.add('card-exit');
                handCardEl.style.pointerEvents = 'none';

                handCardEl.addEventListener(
                    'animationend',
                    () => {
                        handCardEl.classList.remove('card-exit');
                        if (this.animationSystem) {
                            this.animationSystem.unprotectElement(handCardEl);
                        }
                        if (handCardEl.parentNode) {
                            handCardEl.remove();
                        }
                        // 移除占位符，再通知上层可以更新手牌布局
                        if (placeholder && placeholder.parentNode) {
                            placeholder.remove();
                        }
                        resolve();
                    },
                    { once: true }
                );
            } catch (e) {
                console.warn('hand card exit animation failed:', e);
                resolve();
            }
        });
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

