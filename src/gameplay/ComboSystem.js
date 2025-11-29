/**
 * 组合技系统
 * 负责检测和管理卡牌组合技
 */

/**
 * 组合技定义
 * sequence: 卡牌ID序列（按顺序）
 * name: 组合技名称
 * bonusDamage: 额外伤害加成（百分比，例如 0.5 表示增加50%伤害）
 * description: 组合技描述
 */
export const COMBO_DEFINITIONS = [
    {
        id: 'workflow-basic',
        sequence: ['add', 'commit'],
        name: '基础工作流',
        bonusDamage: 0.3,
        description: 'Add -> Commit：完成基础提交流程，额外伤害+30%',
        icon: '⚡'
    },
    {
        id: 'workflow-complete',
        sequence: ['add', 'commit', 'push'],
        name: '完整工作流',
        bonusDamage: 0.8,
        description: 'Add -> Commit -> Push：完整的Git工作流，额外伤害+80%',
        icon: '🔥'
    },
    {
        id: 'branch-workflow',
        sequence: ['branch', 'checkout', 'merge'],
        name: '分支工作流',
        bonusDamage: 0.6,
        description: 'Branch -> Checkout -> Merge：分支管理流程，额外伤害+60%',
        icon: '🌿'
    },
    {
        id: 'sync-workflow',
        sequence: ['fetch', 'pull'],
        name: '同步工作流',
        bonusDamage: 0.4,
        description: 'Fetch -> Pull：同步远程代码，额外伤害+40%',
        icon: '🔄'
    },
    {
        id: 'history-chain',
        sequence: ['log', 'show', 'diff'],
        name: '历史追溯',
        bonusDamage: 0.7,
        description: 'Log -> Show -> Diff：查看历史并分析差异，额外伤害+70%',
        icon: '📜'
    },
    {
        id: 'undo-chain',
        sequence: ['reset', 'revert'],
        name: '撤销链',
        bonusDamage: 0.5,
        description: 'Reset -> Revert：连续撤销操作，额外伤害+50%',
        icon: '↩️'
    }
];

/**
 * 组合技系统类
 */
export class ComboSystem {
    constructor() {
        this.combos = COMBO_DEFINITIONS;
    }

    /**
     * 从卡牌获取基础ID（去除时间戳和随机数）
     * @param {Card} card - 卡牌对象
     * @returns {string} - 卡牌的基础ID
     */
    getBaseCardId(card) {
        if (!card) return null;
        // 优先使用baseId属性（如果存在）
        if (card.baseId) {
            return card.baseId;
        }
        // 否则从id中提取（兼容旧代码）
        if (!card.id) return null;
        // 卡牌ID格式: "baseId_timestamp_random" 或 "baseId-with-dashes_timestamp_random"
        const parts = card.id.split('_');
        return parts[0];
    }

    /**
     * 从卡牌序列获取基础ID序列
     * @param {Card[]} cards - 卡牌数组
     * @returns {string[]} - 基础ID数组
     */
    getBaseCardIdSequence(cards) {
        return cards
            .map(card => this.getBaseCardId(card))
            .filter(id => id !== null);
    }

    /**
     * 检测卡牌序列是否匹配某个组合技
     * @param {string[]} cardSequence - 卡牌ID序列
     * @param {Object} comboDef - 组合技定义
     * @returns {boolean} - 是否匹配
     */
    matchesCombo(cardSequence, comboDef) {
        if (cardSequence.length < comboDef.sequence.length) {
            return false;
        }

        // 检查序列的末尾是否匹配组合技序列
        const startIndex = cardSequence.length - comboDef.sequence.length;
        const recentSequence = cardSequence.slice(startIndex);

        // 比较序列
        for (let i = 0; i < comboDef.sequence.length; i++) {
            if (recentSequence[i] !== comboDef.sequence[i]) {
                return false;
            }
        }

        return true;
    }

    /**
     * 检测当前卡牌序列中触发的所有组合技
     * @param {Card[]} playedCards - 本回合已打出的卡牌序列
     * @returns {Object[]} - 匹配的组合技列表，每个包含 {combo, bonusDamage}
     */
    detectCombos(playedCards) {
        if (!playedCards || playedCards.length === 0) {
            return [];
        }

        const cardSequence = this.getBaseCardIdSequence(playedCards);
        const matchedCombos = [];

        // 检查所有组合技定义
        for (const combo of this.combos) {
            if (this.matchesCombo(cardSequence, combo)) {
                matchedCombos.push({
                    combo: combo,
                    bonusDamage: combo.bonusDamage,
                    matchedSequence: cardSequence.slice(-combo.sequence.length)
                });
            }
        }

        // 返回最长的匹配组合技（如果有多个匹配，优先返回更长的）
        if (matchedCombos.length > 0) {
            matchedCombos.sort((a, b) => 
                b.combo.sequence.length - a.combo.sequence.length
            );
            return [matchedCombos[0]]; // 只返回最长的匹配
        }

        return [];
    }

    /**
     * 获取潜在的可触发组合技（基于当前序列和手牌）
     * @param {Card[]} playedCards - 本回合已打出的卡牌序列
     * @param {Card[]} handCards - 手牌列表
     * @returns {Object[]} - 可触发的组合技列表，每个包含 {combo, nextCardId, progress, fullSequence}
     */
    getPotentialCombos(playedCards, handCards) {
        if (!handCards || handCards.length === 0) {
            return [];
        }
        
        if (!playedCards || playedCards.length === 0) {
            // 如果没有已打出的卡牌，返回空数组（应该使用getAvailableCombosFromHand）
            return [];
        }

        const cardSequence = this.getBaseCardIdSequence(playedCards || []);
        const handCardIds = this.getBaseCardIdSequence(handCards || []);
        const potentialCombos = [];

        // 检查所有组合技定义
        for (const combo of this.combos) {
            // 检查当前序列是否匹配组合技的前缀
            const sequenceLength = combo.sequence.length;
            
            // 如果已打出的卡牌数量小于组合技长度，检查是否是前缀
            if (cardSequence.length < sequenceLength) {
                let isPrefix = true;
                for (let i = 0; i < cardSequence.length; i++) {
                    if (cardSequence[i] !== combo.sequence[i]) {
                        isPrefix = false;
                        break;
                    }
                }

                if (isPrefix) {
                    // 检查手牌中是否有完成整个组合技所需的所有卡牌
                    const remainingSequence = combo.sequence.slice(cardSequence.length);
                    const hasAllCards = remainingSequence.every(cardId => handCardIds.includes(cardId));
                    
                    // 至少要有下一张卡牌
                    const nextCardId = combo.sequence[cardSequence.length];
                    if (handCardIds.includes(nextCardId)) {
                        potentialCombos.push({
                            combo: combo,
                            nextCardId: nextCardId,
                            progress: cardSequence.length,
                            totalLength: sequenceLength,
                            fullSequence: combo.sequence, // 完整序列
                            remainingCards: remainingSequence, // 剩余需要的卡牌
                            hasAllCards: hasAllCards // 是否手牌中有所有需要的卡牌
                        });
                    }
                }
            }
        }

        // 按优先级排序：优先显示手牌中能完整完成的组合技，然后按伤害加成排序
        potentialCombos.sort((a, b) => {
            if (a.hasAllCards !== b.hasAllCards) {
                return b.hasAllCards - a.hasAllCards; // 有完整卡牌的优先
            }
            return b.combo.bonusDamage - a.combo.bonusDamage; // 伤害加成高的优先
        });

        return potentialCombos;
    }

    /**
     * 获取基于手牌的完整连招推荐（不考虑已打出的卡牌）
     * @param {Card[]} handCards - 手牌列表
     * @returns {Object[]} - 可用的完整组合技列表
     */
    getAvailableCombosFromHand(handCards) {
        if (!handCards || handCards.length === 0) {
            return [];
        }

        const handCardIds = this.getBaseCardIdSequence(handCards);
        const availableCombos = [];
        const partialCombos = []; // 部分匹配的组合技（至少有第一张卡）
        
        // 检查所有组合技定义
        for (const combo of this.combos) {
            // 检查手牌中是否包含组合技所需的所有卡牌
            // 对于重复的卡牌，需要检查手牌中是否有足够的数量
            const requiredCards = {};
            combo.sequence.forEach(cardId => {
                requiredCards[cardId] = (requiredCards[cardId] || 0) + 1;
            });

            // 统计手牌中每张卡的数量
            const handCardCounts = {};
            handCardIds.forEach(cardId => {
                handCardCounts[cardId] = (handCardCounts[cardId] || 0) + 1;
            });

            // 检查是否有足够的卡牌
            let hasAllCards = true;
            let matchedCards = 0; // 匹配的卡牌数量
            for (const cardId in requiredCards) {
                const required = requiredCards[cardId];
                const available = handCardCounts[cardId] || 0;
                if (available < required) {
                    hasAllCards = false;
                }
                if (available > 0) {
                    matchedCards += Math.min(available, required);
                }
            }
            
            // 计算匹配度（手牌中有多少张组合技需要的卡牌）
            const matchRatio = matchedCards / combo.sequence.length;
            
            if (hasAllCards) {
                // 完整组合技
                availableCombos.push({
                    combo: combo,
                    fullSequence: combo.sequence,
                    priority: combo.bonusDamage + 10, // 完整组合技优先级更高
                    hasAllCards: true,
                    matchedCards: combo.sequence.length,
                    matchRatio: 1.0
                });
            } else if (matchedCards > 0) {
                // 部分组合技（手牌中至少有一张组合技中的卡牌）
                partialCombos.push({
                    combo: combo,
                    fullSequence: combo.sequence,
                    priority: combo.bonusDamage * matchRatio, // 根据匹配度计算优先级
                    hasAllCards: false,
                    matchedCards: matchedCards,
                    matchRatio: matchRatio
                });
            }
        }
        
        // 合并完整和部分组合技，优先显示完整的
        const allCombos = [...availableCombos, ...partialCombos];
        
        // 按优先级排序
        allCombos.sort((a, b) => b.priority - a.priority);

        // 调试日志（仅在没有找到组合技时输出）
        if (handCards.length > 0 && allCombos.length === 0) {
            console.log('[ComboSystem] 未找到组合技 - 手牌:', handCardIds);
        }

        return allCombos;
    }

    /**
     * 计算组合技加成的伤害
     * @param {number} baseDamage - 基础伤害
     * @param {Object[]} activeCombos - 激活的组合技列表
     * @returns {number} - 加成后的伤害
     */
    calculateComboDamage(baseDamage, activeCombos) {
        if (!activeCombos || activeCombos.length === 0) {
            return baseDamage;
        }

        // 使用最高的加成（如果有多个组合技同时激活）
        const maxBonus = Math.max(...activeCombos.map(c => c.bonusDamage));
        return Math.floor(baseDamage * (1 + maxBonus));
    }
}
