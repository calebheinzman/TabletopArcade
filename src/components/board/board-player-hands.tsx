// components/Board/BoardPlayerHands.tsx

'use client';

import { useGame } from '@/components/GameContext';
import { FC } from 'react';
import BoardPlayerHand from './board-player-hand';
import { SessionPlayer } from '@/types/game-interfaces';

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
        <div key={`player-${player.playerid}`} className="my-4">
          <BoardPlayerHand
            player={player}
            index={player.player_order ? player.player_order - 1 : 0}
            totalPlayers={totalPlayers}
            onSelect={onSelectPlayer}
            cards={sessionCards}
          />
        </div>
      ))}
    </>
  );
};

export default BoardPlayerHands;
