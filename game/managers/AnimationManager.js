/**
 * 动画管理器
 * 负责管理所有动画效果，包括手牌动画和屏幕特效
 * 合并了 HandAnimationManager 和 ScreenEffectManager 的功能
 */
class AnimationManager {
    constructor(domProtectionManager, elements) {
        this.domProtectionManager = domProtectionManager;
        this.elements = elements;
        this.screenDamageFlashEl = elements.screenDamageFlash;
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

                if (!handEl || !this.domProtectionManager) {
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
                this.domProtectionManager.protectElement(handCardEl);

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
                handCardEl.style.width = `${rect.width}px`;
                handCardEl.style.height = `${rect.height}px`;
                handCardEl.style.zIndex = '10000';

                handCardEl.classList.add('card-exit');
                handCardEl.style.pointerEvents = 'none';

                handCardEl.addEventListener(
                    'animationend',
                    () => {
                        handCardEl.classList.remove('card-exit');
                        if (this.domProtectionManager) {
                            this.domProtectionManager.unprotectElement(handCardEl);
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

        // 根据卡牌数量粗略估算一个视觉上"合理"的宽度，而不是直接用 scrollWidth
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
     * 触发屏幕红色闪烁动画
     */
    triggerDamageFlash() {
        if (!this.screenDamageFlashEl) return;

        // 移除之前的动画类（如果存在）
        this.screenDamageFlashEl.classList.remove('screen-flash-red');
        
        // 强制重排以重置动画
        // eslint-disable-next-line no-unused-expressions
        this.screenDamageFlashEl.offsetWidth;
        
        // 添加动画类
        this.screenDamageFlashEl.classList.add('screen-flash-red');
        
        // 动画结束后移除类，以便下次可以再次触发
        this.screenDamageFlashEl.addEventListener(
            'animationend',
            () => {
                this.screenDamageFlashEl.classList.remove('screen-flash-red');
            },
            { once: true }
        );
    }

    /**
     * 触发屏幕绿色闪烁动画（治疗效果）
     */
    triggerHealFlash() {
        if (!this.screenDamageFlashEl) return;

        // 移除之前的动画类（如果存在）
        this.screenDamageFlashEl.classList.remove('screen-flash-green');
        
        // 强制重排以重置动画
        // eslint-disable-next-line no-unused-expressions
        this.screenDamageFlashEl.offsetWidth;
        
        // 添加动画类
        this.screenDamageFlashEl.classList.add('screen-flash-green');
        
        // 动画结束后移除类，以便下次可以再次触发
        this.screenDamageFlashEl.addEventListener(
            'animationend',
            () => {
                this.screenDamageFlashEl.classList.remove('screen-flash-green');
            },
            { once: true }
        );
    }
}

