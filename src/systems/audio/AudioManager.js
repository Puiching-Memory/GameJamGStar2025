import { SoundFileMap } from './SoundEffects.js';

/**
 * 音频资源管理器
 * 负责加载和管理音频资源
 */
export class AudioManager {
    constructor() {
        this.audioCache = new Map(); // 音频缓存
        this.loadingPromises = new Map(); // 正在加载的Promise
    }

    /**
     * 预加载音频文件
     * @param {string[]} soundIds - 音效ID数组
     * @returns {Promise<void>}
     */
    async preloadSounds(soundIds) {
        const promises = soundIds.map(id => this.loadSound(id));
        await Promise.all(promises);
    }

    /**
     * 加载单个音频文件
     * @param {string} soundId - 音效ID
     * @returns {Promise<HTMLAudioElement>}
     */
    async loadSound(soundId) {
        // 如果已缓存，直接返回
        if (this.audioCache.has(soundId)) {
            return this.audioCache.get(soundId);
        }

        // 如果正在加载，返回加载中的Promise
        if (this.loadingPromises.has(soundId)) {
            return this.loadingPromises.get(soundId);
        }

        // 开始加载
        const filePath = SoundFileMap[soundId];
        if (!filePath) {
            console.warn(`Sound file not found for: ${soundId}`);
            return null;
        }

        const loadPromise = new Promise((resolve, reject) => {
            const audio = new Audio(filePath);
            
            audio.addEventListener('canplaythrough', () => {
                this.audioCache.set(soundId, audio);
                this.loadingPromises.delete(soundId);
                resolve(audio);
            }, { once: true });

            audio.addEventListener('error', (e) => {
                console.warn(`Failed to load sound: ${soundId}`, e);
                this.loadingPromises.delete(soundId);
                resolve(null); // 加载失败时返回null而不是reject
            }, { once: true });

            // 开始加载
            audio.load();
        });

        this.loadingPromises.set(soundId, loadPromise);
        return loadPromise;
    }

    /**
     * 获取音频元素
     * @param {string} soundId - 音效ID
     * @returns {HTMLAudioElement|null}
     */
    getSound(soundId) {
        return this.audioCache.get(soundId) || null;
    }

    /**
     * 清空缓存
     */
    clearCache() {
        this.audioCache.clear();
        this.loadingPromises.clear();
    }
}

