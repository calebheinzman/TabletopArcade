import { discardAndShuffleCard, updateSessionCards } from '@/lib/supabase/card';
import { pushPlayerAction } from '@/lib/supabase/player';
import { useGame } from '@/providers/game-provider';
import { CardData, SessionCard, SessionPlayer } from '@/types/game-interfaces';
import { useCallback, useMemo, useState } from 'react';

const usePlayerCards = (
  playerId: SessionPlayer['playerid'],
  cards: SessionCard[]
) => {
  const gameContext = useGame();

  // Extract player's cards with details from decks
  const playerCards = useMemo(() => {
    return cards
      .filter((card) => card.playerid === playerId)
      .map((sessionCard, index) => {
        const deck = gameContext.decks.find(
          (d) => d.deckid === sessionCard.deckid
        );
        const cardDetails = deck?.cards.find(
          (c) => c.cardid === sessionCard.cardid
        );

        return {
          ...sessionCard,
          ...cardDetails,
          name: cardDetails?.name || 'Unknown Card',
          index,
        } as SessionCard & CardData;
      });
  }, [cards, gameContext.decks, playerId]);

  // Hover state
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);

  const overlapping = playerCards.length > 3;

  // Modify spacing logic
  const isOverflowing = playerCards.length > 8;

  const baseSpacing = isOverflowing
    ? 8 // Tight spacing when overflowing
    : playerCards.length > 5
      ? 20 // Medium spacing for 6-8 cards
      : playerCards.length > 3
        ? 32 // Comfortable spacing for 4-5 cards
        : playerCards.length > 2
          ? 56 // Very spread out for 3 cards
          : 96; // Maximum spacing for 1-2 cards

  // Add size calculation based on conditions
  const isLargeCard =
    !isOverflowing &&
    playerCards.length <= 5 &&
    gameContext.discardPiles.length === 0;

  const handleMouseEnter = useCallback((idx: number) => {
    setHoveredCardIndex(idx);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredCardIndex(null);
  }, []);

  // Determine z-index based on hover
  const getZIndex = useCallback(
    (cardIndex: number): number => {
      if (hoveredCardIndex === null) {
        return cardIndex;
      }
      const distance = Math.abs(cardIndex - hoveredCardIndex);
      // The hovered card gets the highest z-index, neighbors slightly less, etc.
      // Start from a high base and decrement by distance
      return 999 - distance;
    },
    [hoveredCardIndex]
  );

  const getCardStyle = useCallback(
    (cardIndex: number) => {
      let leftOffset = cardIndex * baseSpacing;

      if (hoveredCardIndex !== null) {
        const distance = Math.abs(cardIndex - hoveredCardIndex);
        // Shift cards away from the hovered card to create space
        const shift = 20 - distance * 5;
        if (cardIndex < hoveredCardIndex) {
          leftOffset -= shift;
        } else if (cardIndex > hoveredCardIndex) {
          leftOffset += shift;
        }
      }

      const isHovered = hoveredCardIndex === cardIndex;
      return {
        left: `${leftOffset}px`,
        zIndex: getZIndex(cardIndex),
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'all 0.2s ease-in-out',
      };
    },
    [baseSpacing, hoveredCardIndex, getZIndex]
  );

  const handleCardClick = (
    e: React.MouseEvent,
    card: SessionCard & CardData
  ) => {
    e.stopPropagation(); // Prevent triggering parent onClick
  };

  const handleReveal = async (sessionCardId: number) => {
    try {
      await gameContext.revealCard(playerId, sessionCardId);
    } catch (error) {
      console.error('Error revealing card:', error);
    }
  };

  // Add new state for revealed cards when overflowing
  const [revealedCards, setRevealedCards] = useState<number[]>([]);

  // Get player's discard piles
  const playerDiscardPiles = gameContext.discardPiles.filter(
    (pile) => pile.is_player
  );

  const handleDiscard = async (
    playerId: number,
    cardId: number,
    pileId?: number,
    targetPlayerId?: number
  ) => {
    try {
      if (!gameContext.gameData.can_discard) {
        console.log('Discarding is not allowed in this game');
        return;
      }

      // Get all cards in the target pile (if it exists)
      const cardsInPile = gameContext.sessionCards.filter((card) => {
        if (pileId === undefined) {
          return false; // Deck discard
        }

        const pile = gameContext.discardPiles.find((p) => p.pile_id === pileId);
        if (!pile) return false;

        if (pile.is_player) {
          // For player piles, match both pile_id and playerid
          return card.pile_id === pileId && card.playerid === targetPlayerId;
        } else {
          // For board piles, just match pile_id
          return card.pile_id === pileId;
        }
      });

      if (pileId !== undefined) {
        const discardPile = gameContext.discardPiles.find(
          (p) => p.pile_id === pileId
        );
        if (!discardPile) throw new Error('Discard pile not found');

        // Determine the playerid value
        const newPlayerId: number | null = discardPile.is_player
          ? (targetPlayerId ?? null)
          : null;

        // Get the highest position in the pile
        const maxPosition = Math.max(
          ...cardsInPile.map((card) => card.cardPosition),
          0
        );

        // Add the new card at the highest position + 1
        const updates = [
          {
            sessionid: gameContext.sessionid,
            sessioncardid: cardId,
            cardPosition: maxPosition + 1,
            playerid: newPlayerId,
            pile_id: pileId,
            isRevealed: discardPile.is_face_up,
          },
        ];

        await updateSessionCards(updates);
      } else {
        // Original shuffle behavior for deck
        await discardAndShuffleCard(
          gameContext.sessionid,
          cardId,
          gameContext.sessionCards
        );
      }

      await pushPlayerAction(gameContext.sessionid, playerId, `Discarded card`);
    } catch (error) {
      console.error('Error discarding card:', error);
    }
  };

  const handlePassCard = async (
    fromPlayerId: number,
    cardId: number,
    targetPlayerId: number
  ) => {
    try {
      const updates = [
        {
          sessionid: gameContext.sessionid,
          sessioncardid: cardId,
          cardPosition: 0,
          playerid: targetPlayerId,
          pile_id: null,
          isRevealed: false,
        },
      ];

      await updateSessionCards(updates);
      await pushPlayerAction(
        gameContext.sessionid,
        fromPlayerId,
        `Passed a card to ${gameContext.sessionPlayers.find((p) => p.playerid === targetPlayerId)?.username}`
      );
    } catch (error) {
      console.error('Error passing card:', error);
    }
  };

  return {
    playerCards,
    handleCardClick,
    handleReveal,
    handleMouseEnter,
    handleMouseLeave,
    getCardStyle,
    handlePassCard,
    handleDiscard,
    getZIndex,
    hoveredCardIndex,
    overlapping,
    baseSpacing,
    isOverflowing,
    isLargeCard,
    revealedCards,
    playerDiscardPiles,
  };
};

export default usePlayerCards;
