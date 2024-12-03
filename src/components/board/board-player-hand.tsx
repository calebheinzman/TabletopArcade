// components/Board/BoardPlayerHand.tsx

'use client';

import usePlayerPosition from '@/hooks/usePlayerPosition';
import { SessionPlayer } from '@/lib/supabase';
import { FC } from 'react';
import { Card } from '../ui/card';

interface BoardPlayerHandProps {
  player: SessionPlayer;
  index: number;
  totalPlayers: number;
  onSelect: (playerId: string) => void;
}

const BoardPlayerHand: FC<BoardPlayerHandProps> = ({
  player,
  index,
  totalPlayers,
  onSelect,
}) => {
  const position = usePlayerPosition(index, totalPlayers);

  return (
    <div
      onClick={() => onSelect(player.id)}
      style={position}
      className="flex flex-col items-center text-center cursor-pointer absolute transform -translate-x-1/2 -translate-y-1/2"
    >
      {/* Player's Name */}
      <div
        className={`text-xs sm:text-sm font-semibold mb-1 ${
          /* Highlight if it's the current turn */
          player.isActive ? 'text-green-600' : ''
        }`}
      >
        {player.username} {!player.isActive && '(Disconnected)'}
      </div>

      {/* Tokens, Points, and Number of Cards */}
      <div className="text-xs sm:text-sm font-semibold mb-2">
        Tokens: {player.tokens || 0} | Points: {player.score || 0} | Cards:{' '}
        {player.cards.length}
      </div>

      {/* Player's Cards */}
      <div className="relative flex justify-center items-center mt-2 gap-2">
        {player.cards.map((card) => (
          <Card
            key={card.id}
            className={`w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16 lg:w-14 lg:h-20 
              ${
                player.isActive ? 'bg-gray-200' : 'bg-gray-400'
              } shadow-md flex items-center justify-center p-1`}
          >
            {card.isRevealed && (
              <div className="text-center text-xs sm:text-sm break-words whitespace-normal overflow-hidden p-1">
                {card.name}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BoardPlayerHand;
