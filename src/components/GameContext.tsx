// GameContext.tsx

'use client';

import { mockGameActions } from '@/lib/defaultGameState';
import { SessionState } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface GameContextType {
  gameState: SessionState | null;
  drawCard: (playerId: string) => void;
  handleReveal: (playerId: string, cardId: string) => void;
  handleDiscard: (playerId: string, cardId: string) => void;
  drawToken: (playerId: string) => void;
  giveToken: (playerId: string) => void;
  removeToken: (playerId: string) => void; // New Function
  increasePoints: (playerId: string) => void;
  decreasePoints: (playerId: string) => void; // New Function
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<SessionState | null>(null);
  const params = useParams();
  const sessionId = params?.sessionId as string;

  useEffect(() => {
    if (!sessionId) return;

    const { unsubscribe } = mockGameActions.subscribeToSession(
      sessionId,
      (newGameState) => {
        setGameState(newGameState);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [sessionId]);

  // Define functions that wrap the gameActions functions
  const drawCard = (playerId: string) => {
    mockGameActions.drawCard(sessionId, playerId);
  };

  const handleReveal = (playerId: string, cardId: string) => {
    mockGameActions.handleReveal(sessionId, playerId, cardId);
  };

  const handleDiscard = (playerId: string, cardId: string) => {
    mockGameActions.handleDiscard(sessionId, playerId, cardId);
  };

  const drawToken = (playerId: string) => {
    mockGameActions.drawToken(sessionId, playerId);
  };

  const giveToken = (playerId: string) => {
    mockGameActions.giveToken(sessionId, playerId);
  };

  const removeToken = (playerId: string) => {
    mockGameActions.removeToken(sessionId, playerId);
  };

  const increasePoints = (playerId: string) => {
    mockGameActions.increasePoints(sessionId, playerId);
  };

  const decreasePoints = (playerId: string) => {
    mockGameActions.decreasePoints(sessionId, playerId);
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        drawCard,
        handleReveal,
        handleDiscard,
        drawToken,
        giveToken,
        removeToken,
        increasePoints,
        decreasePoints,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
