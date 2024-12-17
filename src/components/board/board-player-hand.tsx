// components/Board/BoardPlayerHand.tsx

'use client';

import usePlayerPosition from '@/hooks/usePlayerPosition';
import { SessionPlayer, SessionCard } from '@/types/game-interfaces';
import { FC, useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { useGame } from '@/components/GameContext';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TbCards, TbCoin, TbPlugConnectedX } from 'react-icons/tb';
import BoardDiscardPile from '@/components/board/board-discard-pile';
import { updateSessionCards } from '@/lib/supabase/card';
import { discardAndShuffleCard } from '@/lib/supabase/card';

interface BoardPlayerHandProps {
  player: SessionPlayer;
  index: number;
  totalPlayers: number;
  onSelect: (playerId: number) => void;
  cards: SessionCard[];
}

const BoardPlayerHand: FC<BoardPlayerHandProps> = ({
  player,
  index,
  totalPlayers,
  onSelect,
  cards,
}) => {
  const gameContext = useGame();
  const position = usePlayerPosition(index, totalPlayers);
  const [isActive, setIsActive] = useState(true);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);

  useEffect(() => {
    const checkActivity = () => {
      const lastAction = new Date(player.time_last_action).getTime();
      const now = new Date().getTime();
      const timeDiff = now - lastAction;
      setIsActive(timeDiff <= 30000); // 30 seconds in milliseconds
    };

    checkActivity();
    const interval = setInterval(checkActivity, 1000);
    return () => clearInterval(interval);
  }, [player.time_last_action]);

  const playerCards = cards
    .filter(card => card.playerid === player.playerid)
    .map(sessionCard => {
      const deck = gameContext.decks.find(d => d.deckid === sessionCard.deckid);
      const cardDetails = deck?.cards.find(c => c.cardid === sessionCard.cardid);
      return {
        ...sessionCard,
        name: cardDetails?.name || 'Unknown Card',
      };
    });

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent div's onClick
  };

  const handleReveal = async (sessionCardId: number) => {
    try {
      await gameContext.revealCard(player.playerid, sessionCardId);
      if (isOverflowing) {
        setRevealedCards(prev => 
          prev.includes(sessionCardId) 
            ? prev.filter(id => id !== sessionCardId)
            : [...prev, sessionCardId]
        );
      }
    } catch (error) {
      console.error('Error revealing card:', error);
    }
  };

  const handleMouseEnter = (idx: number) => {
    setHoveredCardIndex(idx);
  };

  const handleMouseLeave = () => {
    setHoveredCardIndex(null);
  };

  // Modify spacing logic
  const isOverflowing = playerCards.length > 8;
  const baseSpacing = isOverflowing ? 8 : (playerCards.length > 3 ? 20 : 56);

  // Add new state for revealed cards when overflowing
  const [revealedCards, setRevealedCards] = useState<number[]>([]);

  // Determine z-index based on hover
  const getZIndex = (cardIndex: number): number => {
    if (hoveredCardIndex === null) {
      return cardIndex; 
    }
    const distance = Math.abs(cardIndex - hoveredCardIndex);
    // The hovered card gets the highest z-index, neighbors slightly less, etc.
    // Start from a high base and decrement by distance
    return 999 - distance;
  };

  // Get player's discard piles
  const playerDiscardPiles = gameContext.discardPiles.filter(pile => pile.is_player);

  const handleDiscard = async (playerId: number, cardId: number, pileId?: number, targetPlayerId?: number) => {
    try {
      if (!gameContext.gameData.can_discard) {
        console.log('Discarding is not allowed in this game');
        return;
      }

      // Only check session.locked_player_discard if game setting is enabled
      if (gameContext.gameData.lock_player_discard && gameContext.session.locked_player_discard) {
        console.log('Player discarding is currently locked');
        return;
      }

      // Get all cards in the target pile (if it exists)
      const cardsInPile = gameContext.sessionCards.filter(card => {
        if (pileId === undefined) {
          return false; // Deck discard
        }
        
        const pile = gameContext.discardPiles.find(p => p.pile_id === pileId);
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
        const discardPile = gameContext.discardPiles.find(p => p.pile_id === pileId);
        if (!discardPile) throw new Error('Discard pile not found');

        // Determine the playerid value
        const newPlayerId: number | null = discardPile.is_player ? (targetPlayerId ?? null) : null;

        // Update positions of existing cards in pile
        const updates = cardsInPile.map(card => ({
          sessionid: gameContext.sessionid,
          sessioncardid: card.sessioncardid,
          cardPosition: card.cardPosition + 1,
          playerid: newPlayerId,
          pile_id: pileId,
          isRevealed: discardPile.is_face_up
        }));

        // Add the new card at position 1
        updates.push({
          sessionid: gameContext.sessionid,
          sessioncardid: cardId,
          cardPosition: 1,
          playerid: newPlayerId,
          pile_id: pileId,
          isRevealed: discardPile.is_face_up
        });

        await updateSessionCards(updates);
      } else {
        // Original shuffle behavior for deck
        await discardAndShuffleCard(
          gameContext.sessionid,
          cardId,
          gameContext.sessionCards
        );
      }
    } catch (error) {
      console.error('Error discarding card:', error);
    }
  };

  return (
    <div
      className="flex flex-col items-center text-center absolute transform -translate-x-1/2 -translate-y-1/2"
      style={position}
    >
      <div
        onClick={() => onSelect(player.playerid)}
        className={`
          mb-1 bg-white rounded-lg shadow-md p-1 cursor-pointer
          ${player.is_turn ? 'bg-yellow-50' : ''} 
          hover:bg-yellow-100
        `}
      >
        <div className={`
          text-sm font-semibold flex flex-col gap-1
          ${isActive ? 'text-green-600' : 'text-red-600'} 
        `}>
          <div className="flex items-center justify-center">
            {player.username} 
            {!isActive && <div className="ml-1 mr-1"><TbPlugConnectedX size={14} /></div>}
            {player.is_turn}
          </div>
          <div className="flex items-center justify-center text-xs text-gray-600">
            <div className="mr-1"><TbCards size={12} /></div>
            <span className="mr-2">{playerCards.length}</span>
            <div className="mr-1"><TbCoin size={12} /></div>
            <span>{player.num_points || 0}</span>
          </div>
        </div>
      </div>

      {playerCards.length > 0 && (
        <div className="relative flex flex-col justify-center items-center mt-1 mb-2">
          {/* Main hand - adjust positioning based on player location */}
          <div
            className="relative"
            style={{
              width: `${isOverflowing 
                ? (playerCards.length - 1) * 8 + 48 + 80 // 80px total padding
                : playerCards.length * baseSpacing}px`,
              height: '80px',
              left: isOverflowing 
                ? position.left && position.left.toString().includes('-') 
                  ? '-80px'  // For left side of board
                  : position.top === '50%' 
                    ? '0px'   // For top/bottom of board
                    : '80px'  // For right side of board
                : '0px',
              transform: 'none'
            }}
          >
            {playerCards.map((card, cardIndex) => {
              const isHovered = hoveredCardIndex === cardIndex;

              // Adjust positions to create spacing when hovering a card
              let leftOffset = cardIndex * baseSpacing;

              if (hoveredCardIndex !== null) {
                // The hovered card stays in place, others shift away
                const distance = Math.abs(cardIndex - hoveredCardIndex);
                // Shift by a factor depending on distance from the hovered card.
                // Closer cards shift more to make room.
                const shift = (20 - distance * 5);
                if (cardIndex < hoveredCardIndex) {
                  leftOffset -= shift;
                } else if (cardIndex > hoveredCardIndex) {
                  leftOffset += shift;
                }
              }

              const isTopCard = cardIndex === playerCards.length - 1;
              const showOnEdge = isOverflowing && card.isRevealed && !isTopCard;

              return (
                <Dialog key={`card-${card.sessioncardid}-${card.cardid}`}>
                  <DialogTrigger asChild>
                    <Card
                      onMouseEnter={() => handleMouseEnter(cardIndex)}
                      onMouseLeave={handleMouseLeave}
                      onClick={handleCardClick}
                      className={`
                        absolute
                        w-14 h-20
                        ${isActive ? 'bg-gray-200' : 'bg-gray-400'} 
                        shadow-md flex items-center justify-center
                        cursor-pointer transition-all duration-200
                        ${isHovered ? '-translate-y-2' : ''}
                      `}
                      style={{
                        left: `${leftOffset}px`,
                        zIndex: getZIndex(cardIndex),
                      }}
                    >
                      {card.isRevealed && (
                        <div
                          className={`
                            text-[8px] truncate block transition-all absolute
                            ${showOnEdge && !isHovered
                              ? 'left-2 top-[70%] -translate-y-1/2 -rotate-90 origin-left'
                              : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center'}
                          `}
                        >
                          {card.name}
                        </div>
                      )}
                    </Card>
                  </DialogTrigger>
                  <DialogContent onClick={handleCardClick}>
                    <DialogHeader>
                      <DialogTitle>{card.name}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 mt-4">
                      <DialogClose asChild>
                        <Button onClick={() => handleReveal(card.sessioncardid)}>
                          {card.isRevealed ? 'Hide Card' : 'Reveal Card'}
                        </Button>
                      </DialogClose>

                      {gameContext.gameData.can_discard && (
                        <div className="flex flex-col gap-2">
                          {gameContext.discardPiles.length > 0 ? (
                            <>
                              <h4 className="text-sm font-semibold">Discard to:</h4>
                              {gameContext.discardPiles.map((pile) => {
                                if (pile.is_player) {
                                  return gameContext.sessionPlayers.map(player => (
                                    <DialogClose key={`${pile.pile_id}-${player.playerid}`} asChild>
                                      <Button
                                        variant="outline"
                                        onClick={() => handleDiscard(player.playerid, card.sessioncardid, pile.pile_id, player.playerid)}
                                      >
                                        {player.playerid === player.playerid ? 'Your Pile' : `${player.username}'s Pile`}
                                      </Button>
                                    </DialogClose>
                                  ));
                                } else {
                                  return (
                                    <DialogClose key={pile.pile_id} asChild>
                                      <Button
                                        variant="outline"
                                        onClick={() => handleDiscard(player.playerid, card.sessioncardid, pile.pile_id)}
                                      >
                                        {pile.pile_name || `Discard Pile ${pile.pile_id}`}
                                        {pile.is_face_up ? ' (Face Up)' : ' (Face Down)'}
                                      </Button>
                                    </DialogClose>
                                  );
                                }
                              })}
                            </>
                          ) : (
                            <DialogClose asChild>
                              <Button
                                variant="outline"
                                onClick={() => handleDiscard(player.playerid, card.sessioncardid)}
                              >
                                Discard to Deck
                              </Button>
                            </DialogClose>
                          )}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>

          {/* Revealed cards section when overflowing */}
          {isOverflowing && revealedCards.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-[300px]">
              {playerCards
                .filter(card => revealedCards.includes(card.sessioncardid))
                .map(card => (
                  <Card
                    key={`revealed-${card.sessioncardid}`}
                    className="w-14 h-20 bg-gray-200 shadow-md flex items-center justify-center"
                    onClick={handleCardClick}
                  >
                    <div className="text-[8px] px-1 text-center">
                      {card.name}
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>
      )}

      {playerDiscardPiles.length > 0 && (
        <div 
          className={`${playerCards.length === 0 ? 'mt-1' : 'mt-2'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-4">
            {playerDiscardPiles.map((pile) => (
              <BoardDiscardPile
                key={pile.pile_id}
                pile={pile}
                playerId={player.playerid}
                className="w-14 h-20"
                variant="player"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardPlayerHand;