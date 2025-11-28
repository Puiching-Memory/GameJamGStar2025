import mermaid from 'mermaid';

/**
 * Git Graph渲染器
 * 负责渲染mermaid git graph图表
 */
export class GitGraphRenderer {
    constructor(containerElement) {
        this.container = containerElement;
        this.mermaidInitialized = false;
    }

    /**
     * 初始化mermaid
     */
    async initializeMermaid() {
        if (this.mermaidInitialized) {
            return;
        }

        // 初始化mermaid
        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            gitGraph: {
                theme: 'base',
                themeVariables: {
                    git0: '#2ea043',
                    git1: '#1f6feb',
                    git2: '#f85149',
                    gitBranchLabel0: '#2ea043',
                    gitBranchLabel1: '#1f6feb',
                    gitBranchLabel2: '#f85149',
                    commitLabelColor: '#ffffff',
                    commitLabelBackground: '#21262d',
                    commitLabelFontSize: '12px'
                }
            }
        });
        this.mermaidInitialized = true;
    }

    /**
     * 渲染git graph
     * @param {string} mermaidCode - mermaid代码
     */
    async render(mermaidCode) {
        if (!this.container) {
            console.warn('GitGraphRenderer: container element not found');
            return;
        }

        try {
            await this.initializeMermaid();

            // 如果已有图表，标记为淡出，但不立即删除
            const existingMermaid = this.container.querySelector('.mermaid');
            if (existingMermaid) {
                existingMermaid.classList.add('updating');
            }

            // 创建新的mermaid容器（不删除旧的，实现交错过渡）
            const mermaidDiv = document.createElement('div');
            mermaidDiv.className = 'mermaid entering';
            mermaidDiv.textContent = mermaidCode;
            this.container.appendChild(mermaidDiv);

            // 渲染mermaid图表
            // 使用mermaid.run()来渲染图表（mermaid 10.x API）
            try {
                await mermaid.run({
                    nodes: [mermaidDiv]
                });
                console.log('GitGraphRenderer: Graph rendered successfully');
            } catch (runError) {
                // 如果run方法失败，尝试使用render方法（兼容旧版本）
                console.warn('mermaid.run() failed, trying render()', runError);
                const id = 'mermaid-' + Date.now();
                mermaidDiv.id = id;
                const { svg } = await mermaid.render(id, mermaidCode);
                mermaidDiv.innerHTML = svg;
                console.log('GitGraphRenderer: Graph rendered using render() method');
            }
            
            // 动画完成后移除 entering 类，并删除旧的图表
            setTimeout(() => {
                mermaidDiv.classList.remove('entering');
                // 删除旧的图表（如果存在）
                const oldMermaid = this.container.querySelector('.mermaid.updating');
                if (oldMermaid && oldMermaid !== mermaidDiv) {
                    oldMermaid.remove();
                }
            }, 200);
        } catch (error) {
            console.error('GitGraphRenderer: Failed to render graph', error);
            this.container.innerHTML = '<div class="error">无法加载Git图表: ' + error.message + '</div>';
        }
    }

    /**
     * 清空图表
     */
    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

