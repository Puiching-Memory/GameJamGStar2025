/**
 * 拖拽处理
 * 负责处理卡牌拖拽交互
 */
export class DragDrop {
    constructor(dropZone, options = {}) {
        this.dropZone = dropZone;
        this.onDrop = options.onDrop || null;
        this.setup();
    }

    /**
     * 设置拖拽事件
     */
    setup() {
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('drag-over');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');

            // 获取鼠标在played-cards-container中的位置
            const playedCardsContainer = this.dropZone.querySelector('.played-cards-container');
            let dropPosition = null;
            
            if (playedCardsContainer) {
                const containerRect = playedCardsContainer.getBoundingClientRect();
                const cardWidth = 110;
                const cardHeight = 150;
                
                // 计算鼠标位置相对于容器的坐标
                const x = e.clientX - containerRect.left - cardWidth / 2;
                const y = e.clientY - containerRect.top - cardHeight / 2;
                
                // 确保位置在容器范围内
                const maxX = Math.max(0, containerRect.width - cardWidth);
                const maxY = Math.max(0, containerRect.height - cardHeight);
                
                dropPosition = {
                    x: Math.max(0, Math.min(x, maxX)),
                    y: Math.max(0, Math.min(y, maxY)),
                    rotation: (Math.random() - 0.5) * 30 // 保持随机旋转角度
                };
            }

            if (this.onDrop) {
                this.onDrop(e, dropPosition);
            }
        });
    }

    /**
     * 设置拖拽回调
     */
    setOnDrop(callback) {
        this.onDrop = callback;
    }
}

