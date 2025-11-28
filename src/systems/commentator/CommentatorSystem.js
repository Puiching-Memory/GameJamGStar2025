import OpenAI from 'openai';
import { CommentatorConfig } from './CommentatorConfig.js';
import { CommentatorEvents } from './CommentatorEvents.js';
import { TTSService } from './TTSService.js';

/**
 * AI解说员系统
 * 使用Qwen（通义千问）生成游戏解说
 */
export class CommentatorSystem {
    constructor(config = null) {
        this.config = config || new CommentatorConfig();
        this.events = new CommentatorEvents();
        this.openai = null;
        this.commentaryHistory = [];
        this.isGenerating = false;
        this.ttsService = null;
        this.audioSystem = null; // 稍后通过setAudioSystem设置

        // 初始化OpenAI客户端（兼容Qwen API）
        if (this.config.enabled && this.config.apiKey) {
            try {
                this.openai = new OpenAI({
                    apiKey: this.config.apiKey,
                    baseURL: this.config.baseURL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
                    dangerouslyAllowBrowser: true // 注意：在生产环境中应该使用后端代理
                });
            } catch (error) {
                console.warn('Failed to initialize Qwen client:', error);
                this.config.enabled = false;
            }
        }

        // 初始化TTS服务（使用同一个DASHSCOPE_API_KEY）
        if (this.config.ttsEnabled && this.config.apiKey) {
            // 从baseURL提取基础URL（去掉/compatible-mode/v1部分）
            const ttsBaseURL = this.config.baseURL?.replace('/compatible-mode/v1', '') || null;
            this.ttsService = new TTSService(this.config.apiKey, ttsBaseURL);
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
        if (!this.config.enabled || !this.openai || this.isGenerating) {
            return null;
        }

        this.isGenerating = true;

        try {
            // 获取最近的事件
            const recentEvents = this.events.getRecentEvents(5);
            const eventTexts = recentEvents.map(e => this.events.eventToText(e)).filter(Boolean);
            
            // 构建提示词
            const prompt = this.buildPrompt(eventTexts, gameState);
            
            // 调用Qwen API
            const response = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: this.getSystemPrompt()
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature
            });

            const commentary = response.choices[0]?.message?.content?.trim();
            
            if (commentary) {
                this.commentaryHistory.push({
                    text: commentary,
                    timestamp: Date.now()
                });
                
                // 限制历史记录长度
                if (this.commentaryHistory.length > 20) {
                    this.commentaryHistory.shift();
                }

                // 如果启用了TTS，等待音频生成完成后再返回
                if (this.ttsService && this.config.ttsEnabled) {
                    await this.playCommentarySpeech(commentary);
                }
            }

            return commentary || null;
        } catch (error) {
            console.error('Failed to generate commentary:', error);
            return null;
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * 构建系统提示词
     */
    getSystemPrompt() {
        return `你是世界级电竞赛事解说员（参考CS:GO、LOL风格），正在解说Git卡牌对战。

【核心要求】
- **只输出一个句子**，控制在20-40字以内
- **口语化表达**，像现场解说一样自然流畅
- **情绪饱满**，用感叹、强调营造紧张感
- **精准描述**，突出关键操作和数值

【口语化风格示例】
- "漂亮！玩家一记Push打出10点伤害！"
- "注意看，对手血量只剩25了，危险！"
- "这波Merge很关键，15点伤害直接压血线！"
- "玩家能量不够了，这回合只能防守。"
- "对手用了Rebase，12点伤害还抽了张牌，赚了！"

【输出格式】
- 只输出一个完整的口语化句子
- 不要分段、不要列表、不要多余标点
- 直接说重点，像现场解说一样脱口而出

用中文，一个句子，口语化，有情绪。`;
    }

    /**
     * 构建用户提示词
     */
    buildPrompt(eventTexts, gameState) {
        let prompt = '【最近事件】\n';
        eventTexts.forEach((text, index) => {
            prompt += `${index + 1}. ${text}\n`;
        });

        if (gameState) {
            const summary = this.events.getGameStateSummary(gameState);
            const playerHealthPercent = Math.round((summary.playerHealth / 100) * 100);
            const opponentHealthPercent = Math.round((summary.opponentHealth / 100) * 100);
            
            prompt += `\n【当前战况】\n`;
            prompt += `- 玩家：${summary.playerHealth}HP (${playerHealthPercent}%) | ${summary.playerMana}能量\n`;
            prompt += `- 对手：${summary.opponentHealth}HP (${opponentHealthPercent}%) | ${summary.opponentMana}能量\n`;
            prompt += `- 回合：第${summary.turnNumber}回合，${summary.turn === 'player' ? '玩家' : '对手'}回合\n`;
            
            // 添加关键状态提示
            const criticalStates = [];
            if (summary.playerHealth <= 30) {
                criticalStates.push('玩家血量告急！');
            }
            if (summary.opponentHealth <= 30) {
                criticalStates.push('对手血量告急！');
            }
            if (summary.playerMana <= 2) {
                criticalStates.push('玩家能量不足');
            }
            if (summary.opponentMana <= 2) {
                criticalStates.push('对手能量不足');
            }
            if (criticalStates.length > 0) {
                prompt += `- ⚠️ 关键状态：${criticalStates.join('，')}\n`;
            }
        }

        prompt += '\n【输出要求】\n';
        prompt += `只输出一个口语化句子，20-40字，像现场解说一样脱口而出。`;
        prompt += `重点说：关键操作、伤害数值、血量变化、能量状态。`;
        prompt += `不要分段，不要列表，直接说重点！`;

        return prompt;
    }

    /**
     * 播放解说语音
     * @param {string} commentary - 解说文本
     */
    async playCommentarySpeech(commentary) {
        if (!this.ttsService || !commentary) {
            return;
        }

        try {
            // 使用TTS服务将文本转换为语音并播放
            await this.ttsService.speak(commentary, {
                volume: this.config.ttsVolume,
                ttsOptions: {
                    voice: this.config.ttsVoice,
                    language_type: this.config.ttsLanguageType
                }
            });
        } catch (error) {
            console.warn('Failed to play commentary speech:', error);
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
        
        // 重新初始化Qwen客户端
        if (this.config.enabled && this.config.apiKey && !this.openai) {
            try {
                this.openai = new OpenAI({
                    apiKey: this.config.apiKey,
                    baseURL: this.config.baseURL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
                    dangerouslyAllowBrowser: true
                });
            } catch (error) {
                console.warn('Failed to reinitialize Qwen client:', error);
                this.config.enabled = false;
            }
        }
    }
}

