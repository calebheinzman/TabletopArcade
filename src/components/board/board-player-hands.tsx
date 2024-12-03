// components/Board/BoardPlayerHands.tsx

'use client';

import { SessionPlayer } from '@/lib/supabase';
import { FC } from 'react';
import BoardPlayerHand from './board-player-hand';

interface BoardPlayerHandsProps {
  players: SessionPlayer[];
  totalPlayers: number;
  onSelectPlayer: (playerId: string) => void;
}

const BoardPlayerHands: FC<BoardPlayerHandsProps> = ({
  players,
  totalPlayers,
  onSelectPlayer,
}) => {
  return (
    <>
      {/* Players */}
      {players.map((player, index) => (
        <BoardPlayerHand
          key={player.id}
          player={player}
          index={index}
          totalPlayers={totalPlayers}
          onSelect={onSelectPlayer}
        />
      ))}
    </>
  );
};

export default BoardPlayerHands;
