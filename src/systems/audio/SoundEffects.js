/**
 * 音效定义和映射
 */
export const SoundEffects = {
    // 卡牌相关
    CARD_PLAY: 'card-play',
    CARD_DRAW: 'card-draw',
    CARD_DISCARD: 'card-discard',
    
    // 战斗相关
    DAMAGE: 'damage',
    HEAL: 'heal',
    BUFF_APPLY: 'buff-apply',
    BUFF_REMOVE: 'buff-remove',
    
    // 游戏流程
    GAME_START: 'game-start',
    GAME_OVER: 'game-over',
    TURN_START: 'turn-start',
    TURN_END: 'turn-end',
    
    // UI交互
    BUTTON_CLICK: 'button-click',
    HOVER: 'hover',
    ERROR: 'error',
    
    // 特殊效果
    VICTORY: 'victory',
    DEFEAT: 'defeat',
    CRITICAL_HIT: 'critical-hit'
};

/**
 * 音效文件映射
 * 将音效ID映射到实际的文件路径
 */
export const SoundFileMap = {
    [SoundEffects.CARD_PLAY]: '/assets/audio/card-play.mp3',
    [SoundEffects.CARD_DRAW]: '/assets/audio/card-draw.mp3',
    [SoundEffects.CARD_DISCARD]: '/assets/audio/card-discard.mp3',
    [SoundEffects.DAMAGE]: '/assets/audio/damage.mp3',
    [SoundEffects.HEAL]: '/assets/audio/heal.mp3',
    [SoundEffects.BUFF_APPLY]: '/assets/audio/buff-apply.mp3',
    [SoundEffects.BUFF_REMOVE]: '/assets/audio/buff-remove.mp3',
    [SoundEffects.GAME_START]: '/assets/audio/game-start.mp3',
    [SoundEffects.GAME_OVER]: '/assets/audio/game-over.mp3',
    [SoundEffects.TURN_START]: '/assets/audio/turn-start.mp3',
    [SoundEffects.TURN_END]: '/assets/audio/turn-end.mp3',
    [SoundEffects.BUTTON_CLICK]: '/assets/audio/button-click.mp3',
    [SoundEffects.HOVER]: '/assets/audio/hover.mp3',
    [SoundEffects.ERROR]: '/assets/audio/error.mp3',
    [SoundEffects.VICTORY]: '/assets/audio/victory.mp3',
    [SoundEffects.DEFEAT]: '/assets/audio/defeat.mp3',
    [SoundEffects.CRITICAL_HIT]: '/assets/audio/critical-hit.mp3'
};

