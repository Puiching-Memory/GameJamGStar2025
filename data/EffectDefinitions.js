/**
 * 效果定义
 * 定义所有卡牌效果的构建器
 */

/**
 * 初始化效果注册表
 * @param {EffectRegistry} registry - 效果注册表
 */
function initializeEffects(registry) {
    // ========== 基础效果 ==========
    
    // 伤害效果
    registry.register('damage', (config) => {
        return new window.DamageEffect({
            name: '伤害',
            description: `造成 ${config.damage || 0} 点伤害`,
            damage: config.damage || 0,
            scaleWithAttack: config.scaleWithAttack !== false
        });
    });

    // 治疗效果
    registry.register('heal', (config) => {
        return new window.HealEffect({
            name: '治疗',
            description: `恢复 ${config.heal || 0} 点生命值`,
            heal: config.heal || 0,
            scaleWithHeal: config.scaleWithHeal !== false
        });
    });

    // 抽牌效果
    registry.register('draw', (config) => {
        return new window.DrawEffect({
            name: '抽牌',
            description: `抽 ${config.count || 1} 张牌`,
            count: config.count || 1
        });
    });

    // 移除手牌效果
    registry.register('removeCard', (config) => {
        return new window.RemoveCardEffect({
            name: '移除手牌',
            description: `移除对手 ${config.count || 1} 张手牌`,
            count: config.count || 1,
            targetType: config.targetType || 'opponent'
        });
    });

    // 生命上限效果
    registry.register('maxHealth', (config) => {
        return new window.MaxHealthEffect({
            name: '生命上限',
            description: `增加 ${config.amount || 0} 点生命上限`,
            amount: config.amount || 0
        });
    });

    // ========== 复合效果 ==========

    // 伤害+抽牌
    registry.register('damageAndDraw', (config) => {
        return new window.CompositeEffect({
            name: '伤害并抽牌',
            description: `造成 ${config.damage || 0} 点伤害并抽 ${config.draw || 1} 张牌`,
            effects: [
                new window.DamageEffect({
                    damage: config.damage || 0,
                    priority: 1
                }),
                new window.DrawEffect({
                    count: config.draw || 1,
                    priority: 0
                })
            ]
        });
    });

    // 治疗+抽牌
    registry.register('healAndDraw', (config) => {
        return new window.CompositeEffect({
            name: '治疗并抽牌',
            description: `恢复 ${config.heal || 0} 点生命值并抽 ${config.draw || 1} 张牌`,
            effects: [
                new window.HealEffect({
                    heal: config.heal || 0,
                    priority: 1
                }),
                new window.DrawEffect({
                    count: config.draw || 1,
                    priority: 0
                })
            ]
        });
    });

    // ========== 特殊Buff效果 ==========

    // 攻击力Buff
    registry.register('attackBuff', (config) => {
        return new window.BuffEffect({
            name: '攻击力Buff',
            description: `获得攻击力+${config.value || 0}的buff（持续${config.duration || 1}回合）`,
            buffData: {
                name: config.name || '攻击力加成',
                icon: config.icon || '⚔️',
                type: 'attack',
                value: config.value || 0,
                duration: config.duration || 1,
                description: `攻击力+${config.value || 0}`,
                stackable: config.stackable || false
            }
        });
    });

    // 防御力Buff
    registry.register('defenseBuff', (config) => {
        return new window.BuffEffect({
            name: '防御力Buff',
            description: `获得防御力+${config.value || 0}的buff（持续${config.duration || 1}回合）`,
            buffData: {
                name: config.name || '防御力加成',
                icon: config.icon || '🛡️',
                type: 'defense',
                value: config.value || 0,
                duration: config.duration || 1,
                description: `防御力+${config.value || 0}`,
                stackable: config.stackable || false
            }
        });
    });

    // 能量Buff（GitHub Action）
    registry.register('manaBuff', (config) => {
        return new window.BuffEffect({
            name: '能量Buff',
            description: `获得能量上限+${config.value || 0}的buff（持续${config.duration || 1}回合）`,
            buffData: {
                name: config.name || 'GitHub Action',
                icon: config.icon || '🔄',
                type: 'mana',
                value: config.value || 0,
                duration: config.duration || 1,
                description: `每回合临时增加${config.value || 0}点能量上限`,
                stackable: config.stackable || false,
                onApply: (player) => {
                    player.maxMana += config.value || 0;
                    // 允许能量超过上限
                    player.mana += config.value || 0;
                },
                onTurnStart: (player) => {
                    const source = player.name === 'player' ? 'player' : 'opponent';
                    return {
                        message: `🔄 ${config.name || 'GitHub Action'} 能量上限临时提升至 ${player.maxMana}！`,
                        source: source
                    };
                },
                onRemove: (player) => {
                    player.maxMana = Math.max(3, player.maxMana - (config.value || 0));
                    if (player.mana > player.maxMana) {
                        player.mana = player.maxMana;
                    }
                }
            }
        });
    });

    // 自动攻击Buff（CL Bot）
    registry.register('autoAttackBuff', (config) => {
        const damage = config.damage || 5;
        return new window.BuffEffect({
            name: '自动攻击Buff',
            description: `获得每回合自动攻击${damage}点的buff（持续${config.duration || 1}回合）`,
            buffData: {
                name: config.name || 'CL自动机器人',
                icon: config.icon || '🤖',
                type: 'special',
                value: damage,
                duration: config.duration || 1,
                description: `每回合自动攻击${damage}点`,
                stackable: config.stackable || false,
                onTurnStart: (player, logCallback) => {
                    // 返回一个需要gameState的函数
                    // 在Player.processTurnStartBuffs中会传入gameState并调用
                    return (gameState) => {
                        const opponent = player.name === 'player' ? gameState.opponent : gameState.player;
                        const actualDamage = opponent.takeDamage(player.calculateAttackDamage(damage), gameState.eventSystem);
                        const source = player.name === 'player' ? 'player' : 'opponent';
                        const result = {
                            message: `🤖 ${config.name || 'CL自动机器人'} 自动攻击造成 ${actualDamage} 点伤害！`,
                            source: source
                        };
                        // 如果提供了logCallback，调用它
                        if (logCallback && typeof logCallback === 'function') {
                            logCallback(result.message, result.source);
                        }
                        return result;
                    };
                }
            }
        });
    });

    // 自然恢复Buff
    registry.register('regenBuff', (config) => {
        return new window.BuffEffect({
            name: '自然恢复Buff',
            description: `获得每回合恢复${config.heal || 0}点生命的buff（持续${config.duration || 1}回合）`,
            buffData: {
                name: config.name || '自然恢复',
                icon: config.icon || '💚',
                type: 'heal',
                value: config.heal || 0,
                duration: config.duration || 1,
                description: `每回合恢复${config.heal || 0}点生命`,
                stackable: config.stackable || false,
                onTurnStart: (player, logCallback, gameState) => {
                    player.addHealth(config.heal || 0, gameState ? gameState.eventSystem : null);
                    return null; // 静默恢复
                }
            }
        });
    });

    // ========== 新效果类型 ==========

    // 能量恢复效果
    registry.register('manaRestore', (config) => {
        return new window.ManaRestoreEffect({
            name: '能量恢复',
            description: `恢复 ${config.amount || 0} 点能量`,
            amount: config.amount || 0
        });
    });

    // 能量消耗效果
    registry.register('manaDrain', (config) => {
        return new window.ManaDrainEffect({
            name: '能量消耗',
            description: `消耗对手 ${config.amount || 0} 点能量`,
            amount: config.amount || 0
        });
    });

    // 护盾效果
    registry.register('shield', (config) => {
        return new window.ShieldEffect({
            name: '护盾',
            description: `获得 ${config.amount || 0} 点护盾（持续${config.duration || 2}回合）`,
            amount: config.amount || 0,
            duration: config.duration || 1
        });
    });

    // 复制卡牌效果
    registry.register('copyCard', (config) => {
        return new window.CopyCardEffect({
            name: '复制卡牌',
            description: `复制 ${config.count || 1} 张手牌`,
            count: config.count || 1,
            targetType: config.targetType || 'self'
        });
    });

    // ========== 新Buff类型 ==========

    // 护盾Buff（通过shield效果创建，这里只是占位）
    // 实际护盾buff在ShieldEffect中创建

    // 抽牌加成Buff
    registry.register('drawBonusBuff', (config) => {
        return new window.BuffEffect({
            name: '抽牌加成Buff',
            description: `每回合额外抽 ${config.count || 1} 张牌（持续${config.duration || 1}回合）`,
            buffData: {
                name: config.name || '抽牌加成',
                icon: config.icon || '📚',
                type: 'draw',
                value: config.count || 1,
                duration: config.duration || 1,
                description: `每回合额外抽${config.count || 1}张牌`,
                stackable: config.stackable || false,
                onTurnStart: (player, logCallback, gameState) => {
                    if (gameState && gameState.cardFactory) {
                        const drawCount = config.count || 1;
                        let drawnCount = 0;
                        for (let i = 0; i < drawCount; i++) {
                            const newCard = gameState.cardFactory.getRandomCard();
                            if (player.drawCard(newCard)) {
                                drawnCount++;
                                if (gameState.eventSystem) {
                                    gameState.eventSystem.emit('card:drawn', {
                                        player: player.name,
                                        card: newCard
                                    });
                                }
                            }
                        }
                        if (drawnCount > 0 && logCallback) {
                            const source = player.name === 'player' ? 'player' : 'opponent';
                            logCallback(`📚 ${config.name || '抽牌加成'} 额外抽了 ${drawnCount} 张牌！`, source);
                        }
                    }
                    return null;
                }
            }
        });
    });

    // 能量恢复Buff
    registry.register('manaRegenBuff', (config) => {
        return new window.BuffEffect({
            name: '能量恢复Buff',
            description: `每回合恢复 ${config.amount || 1} 点能量（持续${config.duration || 1}回合）`,
            buffData: {
                name: config.name || '能量恢复',
                icon: config.icon || '⚡',
                type: 'mana',
                value: config.amount || 1,
                duration: config.duration || 1,
                description: `每回合恢复${config.amount || 1}点能量`,
                stackable: config.stackable || false,
                onTurnStart: (player) => {
                    const oldMana = player.mana;
                    // 允许能量恢复超过上限
                    player.mana += config.amount || 1;
                    const actualRestore = player.mana - oldMana;
                    if (actualRestore > 0) {
                        const source = player.name === 'player' ? 'player' : 'opponent';
                        return {
                            message: `⚡ ${config.name || '能量恢复'} 恢复了 ${actualRestore} 点能量！`,
                            source: source
                        };
                    }
                    return null;
                }
            }
        });
    });

    // 连击Buff
    registry.register('comboBuff', (config) => {
        const damage = config.damage || 2;
        return new window.BuffEffect({
            name: '连击Buff',
            description: `每使用一张卡牌，造成 ${damage} 点额外伤害（持续${config.duration || 3}回合）`,
            buffData: {
                name: config.name || '连击',
                icon: config.icon || '⚡',
                type: 'special',
                value: damage, // 存储伤害值，用于Game.processComboBuff
                duration: config.duration || 3,
                description: `每使用卡牌造成${damage}点额外伤害`,
                stackable: config.stackable || false
                // 注意：连击效果在Game.processComboBuff中通过监听card:played事件实现
            }
        });
    });

    // 自动打出Git原子操作效果
    registry.register('autoPlayGitOperation', (config) => {
        return new window.AutoPlayGitOperationEffect({
            name: '自动Git操作',
            description: `每回合自动执行git原子操作（持续${config.duration || 6}回合）`,
            operations: config.operations || [
                'add', 'commit', 'push', 'pull', 'fetch',
                'branch', 'checkout', 'merge', 'status', 'log'
            ],
            buffName: config.buffName || '自动Git操作',
            buffIcon: config.buffIcon || '🤖',
            duration: config.duration || 6
        });
    });
}

