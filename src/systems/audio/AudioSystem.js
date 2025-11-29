import { AudioManager } from './AudioManager.js';
import { SoundEffects } from './SoundEffects.js';

/**
 * 音效系统
 * 负责播放游戏音效
 */
export class AudioSystem {
    constructor(options = {}) {
        this.enabled = options.enabled !== false; // 默认启用
        this.volume = options.volume !== undefined ? options.volume : 0.5; // 默认音量50%
        this.audioManager = new AudioManager();
        this.currentSounds = new Map(); // 当前正在播放的音效
    }

    /**
     * 初始化音效系统
     * 预加载常用音效
     */
    async initialize() {
        if (!this.enabled) return;

        // 预加载常用音效
        const commonSounds = [
            SoundEffects.CARD_PLAY,
            SoundEffects.CARD_DRAW,
            SoundEffects.DAMAGE,
            SoundEffects.HEAL,
            SoundEffects.BUFF_APPLY,
            SoundEffects.BUFF_REMOVE,
            SoundEffects.BUTTON_CLICK,
            SoundEffects.GAME_START,
            SoundEffects.GAME_OVER,
            SoundEffects.TURN_START,
            SoundEffects.TURN_END,
            SoundEffects.VICTORY,
            SoundEffects.DEFEAT,
            SoundEffects.ERROR,
            SoundEffects.CRITICAL_HIT
        ];

        try {
            await this.audioManager.preloadSounds(commonSounds);
        } catch (error) {
            console.warn('Failed to preload some sounds:', error);
        }
    }

    /**
     * 播放音效
     * @param {string} soundId - 音效ID
     * @param {object} options - 播放选项 {volume, loop, onEnd}
     * @returns {Promise<void>}
     */
    async play(soundId, options = {}) {
        if (!this.enabled) return;

        try {
            // 加载音频（如果未加载）
            let audio = this.audioManager.getSound(soundId);
            if (!audio) {
                audio = await this.audioManager.loadSound(soundId);
                if (!audio) return; // 加载失败
            }

            // 克隆音频元素以支持同时播放多个相同音效
            const audioClone = audio.cloneNode();
            
            // 设置音量
            const volume = options.volume !== undefined ? options.volume : this.volume;
            audioClone.volume = Math.max(0, Math.min(1, volume));
            
            // 设置循环
            if (options.loop) {
                audioClone.loop = true;
            }

            // 播放
            const playPromise = audioClone.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // 播放成功
                        if (options.onEnd) {
                            audioClone.addEventListener('ended', options.onEnd, { once: true });
                        }
                    })
                    .catch(error => {
                        // 播放失败（可能是用户交互限制）
                        console.warn(`Failed to play sound: ${soundId}`, error);
                    });
            }

            // 记录当前播放的音效
            const soundKey = `${soundId}_${Date.now()}`;
            this.currentSounds.set(soundKey, audioClone);

            // 播放结束后清理
            audioClone.addEventListener('ended', () => {
                this.currentSounds.delete(soundKey);
            }, { once: true });

        } catch (error) {
            console.warn(`Error playing sound: ${soundId}`, error);
        }
    }

    /**
     * 停止播放音效
     * @param {string} soundId - 音效ID（可选，不提供则停止所有）
     */
    stop(soundId = null) {
        if (soundId) {
            // 停止特定音效的所有实例
            for (const [key, audio] of this.currentSounds.entries()) {
                if (key.startsWith(soundId)) {
                    audio.pause();
                    audio.currentTime = 0;
                    this.currentSounds.delete(key);
                }
            }
        } else {
            // 停止所有音效
            for (const audio of this.currentSounds.values()) {
                audio.pause();
                audio.currentTime = 0;
            }
            this.currentSounds.clear();
        }
    }

    /**
     * 设置音量
     * @param {number} volume - 音量（0-1）
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        // 更新所有正在播放的音效音量
        for (const audio of this.currentSounds.values()) {
            audio.volume = this.volume;
        }
    }

    /**
     * 启用/禁用音效
     * @param {boolean} enabled - 是否启用
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stop(); // 禁用时停止所有音效
        }
    }

    /**
     * 清理资源
     */
    cleanup() {
        this.stop();
        this.audioManager.clearCache();
    }
}

