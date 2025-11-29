import { GameMessageLog } from '../core/GameMessageLog.js';

/**
 * 日志系统
 * 负责管理游戏日志显示
 */
export class LogSystem {
    constructor(container, messageLog = null) {
        this.container = container;
        this.messageLog = messageLog || new GameMessageLog();
    }

    /**
     * 添加日志消息
     * @param {string} message - 消息内容
     * @param {string} source - 消息来源 ('player', 'opponent', 'system', 'game', 'commentator')
     * @param {object} options - 可选参数 (icon, color, stream, audioElement)
     *   - stream: 是否流式显示（逐字显示）
     *   - audioElement: 音频元素，用于在音频播放时逐字高亮
     */
    addLog(message, source = 'system', options = {}) {
        // 添加到消息日志
        const gameMessage = this.messageLog.addMessage(message, source, options);

        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `danmaku-item danmaku-${source}`;
        // 如果消息本身已包含图标，直接使用；否则使用GameMessage的显示文本
        const displayText = message.includes(gameMessage.icon) ? message : gameMessage.getDisplayText();
        messageEl.dataset.messageId = gameMessage.id;
        messageEl.dataset.source = source;

        // 设置颜色样式
        if (gameMessage.color) {
            messageEl.style.setProperty('--message-color', gameMessage.color);
        }

        // 添加到容器顶部
        const firstChild = this.container.firstChild;
        if (firstChild) {
            this.container.insertBefore(messageEl, firstChild);
        } else {
            this.container.appendChild(messageEl);
        }

        const persistent = options.persistent === true;

        // 限制同时显示的消息数量（最多4条，包括持久消息）
        const messages = this.container.querySelectorAll('.danmaku-item');
        if (messages.length >= 4) {
            // 如果超过4条，删除最旧的一条（最后添加的，因为是从顶部插入）
            const oldestMessage = messages[messages.length - 1];
            if (oldestMessage && oldestMessage.parentNode) {
                oldestMessage.remove();
            }
        }

        // 如果是流式显示
        if (options.stream) {
            this.streamMessage(messageEl, displayText, options.audioElement);
        } else {
            messageEl.textContent = displayText;
        }

        // 持久消息（如 TTS 解说字幕）不自动删除
        if (!persistent) {
            // 动画结束后移除元素（2.5秒动画 + 0.3秒缓冲）
            // 对于流式字幕，需要根据内容长度调整时间
            const removeDelay = options.stream ? Math.max(2800, displayText.length * 50 + 1000) : 2800;
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.remove();
                }
            }, removeDelay);
        }
    }

    /**
     * 流式显示消息（逐字显示）
     * @param {HTMLElement} messageEl - 消息元素
     * @param {string} text - 完整文本
     * @param {HTMLAudioElement|null} audioElement - 音频元素，用于在音频播放时逐字高亮
     */
    streamMessage(messageEl, text, audioElement = null) {
        let currentIndex = 0;
        const textArray = Array.from(text); // 支持emoji和中文
        const charSpans = []; // 保存所有字符span的引用
        
        // 创建内部HTML结构，用于支持逐字高亮
        const textContainer = document.createElement('span');
        textContainer.className = 'stream-text-container';
        messageEl.appendChild(textContainer);

        // 存储高亮状态
        let highlightStarted = false;

        // 流式显示函数
        const showNextChar = () => {
            if (currentIndex < textArray.length) {
                const char = textArray[currentIndex];
                const charSpan = document.createElement('span');
                charSpan.className = 'stream-char';
                charSpan.textContent = char;
                textContainer.appendChild(charSpan);
                charSpans.push(charSpan);
                currentIndex++;
                
                // 继续显示下一个字符
                requestAnimationFrame(() => {
                    setTimeout(showNextChar, 30); // 每30ms显示一个字符
                });
            }
        };

        // 如果提供了音频元素，在音频播放时开始高亮
        if (audioElement) {
            const startHighlighting = () => {
                if (highlightStarted) return;
                highlightStarted = true;

                // 获取音频时长
                const audioDuration = audioElement.duration || 0;
                if (audioDuration === 0) {
                    // 如果音频时长未知，等待一下再试
                    setTimeout(() => {
                        if (audioElement.duration > 0) {
                            startHighlighting();
                        }
                    }, 100);
                    return;
                }

                // 使用timeupdate事件来更新高亮
                const updateHighlight = () => {
                    if (audioElement.paused || audioElement.ended) {
                        return;
                    }

                    const currentTime = audioElement.currentTime;
                    const progress = currentTime / audioDuration;
                    const targetCount = Math.floor(progress * textArray.length);
                    
                    // 高亮当前应该高亮的字符
                    for (let i = 0; i < targetCount && i < charSpans.length; i++) {
                        if (!charSpans[i].classList.contains('highlighted')) {
                            charSpans[i].classList.add('highlighted');
                        }
                    }
                };

                // 监听音频播放进度
                audioElement.addEventListener('timeupdate', updateHighlight);
                
                // 音频结束时，确保所有字符都被高亮
                audioElement.addEventListener('ended', () => {
                    charSpans.forEach(span => span.classList.add('highlighted'));
                    audioElement.removeEventListener('timeupdate', updateHighlight);
                }, { once: true });

                // 立即执行一次更新
                updateHighlight();
            };

            // 检查音频状态并开始高亮
            if (audioElement.readyState >= 2 && !audioElement.paused) {
                // 音频已经开始播放
                startHighlighting();
            } else {
                // 等待音频开始播放
                audioElement.addEventListener('play', startHighlighting, { once: true });
                // 如果音频已经在播放但事件已触发，检查一下
                setTimeout(() => {
                    if (!audioElement.paused && audioElement.currentTime > 0) {
                        startHighlighting();
                    }
                }, 100);
            }
        }

        // 开始流式显示
        showNextChar();
    }


    /**
     * 清空日志
     */
    clear() {
        this.container.innerHTML = '';
        if (this.messageLog) {
            this.messageLog.clear();
        }
    }

    /**
     * 获取消息日志管理器
     */
    getMessageLog() {
        return this.messageLog;
    }
}

