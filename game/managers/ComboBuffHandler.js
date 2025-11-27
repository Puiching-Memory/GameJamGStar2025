/**
 * 连击Buff处理器
 * 负责处理连击buff的触发逻辑
 */
class ComboBuffHandler {
    constructor(gameState, logSystem) {
        this.gameState = gameState;
        this.logSystem = logSystem;
    }

    /**
     * 处理连击buff
     */
    processComboBuff(playerName) {
        const player = playerName === 'player' ? this.gameState.player : this.gameState.opponent;
        const opponent = playerName === 'player' ? this.gameState.opponent : this.gameState.player;
        
        // 检查是否有连击buff
        const comboBuffs = player.getBuffsByType('special').filter(buff => 
            buff.name === '连击' || buff.description.includes('额外伤害')
        );
        
        if (comboBuffs.length > 0) {
            comboBuffs.forEach(buff => {
                // 检查buff是否有连击效果（通过value判断）
                if (buff.value > 0) {
                    const damage = player.calculateAttackDamage(buff.value);
                    const actualDamage = opponent.takeDamage(damage, this.gameState.eventSystem);
                    
                    if (actualDamage > 0 && this.logSystem) {
                        const source = playerName === 'player' ? 'player' : 'opponent';
                        this.logSystem.addLog({
                            userMessage: '', // 不显示在弹幕
                            devMessage: `[ComboBuff] ${buff.name} 触发 | Player: ${playerName} | Buff Value: ${buff.value} | Calculated Damage: ${damage} | Actual Damage: ${actualDamage} | Target Health: ${opponent.health}/${opponent.maxHealth}`
                        }, source);
                    }
                }
            });
        }
    }
}

