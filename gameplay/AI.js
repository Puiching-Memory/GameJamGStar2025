/**
 * AI逻辑
 * 负责对手的AI决策
 */
class AI {
    constructor(gameState, cardFactory) {
        this.gameState = gameState;
        this.cardFactory = cardFactory;
    }

    /**
     * 选择要打出的卡牌序列
     */
    selectCardsToPlay() {
        const opponent = this.gameState.opponent;
        const playableCards = opponent.hand.filter(card => card.cost <= opponent.mana);

        if (playableCards.length === 0) {
            return [];
        }

        // AI策略：尽可能打光能量
        const playSequence = [];
        let remainingMana = opponent.mana;
        const availableCards = [...playableCards];

        // 按优先级排序：攻击 > 特殊 > 治疗
        const cardPriority = {
            'attack': 1,
            'special': 2,
            'heal': 3
        };

        availableCards.sort((a, b) => {
            const priorityDiff = (cardPriority[a.type] || 5) - (cardPriority[b.type] || 5);
            if (priorityDiff !== 0) return priorityDiff;
            return b.cost - a.cost; // 能量高的优先
        });

        // 贪心算法：尽可能打光能量
        while (remainingMana > 0 && availableCards.length > 0) {
            let selectedCard = null;
            let selectedIndex = -1;
            let bestScore = -1;

            for (let i = 0; i < availableCards.length; i++) {
                const card = availableCards[i];
                // 检查是否有足够能量打出卡牌（基于基础消耗）
                if (card.cost <= remainingMana) {
                    // 计算净能量消耗（考虑能量恢复效果）
                    const netCost = card.getNetManaCost ? card.getNetManaCost(remainingMana, opponent.maxMana) : card.cost;
                    
                    // 如果净消耗后能量为负，说明这张卡牌会恢复能量，可以继续打
                    // 但前提是基础消耗要够
                    const priority = cardPriority[card.type] || 5;
                    const energyEfficiency = card.cost / remainingMana;
                    const score = (6 - priority) * 10 + energyEfficiency * 5;

                    // 如果剩余能量刚好够用，优先选择
                    if (card.cost === remainingMana) {
                        selectedCard = card;
                        selectedIndex = i;
                        break;
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        selectedCard = card;
                        selectedIndex = i;
                    }
                }
            }

            if (selectedCard) {
                playSequence.push(selectedCard);
                // 计算净能量消耗（考虑能量恢复效果）
                // 注意：能量可以超过上限，所以不需要限制上限
                const netCost = selectedCard.getNetManaCost ? selectedCard.getNetManaCost(remainingMana, opponent.maxMana) : selectedCard.cost;
                // 扣除净能量消耗
                remainingMana -= netCost;
                // 确保剩余能量不为负（但允许超过上限）
                remainingMana = Math.max(0, remainingMana);
                availableCards.splice(selectedIndex, 1);
            } else {
                break;
            }
        }

        return playSequence;
    }
}

