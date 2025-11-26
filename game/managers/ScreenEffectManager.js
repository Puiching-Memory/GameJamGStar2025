/**
 * 屏幕特效管理器
 * 负责管理屏幕闪烁等视觉效果
 */
class ScreenEffectManager {
    constructor(screenDamageFlashEl) {
        this.screenDamageFlashEl = screenDamageFlashEl;
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

