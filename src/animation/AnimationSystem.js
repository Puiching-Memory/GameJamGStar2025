/**
 * 组合式动画系统
 * 
 * 设计理念：
 * 1. 动画状态管理：跟踪每个动画的生命周期，防止重复播放
 * 2. 组合式设计：将复杂动画分解为可组合的步骤
 * 3. 队列管理：确保动画按顺序执行，避免冲突
 * 4. DOM同步：在动画期间保护相关DOM元素，避免被意外更新
 */

export class AnimationSystem {
    constructor() {
        // 正在进行的动画映射：cardId -> AnimationInstance
        this.activeAnimations = new Map();
        
        // 动画队列：按顺序执行的动画
        this.animationQueue = [];
        this.isProcessingQueue = false;
        
        // DOM保护：在动画期间保护的DOM元素
        this.protectedElements = new Set();
    }

    /**
     * 创建并执行一个动画
     * @param {string} id - 动画唯一标识（通常是cardId）
     * @param {Array<AnimationStep>} steps - 动画步骤数组
     * @param {Object} options - 选项
     * @returns {Promise} 动画完成的Promise
     */
    async play(id, steps, options = {}) {
        // 如果已有相同ID的动画在进行，先取消它
        if (this.activeAnimations.has(id)) {
            await this.cancel(id);
        }

        // 创建动画实例
        const animation = new AnimationInstance(id, steps, options, this);
        
        // 注册动画
        this.activeAnimations.set(id, animation);
        
        // 如果设置了队列，加入队列
        if (options.queue !== false) {
            return this.enqueue(animation);
        } else {
            // 立即执行
            return animation.execute();
        }
    }

    /**
     * 将动画加入队列
     */
    async enqueue(animation) {
        return new Promise((resolve, reject) => {
            this.animationQueue.push({ animation, resolve, reject });
            this.processQueue();
        });
    }

    /**
     * 处理动画队列
     */
    async processQueue() {
        if (this.isProcessingQueue || this.animationQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.animationQueue.length > 0) {
            const { animation, resolve, reject } = this.animationQueue.shift();
            
            try {
                await animation.execute();
                resolve();
            } catch (error) {
                reject(error);
            }
        }

        this.isProcessingQueue = false;
    }

    /**
     * 取消动画
     */
    async cancel(id) {
        const animation = this.activeAnimations.get(id);
        if (animation) {
            await animation.cancel();
            this.activeAnimations.delete(id);
        }
    }

    /**
     * 保护DOM元素，防止在动画期间被更新
     */
    protectElement(element) {
        if (element) {
            this.protectedElements.add(element);
            // 添加标记，方便识别
            element.dataset.animationProtected = 'true';
        }
    }

    /**
     * 取消保护DOM元素
     */
    unprotectElement(element) {
        if (element) {
            this.protectedElements.delete(element);
            delete element.dataset.animationProtected;
        }
    }

    /**
     * 检查元素是否受保护
     */
    isProtected(element) {
        return element && this.protectedElements.has(element);
    }

    /**
     * 清理所有动画
     */
    async cleanup() {
        const promises = Array.from(this.activeAnimations.values()).map(anim => anim.cancel());
        await Promise.all(promises);
        this.activeAnimations.clear();
        this.animationQueue = [];
        this.protectedElements.clear();
    }
}

/**
 * 动画实例
 */
class AnimationInstance {
    constructor(id, steps, options, system) {
        this.id = id;
        this.steps = steps;
        this.options = options;
        this.system = system;
        this.currentStepIndex = 0;
        this.isCancelled = false;
        this.protectedElements = [];
    }

    async execute() {
        if (this.isCancelled) {
            return;
        }

        try {
            // 执行所有步骤
            for (let i = 0; i < this.steps.length; i++) {
                if (this.isCancelled) break;
                
                this.currentStepIndex = i;
                const step = this.steps[i];
                
                // 保护步骤中涉及的DOM元素
                if (step.element) {
                    this.system.protectElement(step.element);
                    this.protectedElements.push(step.element);
                }
                
                // 执行步骤
                await step.execute(this);
                
                // 如果步骤标记为需要等待，等待完成
                if (step.wait !== false) {
                    await step.waitForCompletion?.();
                }
            }

            // 执行完成回调
            if (this.options.onComplete) {
                this.options.onComplete();
            }
        } catch (error) {
            if (this.options.onError) {
                this.options.onError(error);
            } else {
                console.error('Animation error:', error);
            }
        } finally {
            // 清理
            this.cleanup();
        }
    }

    async cancel() {
        this.isCancelled = true;
        
        // 取消当前步骤
        if (this.steps[this.currentStepIndex]) {
            await this.steps[this.currentStepIndex].cancel?.();
        }
        
        this.cleanup();
    }

    cleanup() {
        // 取消保护所有元素
        this.protectedElements.forEach(el => {
            this.system.unprotectElement(el);
        });
        this.protectedElements = [];
        
        // 从系统中移除
        this.system.activeAnimations.delete(this.id);
    }
}

/**
 * 动画步骤基类
 */
export class AnimationStep {
    constructor(config = {}) {
        this.element = config.element || null;
        this.duration = config.duration || 0;
        this.wait = config.wait !== false; // 默认等待完成
        this.onStart = config.onStart;
        this.onComplete = config.onComplete;
    }

    async execute(instance) {
        if (this.onStart) {
            this.onStart(instance);
        }
    }

    async waitForCompletion() {
        if (this.duration > 0) {
            return new Promise(resolve => setTimeout(resolve, this.duration));
        }
    }
}

/**
 * 飞行动画步骤
 */
export class FlyStep extends AnimationStep {
    constructor(config) {
        super(config);
        this.fromElement = config.fromElement;
        this.toElement = config.toElement;
        this.fromPosition = config.fromPosition; // {x, y}
        this.toPosition = config.toPosition; // {x, y}
        this.duration = config.duration || 700;
        this.noRotation = config.noRotation || false; // 是否禁用旋转
        this.onProgress = config.onProgress; // 进度回调 (progress: 0-1)
        this.finalContainer = config.finalContainer; // 最终容器（可选）
        this.finalPosition = config.finalPosition; // 最终位置 {x, y, rotation}（可选）
        this.finalClassName = config.finalClassName; // 最终类名（可选）
        this.flyingElement = null;
    }

    async execute(instance) {
        super.execute(instance);
        this.instance = instance; // 保存instance引用
        
        // 获取起始和结束位置
        const from = this.fromPosition || this.getPosition(this.fromElement);
        const to = this.toPosition || this.getPosition(this.toElement);
        
        if (!from || !to) {
            throw new Error('FlyStep: Missing from or to position');
        }

        // 直接使用源元素，不创建副本
        this.flyingElement = this.fromElement;
        if (!this.flyingElement.parentNode) {
            document.body.appendChild(this.flyingElement);
        }
        
        // 确保飞行元素有正确的样式
        this.flyingElement.style.position = 'fixed';
        this.flyingElement.style.zIndex = '10000';
        this.flyingElement.style.pointerEvents = 'none';
        this.flyingElement.style.transition = 'none';
        this.flyingElement.style.willChange = 'transform, opacity';
        
        // 执行飞行动画
        await this.animateFlight(from, to);
        
        // 如果指定了最终容器和位置，将元素转换为最终状态
        if (this.finalContainer && this.finalPosition) {
            this.convertToFinalState();
        }
    }

    getPosition(element) {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    /**
     * 将飞行元素转换为最终状态（从fixed定位转为absolute定位在容器内）
     */
    convertToFinalState() {
        if (!this.flyingElement || !this.finalContainer) return;
        
        const finalX = this.finalPosition.x;
        const finalY = this.finalPosition.y;
        
        // 更新类名
        if (this.finalClassName) {
            this.flyingElement.className = this.finalClassName;
        }
        
        // 禁用所有过渡，直接设置最终状态，不要额外动画
        this.flyingElement.style.transition = 'none';
        this.flyingElement.style.willChange = 'auto';
        
        // 移动到最终容器
        if (this.flyingElement.parentNode !== this.finalContainer) {
            this.finalContainer.appendChild(this.flyingElement);
        }
        
        // 直接设置最终状态，不要任何延迟或过渡
        this.flyingElement.style.position = 'absolute';
        this.flyingElement.style.left = `${finalX}px`;
        this.flyingElement.style.top = `${finalY}px`;
        this.flyingElement.style.zIndex = '1';
        this.flyingElement.style.pointerEvents = 'auto';
        
        // 设置旋转
        if (this.finalPosition.rotation !== undefined) {
            this.flyingElement.style.setProperty('--card-rotation', `${this.finalPosition.rotation}deg`);
            this.flyingElement.style.transform = `rotate(${this.finalPosition.rotation}deg)`;
        } else {
            this.flyingElement.style.transform = 'none';
        }
        
        // 调整尺寸
        this.flyingElement.style.width = '110px';
        this.flyingElement.style.height = '150px';
        
        // 恢复正常的过渡效果（用于hover等交互），但要在下一帧设置，避免影响当前状态
        requestAnimationFrame(() => {
            this.flyingElement.style.transition = 'all 0.5s ease';
        });
        
        // 调用完成回调
        if (this.onComplete) {
            this.onComplete(this.flyingElement);
        }
    }

    async animateFlight(from, to) {
        const startTime = performance.now();
        const deltaX = to.x - from.x;
        const deltaY = to.y - from.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        const maxHeight = Math.min(distance * 0.3, 150);
        const instance = this.instance;

        return new Promise(resolve => {
            const animate = (currentTime) => {
                if (instance?.isCancelled) {
                    resolve();
                    return;
                }

                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / this.duration, 1);
                
                // 缓动函数
                let easeProgress;
                if (progress < 0.5) {
                    easeProgress = 2 * progress * progress;
                } else {
                    easeProgress = 1 - Math.pow(-2 * progress + 2, 3) / 2;
                }
                
                // 计算位置
                const currentX = from.x + deltaX * easeProgress;
                let currentY;
                if (progress < 0.5) {
                    const upProgress = progress * 2;
                    const upEase = upProgress * upProgress;
                    currentY = from.y + deltaY * upEase - (maxHeight * upEase);
                } else {
                    const downProgress = (progress - 0.5) * 2;
                    const downEase = 1 - (1 - downProgress) * (1 - downProgress);
                    currentY = from.y + deltaY * easeProgress + (maxHeight * (1 - downEase));
                }
                
                // 旋转和缩放（如果不禁用旋转）
                let transform = 'translate(-50%, -50%)';
                if (!this.noRotation) {
                    let rotationSpeed = progress < 0.6 ? 720 : 720 + (progress - 0.6) / 0.4 * 180;
                    const rotation = angle + (progress * rotationSpeed);
                    const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
                    transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
                } else {
                    // 只应用轻微的缩放效果，不旋转
                    const scale = 1 + Math.sin(progress * Math.PI) * 0.1;
                    transform = `translate(-50%, -50%) scale(${scale})`;
                }
                
                // 应用变换
                this.flyingElement.style.left = `${currentX}px`;
                this.flyingElement.style.top = `${currentY}px`;
                this.flyingElement.style.transform = transform;
                
                // 阴影效果
                const shadowBlur = 10 + Math.sin(progress * Math.PI) * 10;
                const shadowOpacity = 0.3 + Math.sin(progress * Math.PI) * 0.2;
                this.flyingElement.style.boxShadow = `0 ${shadowBlur}px ${shadowBlur * 2}px rgba(0, 0, 0, ${shadowOpacity})`;
                
                // 调用进度回调
                if (this.onProgress) {
                    this.onProgress(progress);
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // 动画完成，resolve后会在execute中调用convertToFinalState
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    async cancel() {
        if (this.flyingElement && this.flyingElement.parentNode) {
            this.flyingElement.remove();
        }
    }
}

/**
 * 隐藏元素步骤
 */
export class HideStep extends AnimationStep {
    constructor(config) {
        super(config);
        this.element = config.element;
        this.method = config.method || 'opacity'; // 'opacity', 'remove', 'display'
    }

    async execute(instance) {
        super.execute(instance);
        
        if (!this.element) return;
        
        switch (this.method) {
            case 'opacity':
                this.element.style.opacity = '0';
                this.element.style.pointerEvents = 'none';
                break;
            case 'remove':
                if (this.element.parentNode) {
                    this.element.remove();
                }
                break;
            case 'display':
                this.element.style.display = 'none';
                break;
        }
    }
}

/**
 * 显示元素步骤
 */
export class ShowStep extends AnimationStep {
    constructor(config) {
        super(config);
        this.element = config.element;
        this.container = config.container;
        this.position = config.position; // {x, y, rotation}
        this.className = config.className || '';
        this.html = config.html || '';
        this.animation = config.animation; // CSS动画名称（可选，如果CSS中已定义则不需要）
        this.duration = config.duration || 0; // 如果为0，不等待
        this.wait = config.wait !== false && this.duration > 0; // 只有设置了duration才等待
    }

    async execute(instance) {
        super.execute(instance);
        
        if (!this.container) {
            throw new Error('ShowStep: container is required');
        }

        // 创建元素
        const element = document.createElement('div');
        element.className = this.className;
        element.innerHTML = this.html;
        
        // 设置位置
        if (this.position) {
            element.style.position = 'absolute';
            element.style.left = `${this.position.x}px`;
            element.style.top = `${this.position.y}px`;
            if (this.position.rotation !== undefined) {
                element.style.setProperty('--card-rotation', `${this.position.rotation}deg`);
            }
        }
        
        // 添加到容器（触发CSS动画，如果CSS中已定义）
        this.container.appendChild(element);
        
        // 保存创建的元素供后续使用
        this.createdElement = element;
        
        // 执行完成回调
        if (this.onComplete) {
            this.onComplete(element);
        }
    }
    
    async waitForCompletion() {
        // 如果duration为0，不等待（CSS动画会自动完成）
        if (this.duration > 0) {
            return new Promise(resolve => setTimeout(resolve, this.duration));
        }
        // 否则等待一帧，确保元素已添加到DOM
        return new Promise(resolve => requestAnimationFrame(resolve));
    }
}

/**
 * 延迟步骤
 */
export class DelayStep extends AnimationStep {
    constructor(duration) {
        super({ duration });
    }
}

/**
 * 回调步骤
 */
export class CallbackStep extends AnimationStep {
    constructor(callback) {
        super();
        this.callback = callback;
    }

    async execute(instance) {
        super.execute(instance);
        if (this.callback) {
            await this.callback(instance);
        }
    }
}

