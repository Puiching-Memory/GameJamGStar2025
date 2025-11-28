/**
 * AI逻辑
 * 负责对手的AI决策
 */
export class AI {
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
                if (card.cost <= remainingMana) {
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
                remainingMana -= selectedCard.cost;
                availableCards.splice(selectedIndex, 1);
            } else {
                break;
            }
        }

        return playSequence;
    }
}

