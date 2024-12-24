import { useGame } from '@/context/game-context';
import { discardAndShuffleCard, updateSessionCards } from '@/lib/supabase/card';
import { pushPlayerAction } from '@/lib/supabase/player';
import { SessionCard } from '@/types/game-interfaces';
import { useCallback, useState } from 'react';

/**
 * 2. useCardInteractions — handles the actual user interactions:
 *    mouse hover, clicking a card, reveal, discard, pass, etc.
 */
export default function useCardInteractions(
  playerId: number,
  gameContext: ReturnType<typeof useGame>
) {
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);

  const handleMouseEnter = useCallback((idx: number) => {
    setHoveredCardIndex(idx);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredCardIndex(null);
  }, []);

  const handleCardClick = useCallback(
    (e: React.MouseEvent, card: SessionCard) => {
      e.stopPropagation();
      // Additional click logic if needed...
    },
    []
  );

  const handleReveal = useCallback(
    async (sessionCardId: number) => {
      try {
        await gameContext.revealCard(playerId, sessionCardId);
      } catch (error) {
        console.error('Error revealing card:', error);
      }
    },
    [gameContext, playerId]
  );

  const handleDiscard = useCallback(
    async (
      pId: number,
      cardId: number,
      pileId?: number,
      targetPlayerId?: number
    ) => {
      try {
        if (!gameContext.gameData.can_discard) {
          console.log('Discarding not allowed.');
          return;
        }

        if (pileId !== undefined) {
          // find discard pile, etc.
          const discardPile = gameContext.discardPiles.find(
            (p) => p.pile_id === pileId
          );
          if (!discardPile) throw new Error('Discard pile not found');

          // get highest position in the pile
          const cardsInPile = gameContext.sessionCards.filter(
            (sc) =>
              sc.pile_id === pileId &&
              sc.playerid === (discardPile.is_player ? targetPlayerId : null)
          );
          const maxPosition = Math.max(
            ...cardsInPile.map((c) => c.cardPosition),
            0
          );

          await updateSessionCards([
            {
              sessionid: gameContext.sessionid,
              sessioncardid: cardId,
              cardPosition: maxPosition + 1,
              playerid: discardPile.is_player ? (targetPlayerId ?? null) : null,
              pile_id: pileId,
              isRevealed: discardPile.is_face_up,
            },
          ]);
        } else {
          // discard to deck with shuffle
          await discardAndShuffleCard(
            gameContext.sessionid,
            cardId,
            gameContext.sessionCards
          );
        }

        await pushPlayerAction(gameContext.sessionid, pId, `Discarded card`);
      } catch (error) {
        console.error('Error discarding card:', error);
      }
    },
    [gameContext]
  );

  const handlePassCard = useCallback(
    async (fromPlayerId: number, cardId: number, targetPlayerId: number) => {
      try {
        await updateSessionCards([
          {
            sessionid: gameContext.sessionid,
            sessioncardid: cardId,
            cardPosition: 0,
            playerid: targetPlayerId,
            pile_id: null,
            isRevealed: false,
          },
        ]);
        const targetName = gameContext.sessionPlayers.find(
          (p) => p.playerid === targetPlayerId
        )?.username;
        await pushPlayerAction(
          gameContext.sessionid,
          fromPlayerId,
          `Passed a card to ${targetName}`
        );
      } catch (error) {
        console.error('Error passing card:', error);
      }
    },
    [gameContext]
  );

  const getZIndex = useCallback(
    (cardIndex: number): number => {
      if (hoveredCardIndex === null) return cardIndex;
      const distance = Math.abs(cardIndex - hoveredCardIndex);
      return 999 - distance;
    },
    [hoveredCardIndex]
  );

  return {
    hoveredCardIndex,
    handleMouseEnter,
    handleMouseLeave,
    handleCardClick,
    handleReveal,
    handleDiscard,
    handlePassCard,
    getZIndex,
  };
}
