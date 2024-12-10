import { useGame } from '@/components/GameContext';
import { CardData, SessionCard, SessionPlayer } from '@/types/game-interfaces';
import { useCallback, useMemo, useState } from 'react';

const usePlayerCards = (player: SessionPlayer, cards: SessionCard[]) => {
  const gameContext = useGame();

  // Extract player's cards with details from decks
  const playerCards = useMemo(() => {
    return cards
      .filter((card) => card.playerid === player.playerid)
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
  }, [cards, gameContext.decks, player.playerid]);

  // Hover state
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);

  const overlapping = playerCards.length > 3;
  const baseSpacing = overlapping ? 20 : 56;

  const handleMouseEnter = useCallback((idx: number) => {
    setHoveredCardIndex(idx);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredCardIndex(null);
  }, []);

  // Compute z-index and positioning for each card based on hover
  const getZIndex = useCallback(
    (cardIndex: number): number => {
      if (hoveredCardIndex === null) {
        return cardIndex;
      }
      const distance = Math.abs(cardIndex - hoveredCardIndex);
      // Higher z-index for hovered card and its neighbors
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

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent onClick
  };

  const handleReveal = async (sessionCardId: number) => {
    try {
      await gameContext.revealCard(player.playerid, sessionCardId);
    } catch (error) {
      console.error('Error revealing card:', error);
    }
  };

  return {
    playerCards,
    handleCardClick,
    handleReveal,
    handleMouseEnter,
    handleMouseLeave,
    getCardStyle,
    hoveredCardIndex,
    overlapping,
    baseSpacing,
  };
};

export default usePlayerCards;
