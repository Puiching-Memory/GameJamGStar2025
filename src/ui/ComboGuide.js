/**
 * 组合技引导UI组件
 * 显示当前可触发的组合技路径
 */

export class ComboGuide {
    constructor(containerId, comboSystem) {
        this.container = document.getElementById(containerId);
        this.comboSystem = comboSystem;
        this.playerHandContainer = document.querySelector('.player-hand-container');
        this.previousProgress = new Map(); // 存储每个连招的上次进度，用于检测进度变化
        
        if (!this.container) {
            console.warn(`ComboGuide: Container with id "${containerId}" not found`);
        }
        
        // 监听窗口大小变化，重新计算位置
        window.addEventListener('resize', () => {
            if (this.container && this.container.style.display !== 'none') {
                this.updatePosition();
            }
        });

        // 初始化窗口位置（如果容器存在）
        if (this.container && this.playerHandContainer) {
            // 延迟初始化，确保DOM已完全加载
            setTimeout(() => {
                if (this.container && this.playerHandContainer) {
                    this.updatePosition();
                }
            }, 100);
        }
    }

    /**
     * 更新组合技引导的位置，将其定位在玩家手牌的右侧（浮动窗口方式）
     */
    updatePosition() {
        if (!this.container || !this.playerHandContainer) return;

        const handRect = this.playerHandContainer.getBoundingClientRect();
        const spacing = 10; // 与手牌的间距
        const containerWidth = 350; // 增大宽度以便显示更多内容
        const containerHeight = 200; // 与player-hand-container高度一致
        
        // 计算位置：手牌右侧，与手牌底部对齐（bottom定位）
        let left = handRect.right + spacing;
        const bottom = window.innerHeight - handRect.bottom; // 从底部计算，与手牌对齐
        
        // 检查是否会超出屏幕右侧
        if (left + containerWidth > window.innerWidth - 20) {
            // 如果超出，放在手牌左侧
            left = handRect.left - containerWidth - spacing;
            // 如果左侧也不够，就放在屏幕右侧
            if (left < 20) {
                left = window.innerWidth - containerWidth - 20;
            }
        }
        
        // 设置位置和高度（与手牌容器完全一致）
        this.container.style.setProperty('left', `${left}px`, 'important');
        this.container.style.setProperty('right', 'auto', 'important');
        this.container.style.setProperty('bottom', `${bottom}px`, 'important');
        this.container.style.setProperty('top', 'auto', 'important');
        this.container.style.setProperty('height', `${containerHeight}px`, 'important');
        this.container.style.setProperty('max-height', `${containerHeight}px`, 'important');
    }

    /**
     * 更新组合技引导显示
     * @param {Card[]} playedCards - 本回合已打出的卡牌
     * @param {Card[]} handCards - 手牌列表
     */
    update(playedCards = [], handCards = []) {
        if (!this.container) return;

        // 保存当前的进度状态（在清空前）
        const currentProgressMap = new Map();
        const existingContentArea = this.container.querySelector('.combo-guide-content');
        if (existingContentArea) {
            const existingItems = existingContentArea.querySelectorAll('.combo-guide-item');
            existingItems.forEach((item, index) => {
                const comboName = item.querySelector('.combo-name-new')?.textContent || '';
                const pathContainer = item.querySelector('.combo-guide-path-new');
                if (pathContainer) {
                    const completedCards = pathContainer.querySelectorAll('.combo-path-card.completed').length;
                    currentProgressMap.set(`${comboName}_${index}`, completedCards);
                }
            });
        }

        // 清空容器
        this.container.innerHTML = '';

        let combosToShow = [];

        // 获取手牌中的卡牌ID列表（用于显示哪些卡在手牌中）
        const handCardIds = handCards && handCards.length > 0 
            ? this.comboSystem.getBaseCardIdSequence(handCards)
            : [];

        // 如果有已打出的卡牌，显示基于当前进度的组合技
        if (playedCards && playedCards.length > 0) {
            const potentialCombos = this.comboSystem.getPotentialCombos(playedCards, handCards || []);
            // 为每个组合技添加手牌信息
            combosToShow = potentialCombos.map(item => ({
                ...item,
                handCardIds: handCardIds
            }));
        } else {
            // 如果没有已打出的卡牌，显示基于手牌的完整连招推荐
            if (handCards && handCards.length > 0) {
                try {
                    const availableCombos = this.comboSystem.getAvailableCombosFromHand(handCards);
                    
                    
                    // 获取手牌中的卡牌ID列表
                    const handCardIds = this.comboSystem.getBaseCardIdSequence(handCards);
                    
                    combosToShow = availableCombos.map(item => ({
                        combo: item.combo,
                        fullSequence: item.fullSequence,
                        progress: 0,
                        totalLength: item.fullSequence.length,
                        isFullCombo: !item.matchedCards || item.matchedCards === item.fullSequence.length, // 标记是否为完整推荐
                        matchedCards: item.matchedCards || item.fullSequence.length, // 已匹配的卡牌数量
                        hasAllCards: item.hasAllCards !== false, // 是否有所有卡牌
                        handCardIds: handCardIds // 传递手牌ID列表，用于显示哪些卡在手牌中
                    }));
                } catch (error) {
                    console.error('获取组合技推荐时出错:', error);
                }
            }
        }

        // 限制显示数量（最多3个）
        combosToShow = combosToShow.slice(0, 3);

        // 先显示容器（这样才能正确计算位置）- 窗口常驻
        this.container.style.display = 'block';
        
        // 等待一帧，确保容器已渲染，然后更新位置
        requestAnimationFrame(() => {
            this.updatePosition();
        });

        // 添加标题
        const title = document.createElement('div');
        title.className = 'combo-guide-title';
        title.innerHTML = '💡 连招推荐';
        this.container.appendChild(title);

        // 创建内容区域容器，自动填充剩余空间
        const contentArea = document.createElement('div');
        contentArea.className = 'combo-guide-content';

        // 如果没有推荐，显示空状态提示
        if (combosToShow.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'combo-guide-empty';
            emptyState.innerHTML = `
                <div class="empty-icon">🎴</div>
                <div class="empty-text">暂无连招推荐</div>
                <div class="empty-hint">尝试按顺序出牌触发组合技！</div>
            `;
            contentArea.appendChild(emptyState);
        } else {
            // 为每个潜在组合技创建一个引导项
            combosToShow.forEach((comboData, index) => {
                const guideItem = this.createGuideItem(comboData, index);
                contentArea.appendChild(guideItem);
            });
        }

        this.container.appendChild(contentArea);
        
        // 在所有项目创建完成后，检测进度变化并触发动画
        requestAnimationFrame(() => {
            combosToShow.forEach((comboData, index) => {
                const comboName = comboData.combo.name;
                const comboKey = `${comboName}_${index}`;
                const currentProgress = comboData.progress || 0;
                const previousProgress = currentProgressMap.get(comboKey) || 0;
                
                // 如果进度增加了，触发成功动画
                if (currentProgress > previousProgress) {
                    const guideItem = contentArea.querySelectorAll('.combo-guide-item')[index];
                    if (guideItem) {
                        this.triggerSuccessAnimation(guideItem, currentProgress - 1);
                    }
                }
                
                // 更新进度记录
                this.previousProgress.set(comboKey, currentProgress);
            });
        });
    }

    /**
     * 触发成功动画
     * @param {HTMLElement} guideItem - 引导项元素
     * @param {number} cardIndex - 卡牌在路径中的索引
     */
    triggerSuccessAnimation(guideItem, cardIndex) {
        const pathContainer = guideItem.querySelector('.combo-guide-path-new');
        if (!pathContainer) return;
        
        const pathCards = pathContainer.querySelectorAll('.combo-path-card');
        if (pathCards[cardIndex]) {
            const cardElement = pathCards[cardIndex];
            
            // 添加成功动画类
            cardElement.classList.add('combo-success-animation');
            
            // 动画结束后移除类
            setTimeout(() => {
                cardElement.classList.remove('combo-success-animation');
            }, 1000);
        }
    }

    /**
     * 创建单个组合技引导项
     * @param {Object} comboData - 组合技数据
     * @param {number} index - 连招索引
     * @returns {HTMLElement} - 引导项元素
     */
    createGuideItem(comboData, index = 0) {
        const item = document.createElement('div');
        item.className = 'combo-guide-item';
        
        const { combo, progress = 0, totalLength, fullSequence, isFullCombo = false, handCardIds = [] } = comboData;
        
        // 获取完整序列（优先使用fullSequence，否则使用combo.sequence）
        const sequence = fullSequence || combo.sequence;
        const actualTotalLength = totalLength || sequence.length;
        
        // 创建完整连招路径（传入手牌信息以便显示哪些卡在手牌中）
        const comboPath = this.createComboPath(sequence, progress, handCardIds);
        
        // 创建进度条
        const progressBar = this.createProgressBar(progress, actualTotalLength);
        
        // 重新设计的组合技信息布局
        item.innerHTML = `
            <div class="combo-guide-header-new">
                <div class="combo-header-left">
                    <span class="combo-icon-new">${combo.icon}</span>
                    <div class="combo-info">
                        <span class="combo-name-new">${combo.name}</span>
                        ${comboData.hasAllCards ? '<span class="combo-ready-badge-new">✓ 可完成</span>' : ''}
                    </div>
                </div>
                <div class="combo-guide-bonus-new">
                    <span class="bonus-icon">⚡</span>
                    <span class="bonus-text">+${Math.round(combo.bonusDamage * 100)}%</span>
                </div>
            </div>
            <div class="combo-guide-path-new">
                ${comboPath}
            </div>
            <div class="combo-guide-progress-new">
                ${progressBar}
            </div>
        `;

        return item;
    }

    /**
     * 创建连招路径显示
     * @param {string[]} sequence - 完整序列
     * @param {number} progress - 当前进度（已打出的卡牌数）
     * @param {string[]} handCardIds - 手牌中的卡牌ID列表（可选）
     * @returns {string} - 路径HTML
     */
    createComboPath(sequence, progress = 0, handCardIds = []) {
        const pathItems = sequence.map((cardId, index) => {
            const cardData = this.getCardDisplayInfo(cardId);
            const isCompleted = index < progress;
            const isNext = index === progress;
            const inHand = handCardIds.includes(cardId); // 是否在手牌中
            
            let statusClass = '';
            if (isCompleted) {
                statusClass = 'completed';
            } else if (isNext) {
                statusClass = 'next';
            } else if (inHand) {
                statusClass = 'in-hand';
            }
            // 移除missing状态和✗标记，避免误导用户
            
            return `
                <div class="combo-path-card ${statusClass}" data-card-index="${index}" title="${inHand ? '手牌中有' : ''}">
                    <span class="path-card-icon">${cardData.icon}</span>
                    <span class="path-card-name">${cardData.name}</span>
                </div>
            `;
        }).join('');
        
        return `<div class="combo-path">${pathItems}</div>`;
    }

    /**
     * 创建进度条
     * @param {number} progress - 当前进度
     * @param {number} total - 总数
     * @returns {string} - 进度条HTML
     */
    createProgressBar(progress, total) {
        const percentage = Math.round((progress / total) * 100);
        const segments = [];
        
        for (let i = 0; i < total; i++) {
            const isCompleted = i < progress;
            segments.push(`<div class="progress-segment ${isCompleted ? 'completed' : ''}"></div>`);
        }
        
        return `<div class="combo-progress-bar">${segments.join('')}</div>`;
    }

    /**
     * 获取卡牌显示信息
     * @param {string} cardId - 卡牌基础ID
     * @returns {Object} - {icon, name}
     */
    getCardDisplayInfo(cardId) {
        // 导入CARD_DATA（如果可用）或使用映射表
        const cardInfo = {
            'add': { icon: '➕', name: 'Add' },
            'commit': { icon: '💾', name: 'Commit' },
            'push': { icon: '⬆️', name: 'Push' },
            'pull': { icon: '⬇️', name: 'Pull' },
            'fetch': { icon: '📥', name: 'Fetch' },
            'clone': { icon: '📋', name: 'Clone' },
            'branch': { icon: '🌿', name: 'Branch' },
            'checkout': { icon: '🔀', name: 'Checkout' },
            'merge': { icon: '🔀', name: 'Merge' },
            'rebase': { icon: '🔄', name: 'Rebase' },
            'log': { icon: '📜', name: 'Log' },
            'show': { icon: '👁️', name: 'Show' },
            'diff': { icon: '🔍', name: 'Diff' },
            'blame': { icon: '👤', name: 'Blame' },
            'bisect': { icon: '🔎', name: 'Bisect' },
            'reset': { icon: '⏪', name: 'Reset' },
            'revert': { icon: '↩️', name: 'Revert' },
            'stash': { icon: '📦', name: 'Stash' },
            'cherry-pick': { icon: '🍒', name: 'Cherry Pick' },
            'remote': { icon: '🌐', name: 'Remote' },
            'submodule': { icon: '📁', name: 'Submodule' },
            'worktree': { icon: '🌳', name: 'Worktree' },
            'tag': { icon: '🏷️', name: 'Tag' },
            'status': { icon: '📊', name: 'Status' },
            'clean': { icon: '🧹', name: 'Clean' },
            'init': { icon: '🚀', name: 'Init' },
            'config': { icon: '⚙️', name: 'Config' },
            'github-action': { icon: '🔄', name: 'GitHub Action' },
            'cl-bot': { icon: '🤖', name: 'CL自动机器人' }
        };

        return cardInfo[cardId] || { icon: '❓', name: cardId };
    }

    /**
     * 隐藏组合技引导（现在改为显示空状态，因为窗口常驻）
     */
    hide() {
        if (this.container) {
            // 不再隐藏，而是更新为空状态
            this.update([], []);
        }
    }

    /**
     * 初始化组合技引导窗口（在游戏开始时调用）
     */
    initialize() {
        if (!this.container || !this.playerHandContainer) return;

        // 显示窗口并设置初始位置
        this.container.style.display = 'block';
        
        // 等待DOM渲染后更新位置
        requestAnimationFrame(() => {
            this.updatePosition();
        });

        // 显示初始空状态
        this.update([], []);
    }
}
