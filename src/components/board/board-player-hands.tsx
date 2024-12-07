// components/Board/BoardPlayerHands.tsx

'use client';

import { useGame } from '@/components/GameContext';
import { FC } from 'react';
import BoardPlayerHand from './board-player-hand';
import { SessionPlayer } from '@/lib/supabase';

interface BoardPlayerHandsProps {
  players: (SessionPlayer & { player_order?: number })[];
  totalPlayers: number;
  onSelectPlayer: (playerId: number | null) => void;
}

const BoardPlayerHands: FC<BoardPlayerHandsProps> = ({
  players,
  totalPlayers,
  onSelectPlayer,
}) => {
  const { sessionCards } = useGame();

  return (
    <>
      {players.map((player) => (
        <BoardPlayerHand
          key={`player-${player.playerid}`}
          player={player}
          index={player.player_order ? player.player_order - 1 : 0}
          totalPlayers={totalPlayers}
          onSelect={onSelectPlayer}
          cards={sessionCards}
        />
      ))}
    </>
  );
};

export default BoardPlayerHands;
