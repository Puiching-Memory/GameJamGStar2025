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
    animateCardPlay(card, player, cardRenderer, currentTurnCards, dropPosition = null) {
        // 直接显示卡牌，不使用动画
        this.showPlayedCardDirectly(card, player, cardRenderer, currentTurnCards, dropPosition);
    }

    /**
     * 直接显示卡牌（无动画）
     */
    showPlayedCardDirectly(card, player, cardRenderer, currentTurnCards, dropPosition = null) {
        // 如果提供了dropPosition，使用它；否则使用随机位置
        const position = dropPosition || this.generateRandomCardPosition();
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

        // 为已打出的卡牌添加拖拽功能
        this.setupCardDragging(playedCardEl);

        if (this.dropZoneHint) {
            this.dropZoneHint.style.display = 'none';
        }

        this.playedCardsContainer.appendChild(playedCardEl);
    }

    /**
     * 为已打出的卡牌设置拖拽功能
     */
    setupCardDragging(cardEl) {
        // 只允许玩家卡牌被拖拽
        if (!cardEl.classList.contains('player-card')) {
            return;
        }

        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialLeft = 0;
        let initialTop = 0;

        const handleMouseDown = (e) => {
            // 只允许左键拖拽
            if (e.button !== 0) return;
            
            isDragging = true;
            cardEl.classList.add('dragging');
            cardEl.style.transition = 'none'; // 拖拽时禁用过渡
            cardEl.style.zIndex = '1000'; // 拖拽时移到最顶层
            
            // 获取初始位置
            const rect = cardEl.getBoundingClientRect();
            const containerRect = this.playedCardsContainer.getBoundingClientRect();
            
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = rect.left - containerRect.left;
            initialTop = rect.top - containerRect.top;
            
            e.preventDefault();
        };

        const handleMouseMove = (e) => {
            if (!isDragging) return;
            
            const containerRect = this.playedCardsContainer.getBoundingClientRect();
            const cardWidth = 110;
            const cardHeight = 150;
            
            // 计算新位置
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            let newLeft = initialLeft + deltaX;
            let newTop = initialTop + deltaY;
            
            // 限制在容器范围内
            const maxX = Math.max(0, containerRect.width - cardWidth);
            const maxY = Math.max(0, containerRect.height - cardHeight);
            newLeft = Math.max(0, Math.min(newLeft, maxX));
            newTop = Math.max(0, Math.min(newTop, maxY));
            
            cardEl.style.left = `${newLeft}px`;
            cardEl.style.top = `${newTop}px`;
        };

        const handleMouseUp = () => {
            if (!isDragging) return;
            
            isDragging = false;
            cardEl.classList.remove('dragging');
            cardEl.style.transition = ''; // 恢复过渡动画
            cardEl.style.zIndex = ''; // 恢复z-index
        };

        cardEl.addEventListener('mousedown', handleMouseDown);
        
        // 使用document来监听，确保即使鼠标移出卡牌也能继续拖拽
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
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

