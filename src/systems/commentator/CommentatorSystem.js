import OpenAI from 'openai';
import { CommentatorConfig } from './CommentatorConfig.js';
import { CommentatorEvents } from './CommentatorEvents.js';

/**
 * AI解说员系统
 * 使用OpenAI生成游戏解说
 */
export class CommentatorSystem {
    constructor(config = null) {
        this.config = config || new CommentatorConfig();
        this.events = new CommentatorEvents();
        this.openai = null;
        this.commentaryHistory = [];
        this.isGenerating = false;

        // 初始化OpenAI客户端
        if (this.config.enabled && this.config.apiKey) {
            try {
                this.openai = new OpenAI({
                    apiKey: this.config.apiKey,
                    dangerouslyAllowBrowser: true // 注意：在生产环境中应该使用后端代理
                });
            } catch (error) {
                console.warn('Failed to initialize OpenAI client:', error);
                this.config.enabled = false;
            }
        }
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
            
            // 调用OpenAI API
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
        const stylePrompts = {
            'enthusiastic': '你是一个充满激情的游戏解说员，用生动有趣的语言解说游戏过程。',
            'professional': '你是一个专业的游戏解说员，用准确清晰的语言解说游戏过程。',
            'casual': '你是一个轻松随意的游戏解说员，用幽默风趣的语言解说游戏过程。'
        };

        return `${stylePrompts[this.config.style] || stylePrompts.enthusiastic}
你正在解说一个基于Git操作的卡牌对战游戏。
请用简洁的中文（${this.config.maxTokens}字以内）解说游戏中的关键事件。
解说应该有趣、生动，能够增强玩家的游戏体验。`;
    }

    /**
     * 构建用户提示词
     */
    buildPrompt(eventTexts, gameState) {
        let prompt = '最近的游戏事件：\n';
        eventTexts.forEach((text, index) => {
            prompt += `${index + 1}. ${text}\n`;
        });

        if (gameState) {
            const summary = this.events.getGameStateSummary(gameState);
            prompt += `\n当前游戏状态：\n`;
            prompt += `- 玩家生命值：${summary.playerHealth}，能量：${summary.playerMana}\n`;
            prompt += `- 对手生命值：${summary.opponentHealth}，能量：${summary.opponentMana}\n`;
            prompt += `- 当前回合：${summary.turn === 'player' ? '玩家' : '对手'}，回合数：${summary.turnNumber}\n`;
        }

        prompt += '\n请为这些事件生成一段简短的解说：';

        return prompt;
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
        
        // 重新初始化OpenAI客户端
        if (this.config.enabled && this.config.apiKey && !this.openai) {
            try {
                this.openai = new OpenAI({
                    apiKey: this.config.apiKey,
                    dangerouslyAllowBrowser: true
                });
            } catch (error) {
                console.warn('Failed to reinitialize OpenAI client:', error);
                this.config.enabled = false;
            }
        }
    }
}

