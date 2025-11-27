/**
 * 效果组件基类
 * 所有卡牌效果的基础类，支持组合和扩展
 */
class EffectComponent {
    constructor(config = {}) {
        this.id = config.id || `effect_${Date.now()}_${Math.random()}`;
        this.name = config.name || '未知效果';
        this.description = config.description || '';
        this.priority = config.priority || 0; // 执行优先级，数字越大越先执行
    }

    /**
     * 执行效果
     * @param {Object} context - 执行上下文
     * @param {GameState} context.gameState - 游戏状态
     * @param {string} context.target - 目标 ('player' 或 'opponent')
     * @param {string} context.cardUser - 卡牌使用者
     * @param {Card} context.card - 卡牌实例
     * @returns {Object|null} 返回日志消息对象 {message: string, source: string} 或 null
     */
    execute(context) {
        throw new Error('EffectComponent.execute() must be implemented');
    }

    /**
     * 检查效果是否可以执行
     * @param {Object} context - 执行上下文
     * @returns {boolean}
     */
    canExecute(context) {
        return true;
    }

    /**
     * 克隆效果
     */
    clone() {
        const cloned = Object.create(Object.getPrototypeOf(this));
        Object.assign(cloned, this);
        cloned.id = `${this.id}_clone_${Date.now()}`;
        return cloned;
    }
}

/**
 * 伤害效果组件
 */
class DamageEffect extends EffectComponent {
    constructor(config) {
        super(config);
        this.baseDamage = config.damage || 0;
        this.scaleWithAttack = config.scaleWithAttack !== false; // 默认考虑攻击力加成
    }

    execute(context) {
        const { gameState, target, cardUser } = context;
        // 通过名称查找目标玩家（支持自动机器人）
        const targetPlayer = gameState.getPlayerByName(target);
        if (!targetPlayer) {
            return {
                message: `目标 ${target} 不存在！`,
                source: cardUser
            };
        }
        
        // 如果目标是自动机器人，不受伤害
        if (targetPlayer.isAutoBot) {
            return {
                message: `自动机器人不受伤害！`,
                source: cardUser
            };
        }
        
        const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
        
        let damage = this.baseDamage;
        if (this.scaleWithAttack) {
            damage = userPlayer.calculateAttackDamage(this.baseDamage);
        }
        
        const actualDamage = targetPlayer.takeDamage(damage, gameState.eventSystem);
        
        return {
            message: `造成 ${actualDamage} 点伤害！`,
            source: cardUser
        };
    }
}

/**
 * 治疗效果组件
 */
class HealEffect extends EffectComponent {
    constructor(config) {
        super(config);
        this.baseHeal = config.heal || 0;
        this.scaleWithHeal = config.scaleWithHeal !== false; // 默认考虑治疗加成
    }

    execute(context) {
        const { gameState, target, cardUser } = context;
        const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
        const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
        
        let heal = this.baseHeal;
        if (this.scaleWithHeal) {
            heal = userPlayer.calculateHealAmount(this.baseHeal);
        }
        
        targetPlayer.addHealth(heal, gameState.eventSystem);
        
        return {
            message: `恢复 ${heal} 点生命值！`,
            source: cardUser
        };
    }
}

/**
 * 抽牌效果组件
 */
class DrawEffect extends EffectComponent {
    constructor(config) {
        super(config);
        this.drawCount = config.count || 1;
    }

    execute(context) {
        const { gameState, cardUser, cardFactory } = context;
        const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
        
        let drawnCount = 0;
        for (let i = 0; i < this.drawCount; i++) {
            if (cardFactory) {
                const newCard = cardFactory.getRandomCard();
                if (userPlayer.drawCard(newCard)) {
                    drawnCount++;
                    // 触发抽牌事件
                    if (gameState.eventSystem) {
                        gameState.eventSystem.emit('card:drawn', {
                            player: cardUser,
                            card: newCard
                        });
                    }
                }
            }
        }
        
        return {
            message: drawnCount > 0 ? `抽了 ${drawnCount} 张牌！` : '手牌已满，无法抽牌！',
            source: cardUser
        };
    }
}

/**
 * 移除手牌效果组件
 */
class RemoveCardEffect extends EffectComponent {
    constructor(config) {
        super(config);
        this.removeCount = config.count || 1;
        this.targetType = config.targetType || 'opponent'; // 'opponent' 或 'self'
    }

    execute(context) {
        const { gameState, target, cardUser } = context;
        const targetPlayer = this.targetType === 'self' 
            ? (cardUser === 'opponent' ? gameState.opponent : gameState.player)
            : (target === 'opponent' ? gameState.opponent : gameState.player);
        
        const removedCards = [];
        for (let i = 0; i < this.removeCount; i++) {
            const removed = targetPlayer.removeRandomCard();
            if (removed) {
                // 标记为强制拆下的卡牌
                removed.isForcedDiscard = true;
                removed.discardType = 'forced';
                removedCards.push(removed);
                // 触发移除卡牌事件
                if (gameState.eventSystem) {
                    gameState.eventSystem.emit('card:removed', {
                        player: targetPlayer.name,
                        card: removed,
                        isForcedDiscard: true
                    });
                }
            }
        }
        
        if (removedCards.length > 0) {
            const cardNames = removedCards.map(c => c.name).join('、');
            return {
                message: `移除了 ${cardNames}！`,
                source: cardUser
            };
        } else {
            return {
                message: '目标没有手牌可移除！',
                source: cardUser
            };
        }
    }
}

/**
 * Buff效果组件
 */
class BuffEffect extends EffectComponent {
    constructor(config) {
        super(config);
        this.buffData = config.buffData || {};
    }

    execute(context) {
        const { gameState, cardUser } = context;
        const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
        
        const buff = new Buff(this.buffData);
        userPlayer.addBuff(buff);
        
        // 触发buff添加事件
        if (gameState.eventSystem) {
            gameState.eventSystem.emit('player:buff:added', {
                player: cardUser,
                buff: buff
            });
        }
        
        return {
            message: `获得 ${buff.name} buff！`,
            source: cardUser
        };
    }
}

/**
 * 生命上限效果组件
 */
class MaxHealthEffect extends EffectComponent {
    constructor(config) {
        super(config);
        this.amount = config.amount || 0;
    }

    execute(context) {
        const { gameState, cardUser } = context;
        const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
        
        userPlayer.increaseMaxHealth(this.amount);
        
        return {
            message: `增加 ${this.amount} 点生命上限！`,
            source: cardUser
        };
    }
}

/**
 * 能量恢复效果组件
 */
class ManaRestoreEffect extends EffectComponent {
    constructor(config) {
        super(config);
        this.amount = config.amount || 0;
    }

    execute(context) {
        const { gameState, cardUser } = context;
        const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
        
        const oldMana = userPlayer.mana;
        // 允许能量恢复超过上限
        userPlayer.mana = userPlayer.mana + this.amount;
        const actualRestore = userPlayer.mana - oldMana;
        
        return {
            message: `恢复 ${actualRestore} 点能量！`,
            source: cardUser
        };
    }
}

/**
 * 能量消耗效果组件（用于对手）
 */
class ManaDrainEffect extends EffectComponent {
    constructor(config) {
        super(config);
        this.amount = config.amount || 0;
    }

    execute(context) {
        const { gameState, target } = context;
        const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
        
        const oldMana = targetPlayer.mana;
        targetPlayer.mana = Math.max(0, targetPlayer.mana - this.amount);
        const actualDrain = oldMana - targetPlayer.mana;
        
        return {
            message: `消耗对手 ${actualDrain} 点能量！`,
            source: context.cardUser
        };
    }
}

/**
 * 护盾效果组件
 */
class ShieldEffect extends EffectComponent {
    constructor(config) {
        super(config);
        this.amount = config.amount || 0;
        this.duration = config.duration || 2; // 默认持续时间改为2回合
    }

    execute(context) {
        const { gameState, cardUser } = context;
        const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
        
        // 创建护盾buff
        const shieldBuff = new Buff({
            name: '护盾',
            icon: '🛡️',
            type: 'shield',
            value: this.amount,
            duration: this.duration,
            description: `吸收 ${this.amount} 点伤害`,
            stackable: true // 护盾可以叠加
        });
        
        userPlayer.addBuff(shieldBuff);
        
        return {
            message: `获得 ${this.amount} 点护盾！`,
            source: cardUser
        };
    }
}

/**
 * 复制卡牌效果组件
 */
class CopyCardEffect extends EffectComponent {
    constructor(config) {
        super(config);
        this.count = config.count || 1;
        this.targetType = config.targetType || 'self'; // 'self' 或 'opponent'
    }

    execute(context) {
        const { gameState, cardUser, cardFactory } = context;
        const targetPlayer = this.targetType === 'self'
            ? (cardUser === 'opponent' ? gameState.opponent : gameState.player)
            : (cardUser === 'opponent' ? gameState.player : gameState.opponent);
        
        let copiedCount = 0;
        const hand = targetPlayer.hand;
        
        if (hand.length > 0) {
            for (let i = 0; i < this.count && hand.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * hand.length);
                const cardToCopy = hand[randomIndex];
                
                // 创建卡牌副本
                const copiedCard = cardFactory.createCard({
                    id: cardToCopy.id.split('_')[0], // 使用原始ID
                    name: cardToCopy.name,
                    icon: cardToCopy.icon,
                    cost: cardToCopy.cost,
                    power: cardToCopy.power,
                    heal: cardToCopy.heal,
                    draw: cardToCopy.draw,
                    description: cardToCopy.description,
                    type: cardToCopy.type
                });
                
                if (targetPlayer.drawCard(copiedCard)) {
                    copiedCount++;
                    if (gameState.eventSystem) {
                        gameState.eventSystem.emit('card:drawn', {
                            player: targetPlayer.name,
                            card: copiedCard
                        });
                    }
                }
            }
        }
        
        if (copiedCount > 0) {
            return {
                message: `复制了 ${copiedCount} 张手牌！`,
                source: cardUser
            };
        } else {
            return {
                message: '没有可复制的卡牌！',
                source: cardUser
            };
        }
    }
}

/**
 * 组合效果组件
 * 将多个效果组合在一起执行
 */
class CompositeEffect extends EffectComponent {
    constructor(config) {
        super(config);
        this.effects = config.effects || [];
        // 按优先级排序
        this.effects.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    execute(context) {
        const messages = [];
        
        for (const effect of this.effects) {
            if (effect.canExecute && effect.canExecute(context)) {
                const result = effect.execute(context);
                if (result && result.message) {
                    messages.push(result);
                }
            }
        }
        
        // 合并消息
        if (messages.length > 0) {
            const mainMessage = messages[0];
            const additionalMessages = messages.slice(1).map(m => m.message).join('，');
            return {
                message: additionalMessages 
                    ? `${mainMessage.message}，${additionalMessages}` 
                    : mainMessage.message,
                source: mainMessage.source
            };
        }
        
        return null;
    }

    /**
     * 添加效果
     */
    addEffect(effect) {
        this.effects.push(effect);
        this.effects.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    /**
     * 移除效果
     */
    removeEffect(effectId) {
        this.effects = this.effects.filter(e => e.id !== effectId);
    }
}

/**
 * 自动打出Git原子操作效果组件
 * 每回合开始时自动随机选择一个git原子操作并执行
 */
class AutoPlayGitOperationEffect extends EffectComponent {
    constructor(config) {
        super(config);
        // Git原子操作列表（基础操作）
        this.gitOperations = config.operations || [
            'add',      // 暂存文件
            'commit',   // 提交更改
            'push',     // 推送代码
            'pull',     // 拉取代码
            'fetch',    // 获取更新
            'branch',   // 创建分支
            'checkout', // 切换分支
            'merge',    // 合并分支
            'status',   // 查看状态
            'log'       // 查看历史
        ];
        this.buffName = config.buffName || '自动Git操作';
        this.buffIcon = config.buffIcon || '🤖';
        this.duration = config.duration || 6;
    }

    execute(context) {
        const { gameState, cardUser, cardFactory } = context;
        const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
        
        // 保存到局部变量，避免闭包中的this上下文问题
        const buffName = this.buffName;
        const buffIcon = this.buffIcon;
        const gitOperations = this.gitOperations;
        const duration = this.duration;
        
        // 确定机器人类型
        const botType = buffName.includes('GitHub Action') ? 'github-action' : 'cl-bot';
        
        console.log(`AutoPlayGitOperationEffect.execute: 为 ${cardUser} 创建自动机器人 ${buffName}`);
        
        // 创建自动机器人玩家
        const botId = `${botType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const botPlayer = new Player(botId, true);
        botPlayer.isAutoBot = true;
        botPlayer.autoBotType = botType;
        botPlayer.maxHealth = 50; // 自动机器人生命值较低
        botPlayer.health = 50;
        botPlayer.mana = 999; // 能量固定999
        botPlayer.maxMana = 999;
        botPlayer.hand = []; // 没有初始手牌
        botPlayer.deck = []; // 没有牌堆
        botPlayer.autoBotLifetime = duration; // 生命周期（回合数）
        botPlayer.autoBotTurnsRemaining = duration; // 剩余回合数
        
        // 将机器人添加到游戏状态
        gameState.addPlayer(botPlayer, userPlayer.team); // 添加到使用者的队伍
        
        // 创建自动机器人AI，传入允许的操作列表
        const autoBotAI = new AutoBotAI(gameState, cardFactory, botPlayer, botType, gitOperations);
        gameState.registerAI(botId, autoBotAI);
        
        // 创建buff，在每回合开始时自动执行git操作（通过AI）
        const buff = new Buff({
            name: buffName,
            icon: buffIcon,
            type: 'special',
            value: 0,
            duration: duration,
            description: '每回合自动执行git原子操作',
            stackable: false,
            onTurnStart: (player, logCallback) => {
                // 这个buff现在不再使用，因为自动机器人有自己的回合
                // 保留这个结构以保持兼容性
                return null;
            }
        });
        
        // 不再添加buff，而是创建了自动机器人玩家
        // 触发玩家添加事件（只发送必要的数据，避免循环引用）
        if (gameState.eventSystem) {
            gameState.eventSystem.emit('player:added', {
                playerId: botPlayer.name, // 用于查找玩家
                name: botPlayer.name, // 备用字段
                isAutoBot: botPlayer.isAutoBot,
                autoBotType: botPlayer.autoBotType,
                health: botPlayer.health,
                maxHealth: botPlayer.maxHealth,
                mana: botPlayer.mana,
                maxMana: botPlayer.maxMana,
                teamId: userPlayer.team ? userPlayer.team.id : null
            });
        }
        
        return {
            message: `🤖 ${buffName} 已加入战斗！每回合自动执行git原子操作`,
            source: cardUser
        };
    }
}

// 暴露到全局作用域
window.EffectComponent = EffectComponent;
window.DamageEffect = DamageEffect;
window.HealEffect = HealEffect;
window.DrawEffect = DrawEffect;
window.RemoveCardEffect = RemoveCardEffect;
window.BuffEffect = BuffEffect;
window.MaxHealthEffect = MaxHealthEffect;
window.ManaRestoreEffect = ManaRestoreEffect;
window.ManaDrainEffect = ManaDrainEffect;
window.ShieldEffect = ShieldEffect;
window.CopyCardEffect = CopyCardEffect;
window.CompositeEffect = CompositeEffect;
window.AutoPlayGitOperationEffect = AutoPlayGitOperationEffect;

