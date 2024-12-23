// components/Board/BoardPlayerHands.tsx

'use client';

import { FC } from 'react';
import { useBoardContext } from './board-context';
import BoardPlayerHand from './board-player-hand';

const BoardPlayerHands: FC = () => {
  const { players, totalPlayers, onSelectPlayer, gameContext } =
    useBoardContext();

  const { sessionCards } = gameContext;

  return (
    <div className="absolute inset-0 m-16">
      {players.map((player) => (
        <div key={`player-${player.playerid}`}>
          <BoardPlayerHand
            player={player}
            index={player.player_order ? player.player_order - 1 : 0}
            totalPlayers={totalPlayers}
            onSelect={onSelectPlayer}
            cards={sessionCards}
          />
        </div>
      ))}
    </div>
  );
};

export default BoardPlayerHands;
