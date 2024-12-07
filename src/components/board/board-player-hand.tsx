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
  
  useEffect(() => {
    const checkActivity = () => {
      const lastAction = new Date(player.time_last_action).getTime();
      const now = new Date().getTime();
      const timeDiff = now - lastAction;
      setIsActive(timeDiff <= 30000); // 30 seconds in milliseconds
    };

    // Check immediately
    checkActivity();

    // Set up interval to check every second
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

  return (
    <div
      onClick={() => onSelect(player.playerid)}
      style={position}
      className="flex flex-col items-center text-center cursor-pointer absolute transform -translate-x-1/2 -translate-y-1/2"
    >
      <div className={`
        text-xs sm:text-sm font-semibold mb-1 
        ${isActive ? 'text-green-600' : 'text-red-600'} 
        ${player.is_turn ? 'ring-2 ring-yellow-400 rounded-full px-2 py-1 bg-yellow-50' : ''}
      `}>
        {player.username} {!isActive && '(Disconnected)'}
        {player.is_turn && ' 🎲'}
      </div>

      <div className="text-xs sm:text-sm font-semibold mb-2">
        Tokens: {player.num_points || 0} | Cards: {playerCards.length}
      </div>

      <div className="relative flex justify-center items-center mt-2 gap-2">
        {playerCards.map((card) => (
          <Dialog key={`card-${card.sessioncardid}-${card.cardid}`}>
            <DialogTrigger asChild>
              <Card
                onClick={handleCardClick}
                className={`w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16 lg:w-14 lg:h-20 
                  ${isActive ? 'bg-gray-200' : 'bg-gray-400'} shadow-md flex items-center justify-center
                  cursor-pointer hover:shadow-lg transition-shadow`}
              >
                {card.isRevealed && (
                  <div className="px-0.5 w-full">
                    <span className="text-[4px] sm:text-[6px] md:text-[8px] truncate block text-center">
                      {card.name}
                    </span>
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
                  <Button
                    onClick={() => handleReveal(card.sessioncardid)}
                  >
                    {card.isRevealed ? 'Hide Card' : 'Reveal Card'}
                  </Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
};

export default BoardPlayerHand;
