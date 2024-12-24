import { GameContextType } from '@/context/game-context';
import { SessionCard } from '@/types/game-interfaces';

export function initializeSession(gameContext: GameContextType): SessionCard[] {
  const deck: SessionCard[] = [];
  let cardId = 1;

  gameContext.decks.forEach((deckData) => {
    const cards = deckData.cards;
    cards.forEach((card) => {
      for (let i = 0; i < card.count; i++) {
        deck.push({
          sessionid: gameContext.sessionid,
          sessioncardid: cardId++,
          cardid: card.cardid,
          deckid: deckData.deckid,
          cardPosition: 0,
          playerid: 0,
          isRevealed: false,
          pile_id: null,
          card_hidden: false,
        });
      }
    });
  });

  return deck;
}
