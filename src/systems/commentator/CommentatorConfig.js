/**
 * AI解说员配置
 */
export class CommentatorConfig {
    constructor() {
        // Qwen API配置
        // 获取API Key：https://help.aliyun.com/zh/model-studio/get-api-key
        this.apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY || import.meta.env.DASHSCOPE_API_KEY || '';
        // 模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
        this.model = 'qwen-plus'; // 使用Qwen Plus模型
        // 北京地域base_url，如果使用新加坡地域的模型，需要将base_url替换为：https://dashscope-intl.aliyuncs.com/compatible-mode/v1
        this.baseURL = import.meta.env.VITE_DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
        this.maxTokens = 50; // 一个句子，20-40字
        this.temperature = 0.9; // 增加创造性和口语化
        
        // TTS（文本转语音）配置
        // 使用同一个DASHSCOPE_API_KEY，无需单独配置
        // 参考文档：https://bailian.console.aliyun.com
        this.ttsEnabled = !!this.apiKey; // 如果配置了API Key，自动启用TTS
        this.ttsVoice = 'Eric'; // 语音类型：Eric、Cherry、Xiaoyun等，参考DashScope文档
        this.ttsLanguageType = 'Chinese'; // 语言类型，建议与文本语种一致
        this.ttsVolume = 0.7; // TTS音量（0-1）
        
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

