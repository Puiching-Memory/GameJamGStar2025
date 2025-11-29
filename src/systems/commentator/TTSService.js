/**
 * 文本转语音服务（TTS）
 * 使用后端 FastAPI 服务器的 TTS 服务（CosyVoice）
 * 参考文档：https://bailian.console.aliyun.com
 */
export class TTSService {
    constructor() {
        // 后端 TTS API 地址
        this.backendTTSURL = '/api/tts';
        this.enabled = true;
    }

    /**
     * 将文本转换为语音
     * @param {string} text - 要转换的文本
     * @returns {Promise<Blob>} 音频Blob对象
     *
     * 约定：JS 端不再设置任何 TTS 参数（voice、model 等），只把纯文本发给后端，
     *      所有具体 TTS 配置统一在 Python 端维护。
     */
    async textToSpeech(text) {
        if (!this.enabled || !text) {
            return null;
        }

        try {
            const response = await fetch(this.backendTTSURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn('后端 TTS API 请求失败:', response.status, errorText);
                return null;
            }

            // 后端直接返回音频流
            const blob = await response.blob();
            if (blob && blob.size > 0) {
                return blob;
            }
            
            return null;
        } catch (error) {
            console.warn('TTS 转换失败:', error);
            return null;
        }
    }

    /**
     * 将文本转换为语音并返回Audio对象
     * @param {string} text - 要转换的文本
     * @param {object} options - 选项（目前只用于控制播放，如音量等）
     * @returns {Promise<HTMLAudioElement|null>} Audio元素
     */
    async textToAudio(text, options = {}) {
        const audioBlob = await this.textToSpeech(text);
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
     * @param {object} options - 选项 {volume, onEnd, returnAudio}
     *   - volume: 音量 (0-1)
     *   - onEnd: 播放结束回调
     *   - returnAudio: 是否返回音频元素（用于字幕同步）
     * @returns {Promise<HTMLAudioElement|void>} 如果returnAudio为true，返回音频元素；否则返回void
     */
    async speak(text, options = {}) {
        if (!this.enabled) {
            return options.returnAudio ? null : undefined;
        }

        // 约定：options 只控制播放端行为（音量、回调等），不再向后端传递 TTS 参数
        const audio = await this.textToAudio(text);
        if (!audio) {
            return options.returnAudio ? null : undefined;
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
        const playPromise = new Promise((resolve, reject) => {
            // 如果音频已经加载完成
            if (audio.readyState >= 2) {
                // 开始播放
                audio.play()
                    .then(() => resolve(audio))
                    .catch(error => {
                        console.warn('Failed to play TTS audio:', error);
                        reject(error);
                    });
            } else {
                // 等待音频加载完成
                audio.addEventListener('loadeddata', () => {
                    // 开始播放
                    audio.play()
                        .then(() => resolve(audio))
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

        await playPromise;
        
        // 如果需要返回音频元素（用于字幕同步）
        if (options.returnAudio) {
            return audio;
        }
    }
}

