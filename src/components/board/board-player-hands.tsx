// components/Board/BoardPlayerHands.tsx

'use client';

import { FC } from 'react';
import { useBoardContext } from '../../providers/board-provider';
import BoardPlayerHand from './board-player-hand';

const BoardPlayerHands: FC = () => {
  const { players, totalPlayers, onSelectPlayer, gameContext } =
    useBoardContext();
  const { sessionCards } = gameContext;

  return (
    <div className="absolute inset-0 m-16">
      {players.map((player) => (
        <BoardPlayerHand
          key={player.playerid}
          player={player}
          index={player.player_order ? player.player_order - 1 : 0}
          totalPlayers={totalPlayers}
          cards={sessionCards}
          onSelect={onSelectPlayer}
        />
      ))}
    </div>
  );
};

export default BoardPlayerHands;
