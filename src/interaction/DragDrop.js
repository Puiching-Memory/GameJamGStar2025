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

            if (this.onDrop) {
                this.onDrop(e);
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

