/**
 * 卡牌工厂
 * 负责创建卡牌实例和卡牌效果
 */
class CardFactory {
    constructor() {
        this.cardEffects = this.createCardEffects();
    }

    /**
     * 创建卡牌效果映射
     */
    createCardEffects() {
        return {
            'commit': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                targetPlayer.takeDamage(10);
                return `💾 使用了 Commit，造成 10 点伤害！`;
            },
            'push': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                targetPlayer.takeDamage(20);
                return `⬆️ 使用了 Push，造成 20 点伤害！`;
            },
            'pull': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                targetPlayer.addHealth(15);
                return `⬇️ 使用了 Pull，恢复 15 点生命值！`;
            },
            'merge': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                targetPlayer.takeDamage(30);
                return `🔀 使用了 Merge，造成 30 点伤害！`;
            },
            'rebase': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                const userPlayer = cardUser === 'opponent' ? gameState.opponent : gameState.player;
                targetPlayer.takeDamage(25);
                // 抽牌逻辑由外部处理
                return `🔄 使用了 Rebase，造成 25 点伤害并抽一张牌！`;
            },
            'reset': (gameState, target, cardUser) => {
                const opponent = target === 'opponent' ? gameState.opponent : gameState.player;
                const removed = opponent.removeRandomCard();
                if (removed) {
                    return `⏪ 使用了 Reset，移除了对手的 ${removed.name}！`;
                } else {
                    return `⏪ 使用了 Reset，但对手没有手牌！`;
                }
            },
            'branch': (gameState, target, cardUser) => {
                // 抽牌逻辑由外部处理
                return `🌿 使用了 Branch，抽了两张牌！`;
            },
            'stash': (gameState, target, cardUser) => {
                // 抽牌逻辑由外部处理
                return `📦 使用了 Stash，抽了一张牌！`;
            },
            'cherry-pick': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                targetPlayer.takeDamage(15);
                // 抽牌逻辑由外部处理
                return `🍒 使用了 Cherry Pick，造成 15 点伤害并抽一张牌！`;
            },
            'revert': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                targetPlayer.addHealth(25);
                return `↩️ 使用了 Revert，恢复 25 点生命值！`;
            },
            'fetch': (gameState, target, cardUser) => {
                // 抽牌逻辑由外部处理
                return `📥 使用了 Fetch，抽了一张牌！`;
            },
            'clone': (gameState, target, cardUser) => {
                const targetPlayer = target === 'opponent' ? gameState.opponent : gameState.player;
                targetPlayer.takeDamage(35);
                return `📋 使用了 Clone，造成 35 点巨大伤害！`;
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

