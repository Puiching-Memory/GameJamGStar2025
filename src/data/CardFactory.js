import { Card } from '../core/Card.js';
import { Buff } from '../core/Buff.js';
import { CARD_DATA } from './CardData.js';

/**
 * 卡牌工厂
 * 负责创建卡牌实例和卡牌效果
 */
export class CardFactory {
    constructor() {
        this.cardEffects = this.createCardEffects();
    }

    /**
     * 创建卡牌效果映射
     */
    createCardEffects() {
        return {
            // ========== 基础操作 ==========
            'add': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                const damage = userPlayer.calculateAttackDamage(4);
                targetPlayer.takeDamage(damage);
                return `➕ 使用了 Add，造成 ${damage} 点伤害！`;
            },
            'commit': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                const damage = userPlayer.calculateAttackDamage(5);
                targetPlayer.takeDamage(damage);
                return `💾 使用了 Commit，造成 ${damage} 点伤害！`;
            },
            'push': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                const damage = userPlayer.calculateAttackDamage(10);
                targetPlayer.takeDamage(damage);
                return `⬆️ 使用了 Push，造成 ${damage} 点伤害！`;
            },
            'pull': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                const heal = userPlayer.calculateHealAmount(8);
                targetPlayer.addHealth(heal);
                return `⬇️ 使用了 Pull，恢复 ${heal} 点生命值！`;
            },
            'fetch': (gameState, target, cardUser) => {
                // 抽牌逻辑由外部处理
                return `📥 使用了 Fetch，抽了一张牌！`;
            },
            'clone': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                const damage = userPlayer.calculateAttackDamage(18);
                targetPlayer.takeDamage(damage);
                return `📋 使用了 Clone，造成 ${damage} 点巨大伤害！`;
            },

            // ========== 分支操作 ==========
            'branch': (gameState, target, cardUser) => {
                // 抽牌逻辑由外部处理
                return `🌿 使用了 Branch，抽了两张牌！`;
            },
            'checkout': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                const damage = userPlayer.calculateAttackDamage(8);
                targetPlayer.takeDamage(damage);
                // 抽牌逻辑由外部处理
                return `🔀 使用了 Checkout，造成 ${damage} 点伤害并抽一张牌！`;
            },
            'merge': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                const damage = userPlayer.calculateAttackDamage(15);
                targetPlayer.takeDamage(damage);
                return `🔀 使用了 Merge，造成 ${damage} 点伤害！`;
            },
            'rebase': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                const damage = userPlayer.calculateAttackDamage(12);
                targetPlayer.takeDamage(damage);
                // 抽牌逻辑由外部处理
                return `🔄 使用了 Rebase，造成 ${damage} 点伤害并抽一张牌！`;
            },

            // ========== 历史操作 ==========
            'log': (gameState, target, cardUser) => {
                // 抽牌逻辑由外部处理
                return `📜 使用了 Log，抽了一张牌！`;
            },
            'show': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                const damage = userPlayer.calculateAttackDamage(6);
                targetPlayer.takeDamage(damage);
                // 抽牌逻辑由外部处理
                return `👁️ 使用了 Show，造成 ${damage} 点伤害并抽一张牌！`;
            },
            'diff': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                const damage = userPlayer.calculateAttackDamage(9);
                targetPlayer.takeDamage(damage);
                return `🔍 使用了 Diff，造成 ${damage} 点伤害！`;
            },
            'blame': (gameState, target, cardUser) => {
                const opponent = target === 'opponent' ? gameState.opponent : gameState.player;
                const removed = opponent.removeRandomCard();
                if (removed) {
                    return `👤 使用了 Blame，移除了对手的 ${removed.name}！`;
                } else {
                    return `👤 使用了 Blame，但对手没有手牌！`;
                }
            },
            'bisect': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                const damage = userPlayer.calculateAttackDamage(11);
                targetPlayer.takeDamage(damage);
                // 抽牌逻辑由外部处理
                return `🔎 使用了 Bisect，造成 ${damage} 点伤害并抽一张牌！`;
            },

            // ========== 撤销操作 ==========
            'reset': (gameState, target, cardUser) => {
                const opponent = target === 'opponent' ? gameState.opponent : gameState.player;
                const removed = opponent.removeRandomCard();
                if (removed) {
                    return `⏪ 使用了 Reset，移除了对手的 ${removed.name}！`;
                } else {
                    return `⏪ 使用了 Reset，但对手没有手牌！`;
                }
            },
            'revert': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                const heal = userPlayer.calculateHealAmount(12);
                targetPlayer.addHealth(heal);
                return `↩️ 使用了 Revert，恢复 ${heal} 点生命值！`;
            },
            'stash': (gameState, target, cardUser) => {
                // 抽牌逻辑由外部处理
                return `📦 使用了 Stash，抽了一张牌！`;
            },
            'cherry-pick': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                const damage = userPlayer.calculateAttackDamage(8);
                targetPlayer.takeDamage(damage);
                // 抽牌逻辑由外部处理
                return `🍒 使用了 Cherry Pick，造成 ${damage} 点伤害并抽一张牌！`;
            },

            // ========== 远程操作 ==========
            'remote': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                const damage = userPlayer.calculateAttackDamage(8);
                targetPlayer.takeDamage(damage);
                return `🌐 使用了 Remote，造成 ${damage} 点伤害！`;
            },
            'submodule': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                const damage = userPlayer.calculateAttackDamage(14);
                targetPlayer.takeDamage(damage);
                return `📁 使用了 Submodule，造成 ${damage} 点伤害！`;
            },
            'worktree': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                const damage = userPlayer.calculateAttackDamage(7);
                targetPlayer.takeDamage(damage);
                // 抽牌逻辑由外部处理
                return `🌳 使用了 Worktree，造成 ${damage} 点伤害并抽一张牌！`;
            },

            // ========== 标签操作 ==========
            'tag': (gameState, target, cardUser) => {
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                // 添加攻击力加成buff（持续3回合）
                const attackBuff = new Buff({
                    name: '标签标记',
                    icon: '🏷️',
                    type: 'attack',
                    value: 3,
                    duration: 3,
                    description: '攻击力+3',
                    stackable: false
                });
                userPlayer.addBuff(attackBuff);
                return `🏷️ 使用了 Tag，获得攻击力+3的buff（持续3回合）！`;
            },

            // ========== 其他操作 ==========
            'status': (gameState, target, cardUser) => {
                // 抽牌逻辑由外部处理
                return `📊 使用了 Status，抽了一张牌！`;
            },
            'clean': (gameState, target, cardUser) => {
                const opponent = target === 'opponent' ? gameState.opponent : gameState.player;
                const removed = opponent.removeRandomCard();
                if (removed) {
                    return `🧹 使用了 Clean，移除了对手的 ${removed.name}！`;
                } else {
                    return `🧹 使用了 Clean，但对手没有手牌！`;
                }
            },
            'init': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                const heal = userPlayer.calculateHealAmount(10);
                targetPlayer.addHealth(heal);
                // 抽牌逻辑由外部处理
                return `🚀 使用了 Init，恢复 ${heal} 点生命值并抽一张牌！`;
            },
            'config': (gameState, target, cardUser) => {
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                // 增加生命上限
                userPlayer.increaseMaxHealth(10);
                // 添加自然恢复生命的buff（持续3回合，每回合恢复3点生命）
                const regenBuff = new Buff({
                    name: '自然恢复',
                    icon: '💚',
                    type: 'heal',
                    value: 3,
                    duration: 3,
                    description: '每回合恢复3点生命',
                    stackable: false,
                    onTurnStart: (player) => {
                        player.addHealth(3);
                        // 不返回日志消息，保持静默
                        return null;
                    }
                });
                userPlayer.addBuff(regenBuff);
                return `⚙️ 使用了 Config，增加10点生命上限并获得自然恢复buff（每回合恢复3点生命，持续3回合）！`;
            },

            // ========== 自动化工具 ==========
            'github-action': (gameState, target, cardUser) => {
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                // 创建临时增加能量上限的buff（持续5回合）
                const manaBuff = new Buff({
                    name: 'GitHub Action',
                    icon: '🔄',
                    type: 'mana',
                    value: 2, // 增加2点能量上限
                    duration: 5,
                    description: '每回合临时增加2点能量上限',
                    stackable: false,
                    onApply: (player) => {
                        // 应用时增加能量上限
                        player.maxMana += 2;
                        player.mana = Math.min(player.maxMana, player.mana + 2); // 同时增加当前能量
                    },
                    onTurnStart: (player) => {
                        // 每回合开始时记录日志
                        // 注意：能量恢复逻辑在restoreMana()中处理，它会根据新的maxMana恢复满能量
                        const source = player.name === 'player' ? 'player' : 'opponent';
                        return {
                            message: `🔄 GitHub Action 能量上限临时提升至 ${player.maxMana}！`,
                            source: source
                        };
                    },
                    onRemove: (player) => {
                        // 移除时恢复能量上限（减少2点）
                        player.maxMana = Math.max(3, player.maxMana - 2);
                        // 如果当前能量超过新的上限，需要调整
                        if (player.mana > player.maxMana) {
                            player.mana = player.maxMana;
                        }
                    }
                });
                userPlayer.addBuff(manaBuff);
                return `🔄 使用了 GitHub Action，获得能量buff（临时增加2点能量上限，持续5回合）！`;
            },
            'cl-bot': (gameState, target, cardUser) => {
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                // 创建自动攻击buff（持续5回合）
                // 通过闭包捕获gameState，以便在onTurnStart中访问对手
                const attackBuff = new Buff({
                    name: 'CL自动机器人',
                    icon: '🤖',
                    type: 'special',
                    // 显示为"基础自动攻击伤害 5"，避免界面上看到 0
                    value: 5,
                    duration: 5,
                    description: '每回合自动攻击5点',
                    stackable: false,
                    onTurnStart: (player) => {
                        // 确定对手
                        const opponent = player.name === 'player' ? gameState.opponent : gameState.player;
                        // 自动攻击对手（造成5点伤害）
                        const damage = player.calculateAttackDamage(5);
                        opponent.takeDamage(damage);
                        // 返回日志消息
                        const source = player.name === 'player' ? 'player' : 'opponent';
                        return {
                            message: `🤖 CL自动机器人 自动攻击造成 ${damage} 点伤害！`,
                            source: source
                        };
                    }
                });
                userPlayer.addBuff(attackBuff);
                return `🤖 使用了 CL自动机器人，获得自动攻击buff（每回合自动攻击5点，持续5回合）！`;
            }
        };
    }

    /**
     * 创建卡牌实例
     */
    createCard(cardData) {
        const baseId = cardData.id;
        const effect = this.cardEffects[baseId];
        
        return new Card({
            ...cardData,
            effect: effect ? (gameState, target, cardUser) => {
                return effect(gameState, target, cardUser);
            } : null
        });
    }

    /**
     * 获取随机卡牌
     */
    getRandomCard() {
        const randomIndex = Math.floor(Math.random() * CARD_DATA.length);
        return this.createCard(CARD_DATA[randomIndex]);
    }

    /**
     * 获取多张随机卡牌
     */
    getRandomCards(count) {
        const cards = [];
        for (let i = 0; i < count; i++) {
            cards.push(this.getRandomCard());
        }
        return cards;
    }
}

