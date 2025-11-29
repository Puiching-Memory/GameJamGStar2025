import { CommentatorConfig } from './CommentatorConfig.js';
import { CommentatorEvents } from './CommentatorEvents.js';
import { TTSService } from './TTSService.js';

/**
 * AI解说员系统
 * 使用后端 FastAPI 服务器生成游戏解说
 */
export class CommentatorSystem {
    constructor(config = null) {
        this.config = config || new CommentatorConfig();
        this.events = new CommentatorEvents();
        this.commentaryHistory = [];
        this.isGenerating = false;
        this.ttsService = null;
        this.audioSystem = null; // 稍后通过setAudioSystem设置

        // 初始化TTS服务
        if (this.config.ttsEnabled) {
            this.ttsService = new TTSService();
        }
    }

    /**
     * 设置音频系统（用于播放TTS语音）
     * @param {AudioSystem} audioSystem - 音频系统实例
     */
    setAudioSystem(audioSystem) {
        this.audioSystem = audioSystem;
    }

    /**
     * 记录游戏事件
     */
    recordEvent(type, data) {
        this.events.recordEvent(type, data);
    }

    /**
     * 生成解说
     * @param {object} gameState - 游戏状态
     * @returns {Promise<string|null>} 解说文本，如果失败返回null
     */
    async generateCommentary(gameState = null) {
        if (!this.config.enabled || this.isGenerating) {
            return null;
        }

        this.isGenerating = true;

        try {
            // 获取最近的事件
            const recentEvents = this.events.getRecentEvents(5);
            
            // 调用后端 API 生成解说
            const commentary = await this.generateCommentaryFromBackend(recentEvents, gameState);
            
            if (commentary) {
                // 保存纯文本到历史记录
                this.commentaryHistory.push({
                    text: commentary,
                    timestamp: Date.now()
                });
                
                // 限制历史记录长度
                if (this.commentaryHistory.length > 20) {
                    this.commentaryHistory.shift();
                }

                // 返回解说文本和音频元素（如果启用TTS）
                let audioElement = null;
                if (this.ttsService && this.config.ttsEnabled) {
                    // 使用纯文本进行TTS（SSML 不支持流式调用，已移除）
                    audioElement = await this.playCommentarySpeech(commentary);
                }

                // 返回包含文本和音频元素的对象
                return {
                    text: commentary,  // 纯文本，用于UI显示和TTS
                    audioElement: audioElement
                };
            }

            return null;
        } catch (error) {
            console.error('Failed to generate commentary:', error);
            return null;
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * 从后端 API 生成解说
     * @param {Array} events - 事件列表
     * @param {object} gameState - 游戏状态
     * @returns {Promise<string|null>} 解说文本
     */
    async generateCommentaryFromBackend(events, gameState) {
        const response = await fetch('/api/commentary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                events: events,
                game_state: gameState,
                model: this.config.model,
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature
            })
        });

        if (!response.ok) {
            if (response.status === 503) {
                // 后端服务不可用
                throw new Error('后端服务不可用');
            }
            const errorText = await response.text();
            throw new Error(`后端 API 请求失败: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        // 返回纯文本（SSML 不支持流式调用，已移除）
        return result.commentary || null;
    }


    /**
     * 播放解说语音
     * @param {string} commentary - 解说文本
     * @returns {Promise<HTMLAudioElement|null>} 返回音频元素，用于字幕同步
     */
    async playCommentarySpeech(commentary) {
        if (!this.ttsService || !commentary) {
            return null;
        }

        try {
            // 使用TTS服务将文本转换为语音并播放，返回音频元素用于字幕同步
            // 约定：TTS 具体参数（model / voice 等）只在 Python 端配置，这里仅控制播放行为
            const audio = await this.ttsService.speak(commentary, {
                volume: this.config.ttsVolume,
                returnAudio: true // 返回音频元素
            });
            return audio || null;
        } catch (error) {
            console.warn('Failed to play commentary speech:', error);
            return null;
        }
    }

    /**
     * 清空历史记录
     */
    clear() {
        this.events.clear();
        this.commentaryHistory = [];
    }

    /**
     * 更新配置
     */
    updateConfig(config) {
        this.config.update(config);
        
        // 重新初始化TTS服务
        if (this.config.ttsEnabled) {
            this.ttsService = new TTSService();
        }
    }
}

