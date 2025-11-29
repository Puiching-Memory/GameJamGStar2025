/**
 * AI解说员配置
 */
export class CommentatorConfig {
    constructor() {
        // 模型配置（传递给后端）
        this.model = 'qwen-plus'; // 使用Qwen Plus模型
        this.maxTokens = 50; // 一个句子，20-40字
        this.temperature = 0.9; // 增加创造性和口语化
        
        // TTS（文本转语音）配置
        // 参考文档：https://bailian.console.aliyun.com
        this.ttsEnabled = true; // 默认启用TTS
        // 与后端 CosyVoice 默认配置保持一致：cosyvoice-v3-plus + longanzhi_v3
        this.ttsVoice = 'longanzhi_v3';
        this.ttsLanguageType = 'Chinese'; // 语言类型，建议与文本语种一致
        this.ttsVolume = 0.7; // TTS音量（0-1）
        
        // 解说员风格
        this.style = 'enthusiastic'; // 'enthusiastic', 'professional', 'casual'
        this.language = 'zh-CN';
        
        // 是否启用（现在总是启用，因为API Key在后端配置）
        this.enabled = true;
    }

    /**
     * 更新配置
     */
    update(config) {
        Object.assign(this, config);
    }
}

