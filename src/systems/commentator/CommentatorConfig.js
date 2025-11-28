/**
 * AI解说员配置
 */
export class CommentatorConfig {
    constructor() {
        // OpenAI API配置
        this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
        this.model = 'gpt-4o-mini'; // 使用更经济的模型
        this.maxTokens = 150;
        this.temperature = 0.8; // 增加创造性
        
        // 解说员风格
        this.style = 'enthusiastic'; // 'enthusiastic', 'professional', 'casual'
        this.language = 'zh-CN';
        
        // 是否启用
        this.enabled = this.apiKey.length > 0;
    }

    /**
     * 更新配置
     */
    update(config) {
        Object.assign(this, config);
        this.enabled = this.apiKey.length > 0;
    }
}

