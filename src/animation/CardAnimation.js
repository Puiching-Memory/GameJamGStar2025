/**
 * 卡牌动画管理器
 * 负责管理卡牌相关的动画
 */
export class CardAnimation {
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

        // 为新创建的场上卡牌添加一次入场动画
        playedCardEl.classList.add('played-card-enter');
        playedCardEl.addEventListener(
            'animationend',
            () => {
                playedCardEl.classList.remove('played-card-enter');
            },
            { once: true }
        );

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

        // 使用高斯分布，让位置更自然地聚集在中间
        // Box-Muller 生成 N(0,1)，再映射到 [0,1]，并做裁剪
        const gaussian01 = (mean = 0.5, std = 0.18) => {
            let u1 = 0;
            let u2 = 0;
            // 避免 log(0)
            while (u1 === 0) u1 = Math.random();
            while (u2 === 0) u2 = Math.random();
            const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2); // N(0,1)
            const v = mean + z0 * std;
            // 裁剪到 [0,1]，避免跑出容器
            return Math.min(1, Math.max(0, v));
        };

        const biasedX = gaussian01() * maxX;
        const biasedY = gaussian01() * maxY;

        return {
            x: biasedX,
            y: biasedY,
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

