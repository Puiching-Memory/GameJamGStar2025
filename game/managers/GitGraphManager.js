/**
 * GitGraph 管理器
 * 负责管理 GitGraph 的渲染、显示和错误处理
 */
class GitGraphManager {
    constructor(elements, gitGraphGenerator, logSystem) {
        this.elements = elements;
        this.gitGraphGenerator = gitGraphGenerator;
        this.logSystem = logSystem;
        this.mermaidInitialized = false;
    }

    /**
     * 显示 GitGraph 模态框
     */
    show() {
        if (!this.elements.gitGraphModal || !this.elements.gitGraphContainer) {
            return;
        }

        // 生成 GitGraph 代码
        const graphCode = this.gitGraphGenerator.getRecommendedGitGraph();
        
        // 显示模态框
        this.elements.gitGraphModal.style.display = 'block';
        
        // 清空容器
        this.elements.gitGraphContainer.innerHTML = '';
        
        // 渲染 GitGraph
        this.renderGitGraph(this.elements.gitGraphContainer, graphCode, false);
    }

    /**
     * 更新背景 GitGraph
     */
    updateBackground() {
        if (!this.elements.gitGraphBackground) {
            return;
        }

        // 如果还没有打出第一张牌，不显示git graph
        if (!this.gitGraphGenerator.gameState.cardPlayHistory || 
            this.gitGraphGenerator.gameState.cardPlayHistory.length === 0) {
            this.elements.gitGraphBackground.innerHTML = '';
            return;
        }

        // 生成 GitGraph 代码
        const graphCode = this.gitGraphGenerator.getRecommendedGitGraph();
        
        // 清空容器
        this.elements.gitGraphBackground.innerHTML = '';
        
        // 渲染背景 GitGraph
        this.renderGitGraph(this.elements.gitGraphBackground, graphCode, true);
    }

    /**
     * 渲染 GitGraph
     * @param {HTMLElement} container - 容器元素
     * @param {string} graphCode - GitGraph 代码
     * @param {boolean} isBackground - 是否为背景图
     */
    renderGitGraph(container, graphCode, isBackground = false) {
        // 如果 mermaid 未加载，显示原始代码
        if (typeof mermaid === 'undefined') {
            this.showGraphCode(container, graphCode);
            return;
        }

        // 创建 mermaid 容器
        const mermaidDiv = document.createElement('div');
        mermaidDiv.className = isBackground ? 'mermaid gitgraph-bg' : 'mermaid';
        mermaidDiv.textContent = graphCode;
        container.appendChild(mermaidDiv);

        // 初始化 mermaid（如果需要）
        if (!this.mermaidInitialized && isBackground) {
            this.initializeMermaid();
        }

        // 渲染
        try {
            const id = (isBackground ? 'gitgraph-bg-' : 'gitgraph-') + Date.now();
            mermaidDiv.id = id;

            if (mermaid.run) {
                // 使用新的 API
                mermaid.run({
                    nodes: [mermaidDiv],
                    suppressErrors: true
                }).then(() => {
                    // 检查错误
                    this.checkForErrors(mermaidDiv, isBackground);
                }).catch(err => {
                    this.handleRenderError(err, container, graphCode, isBackground);
                });
            } else {
                // 回退到旧 API
                try {
                    if (!isBackground && !mermaid.initialize) {
                        mermaid.initialize({ startOnLoad: false });
                    }
                    mermaid.init(undefined, mermaidDiv);
                } catch (initErr) {
                    this.handleRenderError(initErr, container, graphCode, isBackground);
                }
            }
        } catch (err) {
            this.handleRenderError(err, container, graphCode, isBackground);
        }
    }

    /**
     * 初始化 Mermaid（用于背景图）
     */
    initializeMermaid() {
        if (window.mermaidInitialized) {
            return;
        }

        mermaid.initialize({ 
            startOnLoad: false,
            theme: 'dark',
            gitGraph: {
                theme: 'base',
                themeVariables: {
                    // main 分支使用鲜艳的紫色（游戏主题色）
                    git0: '#667eea',
                    // opponent 分支使用鲜艳的红色
                    git1: '#f85149',
                    // 其他分支颜色
                    git2: '#3fb950',
                    git3: '#58a6ff',
                    git4: '#f0883e',
                    git5: '#a5a5ff',
                    git6: '#ff7b72',
                    git7: '#79c0ff',
                    // 通用颜色设置
                    primaryColor: '#667eea',
                    primaryTextColor: '#fff',
                    primaryBorderColor: '#764ba2',
                    lineColor: '#667eea',
                    secondaryColor: '#764ba2',
                    tertiaryColor: '#1a1a2e',
                    commitLabelColor: '#fff',
                    commitLabelBackground: '#667eea',
                    commitLabelFontSize: '14px',
                    tagLabelColor: '#fff',
                    tagLabelBackground: '#764ba2',
                    tagLabelBorder: '#667eea',
                    tagLabelFontSize: '14px',
                    branchLabelColor: '#fff',
                    branchLabelBackground: '#667eea',
                    branchLabelFontSize: '14px'
                }
            }
        });
        window.mermaidInitialized = true;
        this.mermaidInitialized = true;
    }

    /**
     * 检查渲染后的错误
     */
    checkForErrors(mermaidDiv, isBackground) {
        setTimeout(() => {
            const prefix = isBackground ? '背景 ' : '';
            
            // 检查 SVG 中的错误文本
            const svg = mermaidDiv.querySelector('svg');
            if (svg) {
                const textElements = svg.querySelectorAll('text');
                textElements.forEach(textEl => {
                    const text = (textEl.textContent || textEl.innerText || '').trim();
                    if (text && this.isErrorText(text)) {
                        this.logError(`${prefix}GitGraph 语法错误: ${text}`);
                    }
                });
            }
            
            // 检查错误类名的元素
            const errorElements = mermaidDiv.querySelectorAll(
                '[class*="error"], [class*="syntax"], .error-text'
            );
            if (errorElements.length > 0) {
                errorElements.forEach(errorEl => {
                    const errorText = (errorEl.textContent || errorEl.innerText || '').trim();
                    if (errorText && errorText.length > 0) {
                        this.logError(`${prefix}GitGraph 错误: ${errorText}`);
                    }
                });
            }
        }, 500);
    }

    /**
     * 判断是否为错误文本
     */
    isErrorText(text) {
        const lowerText = text.toLowerCase();
        return (
            lowerText.includes('syntax error') ||
            lowerText.includes('error in text') ||
            (lowerText.includes('error') && text.length < (text.includes('background') ? 100 : 200))
        );
    }

    /**
     * 处理渲染错误
     */
    handleRenderError(err, container, graphCode, isBackground) {
        const prefix = isBackground ? '背景 ' : '';
        const errorMessage = err?.message || err?.toString() || '未知错误';
        
        console.error(`${prefix}GitGraph 渲染错误:`, err);
        this.logError(`${prefix}GitGraph 渲染错误: ${errorMessage}`);
        
        if (!isBackground) {
            this.showGraphCode(container, graphCode);
        }
    }

    /**
     * 显示 GitGraph 代码（当 mermaid 不可用时）
     */
    showGraphCode(container, graphCode) {
        container.innerHTML = '';
        const codeBlock = document.createElement('pre');
        codeBlock.className = 'gitgraph-code';
        codeBlock.textContent = graphCode;
        container.appendChild(codeBlock);
    }

    /**
     * 记录错误到日志系统
     */
    logError(message) {
        if (this.logSystem) {
            this.logSystem.addLog({
                userMessage: '', // GitGraph错误不显示在弹幕
                devMessage: `[GitGraph Error] ${message} | Timestamp: ${new Date().toISOString()}`
            }, 'system', { icon: '⚠️', color: '#ef4444' });
        }
    }
}

