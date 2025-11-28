/**
 * 文本转语音服务（TTS）
 * 使用DashScope的qwen3-tts-flash模型将文本转换为语音
 * 参考文档：https://bailian.console.aliyun.com
 * 使用同一个DASHSCOPE_API_KEY，无需额外配置
 */
export class TTSService {
    constructor(apiKey, baseURL = null) {
        this.apiKey = apiKey;
        // 北京地域url，若使用新加坡地域的模型，需将url替换为：https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
        const defaultBaseURL = baseURL || 'https://dashscope.aliyuncs.com/api/v1';
        // 使用代理路径（通过Vite代理避免CORS问题）
        // 在生产环境中，应该使用后端代理
        this.baseURL = '/api/tts'; // Vite代理路径
        this.actualBaseURL = `${defaultBaseURL}/services/aigc/multimodal-generation/generation`; // 实际API地址（用于代理）
        this.model = 'qwen3-tts-flash';
        this.enabled = !!apiKey;
    }

    /**
     * 将文本转换为语音
     * @param {string} text - 要转换的文本
     * @param {object} options - 选项 {voice, language_type, stream}
     * @returns {Promise<Blob>} 音频Blob对象
     */
    async textToSpeech(text, options = {}) {
        if (!this.enabled || !text) {
            return null;
        }

        const {
            voice = 'Cherry', // 默认使用Cherry语音
            language_type = 'Chinese', // 建议与文本语种一致
            stream = false
        } = options;

        try {
            // 在开发环境使用代理，生产环境需要后端代理
            const apiURL = import.meta.env.DEV ? this.baseURL : this.actualBaseURL;
            
            const response = await fetch(apiURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    input: {
                        text: text,
                        voice: voice,
                        language_type: language_type
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn('TTS API request failed:', response.status, response.statusText, errorText);
                return null;
            }

            // DashScope API返回JSON格式，包含output.audio.url字段
            const result = await response.json();
            
            // 优先检查是否有音频URL（即使status_code不是200，也可能有URL）
            if (result.output?.audio?.url) {
                try {
                    // 通过代理获取音频文件，避免CORS问题
                    const audioUrl = result.output.audio.url;
                    let proxyUrl = audioUrl;
                    
                    // 如果是OSS URL（包含oss-cn-或oss-），使用代理路径
                    if (audioUrl.includes('oss-cn-') || audioUrl.includes('oss-')) {
                        try {
                            const url = new URL(audioUrl);
                            // 使用代理路径：/api/audio + 路径 + 查询参数
                            proxyUrl = `/api/audio${url.pathname}${url.search}`;
                        } catch (e) {
                            // URL解析失败，尝试简单替换
                            const match = audioUrl.match(/https?:\/\/[^\/]+(\/.+)/);
                            if (match) {
                                proxyUrl = `/api/audio${match[1]}`;
                            }
                        }
                    }
                    
                    const audioResponse = await fetch(proxyUrl);
                    if (audioResponse.ok) {
                        return await audioResponse.blob();
                    } else {
                        console.warn('Failed to fetch audio from URL:', audioResponse.status, audioResponse.statusText);
                        return null;
                    }
                } catch (error) {
                    console.warn('Error fetching audio from URL:', error);
                    return null;
                }
            }
            
            // 如果没有音频URL，检查错误状态
            if (result.status_code !== 200) {
                console.warn('TTS API returned error:', {
                    status_code: result.status_code,
                    code: result.code,
                    message: result.message,
                    full_response: result
                });
                return null;
            }
            
            console.warn('TTS API response missing audio URL. Full response:', result);
            return null;
        } catch (error) {
            console.warn('TTS conversion failed:', error);
            return null;
        }
    }

    /**
     * 将文本转换为语音并返回Audio对象
     * @param {string} text - 要转换的文本
     * @param {object} options - 选项
     * @returns {Promise<HTMLAudioElement|null>} Audio元素
     */
    async textToAudio(text, options = {}) {
        const audioBlob = await this.textToSpeech(text, options);
        if (!audioBlob) {
            return null;
        }

        try {
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            // 音频加载完成后清理URL
            audio.addEventListener('loadeddata', () => {
                // 延迟清理，确保音频可以播放
                setTimeout(() => {
                    URL.revokeObjectURL(audioUrl);
                }, 1000);
            }, { once: true });

            return audio;
        } catch (error) {
            console.warn('Failed to create audio from blob:', error);
            return null;
        }
    }

    /**
     * 播放文本转语音
     * @param {string} text - 要播放的文本
     * @param {object} options - 选项 {volume, onEnd}
     * @returns {Promise<void>} 等待音频加载完成并开始播放后返回
     */
    async speak(text, options = {}) {
        if (!this.enabled) {
            return;
        }

        const audio = await this.textToAudio(text, options.ttsOptions);
        if (!audio) {
            return;
        }

        // 设置音量
        if (options.volume !== undefined) {
            audio.volume = Math.max(0, Math.min(1, options.volume));
        }

        // 设置结束回调
        if (options.onEnd) {
            audio.addEventListener('ended', options.onEnd, { once: true });
        }

        // 等待音频加载完成
        return new Promise((resolve, reject) => {
            // 如果音频已经加载完成
            if (audio.readyState >= 2) {
                // 开始播放
                audio.play()
                    .then(() => resolve())
                    .catch(error => {
                        console.warn('Failed to play TTS audio:', error);
                        reject(error);
                    });
            } else {
                // 等待音频加载完成
                audio.addEventListener('loadeddata', () => {
                    // 开始播放
                    audio.play()
                        .then(() => resolve())
                        .catch(error => {
                            console.warn('Failed to play TTS audio:', error);
                            reject(error);
                        });
                }, { once: true });

                // 处理加载错误
                audio.addEventListener('error', (error) => {
                    console.warn('Failed to load TTS audio:', error);
                    reject(error);
                }, { once: true });
            }
        });
    }
}

