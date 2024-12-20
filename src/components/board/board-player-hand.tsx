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
import { pushPlayerAction } from '@/lib/supabase/player';

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
  const baseSpacing = isOverflowing 
    ? 8  // Tight spacing when overflowing
    : playerCards.length > 5 
      ? 20  // Medium spacing for 6-8 cards
      : playerCards.length > 3 
        ? 32  // Comfortable spacing for 4-5 cards
        : playerCards.length > 2
          ? 56  // Very spread out for 3 cards
          : 96; // Maximum spacing for 1-2 cards
  
  // Add size calculation based on conditions
  const uselargeCards = !isOverflowing && 
    playerCards.length <= 5 && 
    gameContext.discardPiles.length === 0;
  
  const cardWidth = uselargeCards ? 'w-24' : 'w-14';
  const cardHeight = uselargeCards ? 'h-32' : 'h-20';

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

        // Get the highest position in the pile
        const maxPosition = Math.max(...cardsInPile.map(card => card.cardPosition), 0);

        // Add the new card at the highest position + 1
        const updates = [{
          sessionid: gameContext.sessionid,
          sessioncardid: cardId,
          cardPosition: maxPosition + 1,
          playerid: newPlayerId,
          pile_id: pileId,
          isRevealed: discardPile.is_face_up
        }];

        await updateSessionCards(updates);
      } else {
        // Original shuffle behavior for deck
        await discardAndShuffleCard(
          gameContext.sessionid,
          cardId,
          gameContext.sessionCards
        );
      }

      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Discarded card`
      );
    } catch (error) {
      console.error('Error discarding card:', error);
    }
  };

  const handlePassCard = async (fromPlayerId: number, cardId: number, targetPlayerId: number) => {
    try {
      const updates = [{
        sessionid: gameContext.sessionid,
        sessioncardid: cardId,
        cardPosition: 0,
        playerid: targetPlayerId,
        pile_id: null,
        isRevealed: false
      }];

      await updateSessionCards(updates);
      await pushPlayerAction(
        gameContext.sessionid,
        fromPlayerId,
        `Passed a card to ${gameContext.sessionPlayers.find(p => p.playerid === targetPlayerId)?.username}`
      );
    } catch (error) {
      console.error('Error passing card:', error);
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
          ${gameContext.gameData.turn_based && player.is_turn ? 'bg-yellow-50' : ''} 
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
              const isTightSpacing = baseSpacing <= 32; // Adjusted to include 4-card hands
              const showOnEdge = isTightSpacing && card.isRevealed && !isTopCard;

              return (
                <Dialog key={`card-${card.sessioncardid}-${card.cardid}`}>
                  <DialogTrigger asChild>
                    <Card
                      onMouseEnter={() => handleMouseEnter(cardIndex)}
                      onMouseLeave={handleMouseLeave}
                      onClick={handleCardClick}
                      className={`
                        absolute
                        ${cardWidth} ${cardHeight}
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
                            truncate block transition-all absolute
                            ${showOnEdge && !isHovered
                              ? 'left-2 top-[70%] -translate-y-1/2 -rotate-90 origin-left text-[8px]'
                              : `left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center
                                 ${uselargeCards ? 'text-sm' : 'text-[8px]'}`}
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
                                  return gameContext.sessionPlayers.map(sessionPlayer => (
                                    <DialogClose key={`${pile.pile_id}-${sessionPlayer.playerid}`} asChild>
                                      <Button
                                        variant="outline"
                                        onClick={() => handleDiscard(player.playerid, card.sessioncardid, pile.pile_id, sessionPlayer.playerid)}
                                      >
                                        {`${sessionPlayer.username}'s Discard`}
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

                      {gameContext.gameData.pass_cards && (
                        <div className="flex flex-col gap-2">
                          <h4 className="text-sm font-semibold">Pass card to:</h4>
                          {gameContext.sessionPlayers
                            .filter(sessionPlayer => sessionPlayer.playerid !== player.playerid)
                            .map(targetPlayer => (
                              <DialogClose key={targetPlayer.playerid} asChild>
                                <Button
                                  variant="outline"
                                  onClick={() => handlePassCard(player.playerid, card.sessioncardid, targetPlayer.playerid)}
                                >
                                  Pass to {targetPlayer.username}
                                </Button>
                              </DialogClose>
                            ))}
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