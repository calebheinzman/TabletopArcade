import { useGame } from '@/context/game-context';
import { CardData, SessionCard, SessionPlayer } from '@/types/game-interfaces';
import { useMemo, useState } from 'react';

/**
 * 1. usePlayerCardsData — extracts and memoizes the player’s card data
 *    and calculates layout details (overflow, spacing, etc.).
 */
export function usePlayerCardsData(
  playerId: SessionPlayer['playerid'],
  cards: SessionCard[],
  gameContext: ReturnType<typeof useGame>
) {
  const playerCards = useMemo(() => {
    return cards
      .filter((c) => c.playerid === playerId)
      .map((sessionCard, index) => {
        const deck = gameContext.decks.find(
          (d) => d.deckid === sessionCard.deckid
        );
        const cardDetails = deck?.cards.find(
          (dc) => dc.cardid === sessionCard.cardid
        );

        return {
          ...sessionCard,
          ...cardDetails,
          name: cardDetails?.name || 'Unknown Card',
          index,
        } as SessionCard & CardData;
      });
  }, [cards, gameContext.decks, playerId]);

  const isOverflowing = playerCards.length > 8;
  const baseSpacing = isOverflowing
    ? 8
    : playerCards.length > 5
      ? 20
      : playerCards.length > 3
        ? 32
        : playerCards.length > 2
          ? 56
          : 96;

  const isLargeCard =
    !isOverflowing &&
    playerCards.length <= 5 &&
    gameContext.discardPiles.length === 0;

  // Track revealed cards in overflow scenario:
  const [revealedCards] = useState<number[]>([]); // (Could add logic to set revealed)

  // Get player's discard piles:
  const playerDiscardPiles = gameContext.discardPiles.filter(
    (pile) => pile.is_player
  );

  return {
    playerCards,
    isOverflowing,
    isLargeCard,
    baseSpacing,
    revealedCards,
    playerDiscardPiles,
  };
}
