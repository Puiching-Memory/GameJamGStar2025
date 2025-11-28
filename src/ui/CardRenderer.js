/**
 * 卡牌渲染器
 * 负责渲染卡牌元素
 */
export class CardRenderer {
    constructor(animationSystem) {
        this.animationSystem = animationSystem;
    }

    /**
     * 构建卡牌HTML内容
     */
    buildCardHTML(card) {
        let valueDisplay = '';
        if (card.power > 0) {
            valueDisplay = `<div class="card-power">${card.power}</div>`;
        } else if (card.heal > 0) {
            valueDisplay = `<div class="card-heal">💚${card.heal}</div>`;
        }

        let drawDisplay = '';
        if (card.draw > 0) {
            if (card.power > 0 || card.heal > 0) {
                drawDisplay = `<div class="card-draw-top">📚${card.draw}</div>`;
            } else {
                drawDisplay = `<div class="card-draw">📚${card.draw}</div>`;
            }
        }

        return `
            <div class="card-cost">${card.cost}</div>
            ${drawDisplay}
            <div class="card-header">${card.name}</div>
            <div class="card-icon">${card.icon}</div>
            <div class="card-description">${card.description}</div>
            ${valueDisplay}
        `;
    }

    /**
     * 创建卡牌元素
     */
    createCardElement(card, player, options = {}) {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${player === 'opponent' ? 'opponent-card' : ''}`;
        cardEl.dataset.cardId = card.id;
        cardEl.innerHTML = this.buildCardHTML(card);

        // 设置交互选项
        // 说明：
        // - 是否能被"选择/出牌"由外层逻辑控制（isDisabled 只在事件回调里判断）
        // - 这里不再通过 .disabled 样式打断 hover / active 动画，保证视觉一致性
        if (options.draggable === false) {
            cardEl.draggable = false;
        } else {
            cardEl.draggable = true;
        }

        return cardEl;
    }

    /**
     * 创建已打出的卡牌元素
     */
    createPlayedCardElement(card, player) {
        const playedCardEl = document.createElement('div');
        playedCardEl.className = `played-card-in-zone ${player === 'player' ? 'player-card' : 'opponent-card'}`;
        playedCardEl.dataset.player = player;
        playedCardEl.innerHTML = this.buildCardHTML(card);
        // 设置初始透明度为1（完全不透明）
        playedCardEl.style.opacity = '1';
        playedCardEl.dataset.opacity = '1';
        // 设置初始颜色饱和度为1（完全饱和）
        playedCardEl.style.filter = 'saturate(1)';
        playedCardEl.dataset.saturation = '1';
        // 设置初始生命周期（回合数）
        const initialLifetime = 8; // 初始生命周期为8回合
        playedCardEl.dataset.lifetime = initialLifetime.toString();
        return playedCardEl;
    }

    /**
     * 渲染手牌
     */
    renderHand(handEl, hand, player, options = {}) {
        // 检查是否有受保护的卡牌元素（正在动画中）
        const protectedCards = Array.from(handEl.children).filter(
            el => this.animationSystem && this.animationSystem.isProtected(el)
        );

        // 如果所有卡牌都受保护，跳过更新
        if (protectedCards.length === hand.length && protectedCards.length > 0) {
            return;
        }

        // 移除未受保护的卡牌
        Array.from(handEl.children).forEach(el => {
            if (!this.animationSystem || !this.animationSystem.isProtected(el)) {
                el.remove();
            }
        });

        // 创建新的卡牌元素（只创建不在受保护列表中的）
        const existingCardIds = new Set(
            protectedCards.map(el => el.dataset.cardId).filter(Boolean)
        );

        hand.forEach((card) => {
            if (!existingCardIds.has(card.id)) {
                const isDisabled = options.isCardDisabled ? options.isCardDisabled(card) : false;
                const cardEl = this.createCardElement(card, player, { isDisabled });

                // 视觉上标记为"不可出牌"（变灰），但不影响 hover / active 等动画
                if (isDisabled && player === 'player') {
                    cardEl.classList.add('card-unplayable');
                }

                // 对标记为"新获得"的手牌播放入场动画（玩家和对手都可用）
                if (options.enterAnimationCardIds && options.enterAnimationCardIds.has(card.id)) {
                    cardEl.classList.add('card-enter');
                    cardEl.addEventListener(
                        'animationend',
                        () => {
                            cardEl.classList.remove('card-enter');
                        },
                        { once: true }
                    );
                }
                
                // 添加交互事件
                if (options.onCardClick) {
                    cardEl.addEventListener('click', () => {
                        if (!isDisabled) {
                            options.onCardClick(card);
                        }
                    });
                }
                
                // 右键点击显示卡牌详情（替代双击）
                if (options.onCardDoubleClick) {
                    cardEl.addEventListener('contextmenu', (e) => {
                        e.preventDefault(); // 阻止浏览器默认右键菜单
                        options.onCardDoubleClick(card);
                    });
                }

                if (options.onDragStart) {
                    cardEl.addEventListener('dragstart', (e) => {
                        if (!isDisabled && options.canDrag && options.canDrag(card)) {
                            options.onDragStart(e, card);
                            cardEl.classList.add('dragging');
                        } else {
                            e.preventDefault();
                        }
                    });
                }

                if (options.onDragEnd) {
                    cardEl.addEventListener('dragend', () => {
                        cardEl.classList.remove('dragging');
                        if (options.onDragEnd) {
                            options.onDragEnd();
                        }
                    });
                }


                handEl.appendChild(cardEl);
            }
        });

        // 确保手牌居中显示
        if (hand.length > 0) {
            handEl.style.justifyContent = 'center';
        }
    }
}

