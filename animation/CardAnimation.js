/**
 * 卡牌动画管理器
 * 负责管理卡牌相关的动画
 */
class CardAnimation {
    constructor(animationSystem, dropZone, playedCardsContainer, dropZoneHint) {
        this.animationSystem = animationSystem;
        this.dropZone = dropZone;
        this.playedCardsContainer = playedCardsContainer;
        this.dropZoneHint = dropZoneHint;
    }

    /**
     * 播放卡牌出牌动画
     * 已删除所有动画，只保留创建和显示卡牌的逻辑
     */
    animateCardPlay(card, player, cardRenderer, currentTurnCards) {
        // 直接显示卡牌，不使用动画
        this.showPlayedCardDirectly(card, player, cardRenderer, currentTurnCards);
    }

    /**
     * 直接显示卡牌（无动画）
     */
    showPlayedCardDirectly(card, player, cardRenderer, currentTurnCards) {
        const position = this.generateRandomCardPosition();
        const playedCardEl = cardRenderer.createPlayedCardElement(card, player);
        
        playedCardEl.style.position = 'absolute';
        playedCardEl.style.left = `${position.x}px`;
        playedCardEl.style.top = `${position.y}px`;
        playedCardEl.style.setProperty('--card-rotation', `${position.rotation}deg`);

        playedCardEl.classList.add('current-turn-card');
        currentTurnCards.forEach(card => {
            card.classList.remove('last-played-card');
        });
        playedCardEl.classList.add('last-played-card');
        currentTurnCards.push(playedCardEl);

        if (this.dropZoneHint) {
            this.dropZoneHint.style.display = 'none';
        }

        this.playedCardsContainer.appendChild(playedCardEl);
    }

    /**
     * 生成随机卡牌位置
     */
    generateRandomCardPosition() {
        if (!this.playedCardsContainer) {
            return { x: 0, y: 0, rotation: 0 };
        }

        const containerRect = this.playedCardsContainer.getBoundingClientRect();
        const cardWidth = 110;
        const cardHeight = 150;
        const maxX = Math.max(0, containerRect.width - cardWidth);
        const maxY = Math.max(0, containerRect.height - cardHeight);

        return {
            x: Math.random() * maxX,
            y: Math.random() * maxY,
            rotation: (Math.random() - 0.5) * 30 // -15度到15度
        };
    }

    /**
     * 清除回合高亮
     */
    clearTurnHighlights(currentTurnCards) {
        currentTurnCards.forEach(card => {
            card.classList.remove('current-turn-card', 'last-played-card');
        });
        currentTurnCards.length = 0;
    }
}

