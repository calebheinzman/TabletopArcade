// components/Board/BoardPlayerHand.tsx

'use client';

import usePlayerPosition from '@/hooks/usePlayerPosition';
import { SessionPlayer, SessionCard } from '@/lib/supabase';
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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TbCards, TbCoin, TbPlugConnectedX } from 'react-icons/tb';

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

  // Determine spacing
  const overlapping = playerCards.length > 3;
  const baseSpacing = overlapping ? 20 : 56;

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

  return (
    <div
      onClick={() => onSelect(player.playerid)}
      style={position}
      className="flex flex-col items-center text-center cursor-pointer absolute transform -translate-x-1/2 -translate-y-1/2"
    >
      <div
        className={`mb-2 bg-white rounded-lg shadow-md p-2 ${player.is_turn ? 'bg-yellow-50' : ''} hover:bg-yellow-100`}
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

      <div className="relative flex justify-center items-center mt-2">
        <div
          className="relative"
          style={{
            width: `${overlapping ? (playerCards.length - 1) * 20 + 56 : playerCards.length * 56}px`,
            height: '80px'
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
            const showOnEdge = overlapping && card.isRevealed && !isTopCard;

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
                  <div className="flex justify-center mt-4">
                    <DialogClose asChild>
                      <Button onClick={() => handleReveal(card.sessioncardid)}>
                        {card.isRevealed ? 'Hide Card' : 'Reveal Card'}
                      </Button>
                    </DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BoardPlayerHand;