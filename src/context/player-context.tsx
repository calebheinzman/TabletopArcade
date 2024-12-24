'use client';

import { GameContextType, useGame } from '@/context/game-context';
import { SessionPlayer } from '@/types/game-interfaces';
import React, { createContext, ReactNode, useContext, useMemo } from 'react';

interface PlayerContextProps {
  player: SessionPlayer | null;
  gameContext: GameContextType;
}

const PlayerContext = createContext<PlayerContextProps | undefined>(undefined);

export const usePlayer = (): PlayerContextProps => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

interface PlayerProviderProps {
  player: SessionPlayer;
  children: ReactNode;
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({
  player,
  children,
}) => {
  const gameContext = useGame();
  const currentPlayer = useMemo(
    () =>
      gameContext.sessionPlayers.find(
        (sessionPlayer: SessionPlayer) =>
          sessionPlayer.playerid === player.playerid
      ) ?? player,
    [player, gameContext]
  );

  console.log('CURRENT PLAYER IN CONTEXT', currentPlayer);
  return (
    <PlayerContext.Provider value={{ player: currentPlayer, gameContext }}>
      {children}
    </PlayerContext.Provider>
  );
};
