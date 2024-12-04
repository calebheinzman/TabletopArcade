// GameContext.tsx

'use client';
import { 
  subscribeToPlayer,
  subscribeToPlayerActions,
  subscribeToSession,
  subscribeToSessionCards,
  supabase 
} from '@/lib/supabase';
import { 
  CustomGameData, 
  DeckData, 
  CardData, 
  SessionCard, 
  PlayerAction, 
  Session, 
  SessionPlayer 
} from '@/lib/supabase';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  fetchInitialPlayers,
  fetchGameData,
  fetchDecksAndCards,
  fetchSessionCards,
  fetchPlayerActions,
  fetchSession,
  drawCardFromDeck,
} from '@/lib/supabase';

// Types
export interface GameContextType {
  gameid: number;
  sessionid: number;
  gameData: CustomGameData;
  decks: DeckData[];
  cards: CardData[][];
  sessionCards: SessionCard[];
  playerActions: PlayerAction[];
  session: Session;
  sessionPlayers: SessionPlayer[];
  drawCard: (playerId: number) => Promise<void>;
}

const initialGameContext: GameContextType = {
  gameid: 0,
  sessionid: 0,
  gameData: {} as CustomGameData,
  decks: [],
  cards: [],
  sessionCards: [],
  playerActions: [],
  session: {} as Session,
  sessionPlayers: [],
  drawCard: async (playerId: number) => {}
};

// Context
const GameContext = createContext<GameContextType | null>(null);

// Helper Functions
const handlePlayerUpdate = (
  currentPlayers: SessionPlayer[],
  payload: any
): SessionPlayer[] => {
  let updatedPlayers = [...currentPlayers];
  
  switch (payload.eventType) {
    case 'INSERT':
      return [...updatedPlayers, payload.new];
      
    case 'UPDATE':
      return updatedPlayers.map(player =>
        player.playerid === payload.new.playerid ? payload.new : player
      );
      
    case 'DELETE':
      return updatedPlayers.filter(player =>
        player.playerid !== payload.old.playerid
      );
      
    default:
      return currentPlayers;
  }
};

// Provider Component
export function GameProvider({ 
  children, 
  sessionId 
}: { 
  children: React.ReactNode;
  sessionId: number;
}) {
  const [gameContext, setGameContext] = useState<GameContextType>({
    ...initialGameContext,
    sessionid: sessionId
  });

  useEffect(() => {
    if (!sessionId) return;

    let mounted = true;

    const initializeGameData = async () => {
      try {
        // Fetch game data and extract gameId
        const { gameData, gameId } = await fetchGameData(sessionId);

        if (!mounted || !gameId) return;

        // Fetch other data using the gameId
        const [{ decks, cards }, sessionCards, players, playerActions, session] = await Promise.all([
          fetchDecksAndCards(gameId),
          fetchSessionCards(sessionId),
          fetchInitialPlayers(sessionId),
          fetchPlayerActions(sessionId),
          fetchSession(sessionId)
        ]);

        if (!mounted) return;

        setGameContext(prev => ({
          ...prev,
          gameid: gameId,
          gameData: gameData || {} as CustomGameData,
          decks,
          cards,
          sessionCards,
          sessionPlayers: players,
          playerActions,
          session: session || {} as Session
        }));
      } catch (error) {
        console.error('Error initializing game data:', error);
      }
    };

    initializeGameData();

    // Set up all subscriptions
    const playerSubscription = subscribeToPlayer(sessionId, (payload) => {
      if (!mounted) return;
      setGameContext(prev => ({
        ...prev,
        sessionPlayers: handlePlayerUpdate(prev.sessionPlayers, payload)
      }));
    });

    const playerActionsSubscription = subscribeToPlayerActions(sessionId, (payload) => {
      if (!mounted) return;
      setGameContext(prev => ({
        ...prev,
        playerActions: [...prev.playerActions, payload.new as PlayerAction]
      }));
    });

    const sessionSubscription = subscribeToSession(sessionId, (payload) => {
      if (!mounted) return;
      if (payload.eventType === 'UPDATE') {
        setGameContext(prev => ({
          ...prev,
          session: payload.new as Session
        }));
      }
    });

    const sessionCardsSubscription = subscribeToSessionCards(sessionId, (payload) => {
      if (!mounted) return;
      
      switch (payload.eventType) {
        case 'INSERT':
          setGameContext(prev => ({
            ...prev,
            sessionCards: [...prev.sessionCards, payload.new as SessionCard]
          }));
          break;
        case 'UPDATE':
          setGameContext(prev => ({
            ...prev,
            sessionCards: prev.sessionCards.map(card => 
              card.sessioncardid === payload.new.sessioncardid 
                ? payload.new as SessionCard 
                : card
            )
          }));
          break;
        case 'DELETE':
          setGameContext(prev => ({
            ...prev,
            sessionCards: prev.sessionCards.filter(card => 
              card.sessioncardid !== payload.old.sessioncardid
            )
          }));
          break;
      }
    });

    // Cleanup function
    return () => {
      mounted = false;
      playerSubscription.unsubscribe();
      playerActionsSubscription.unsubscribe();
      sessionSubscription.unsubscribe();
      sessionCardsSubscription.unsubscribe();
    };
  }, [sessionId]);
  console.log('gameContext', gameContext);

  const contextValue = {
    ...gameContext,
    drawCard: (playerId: number) => drawCardFromDeck(gameContext, playerId)
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

// Hook
export function useGame(): GameContextType {
  const context = useContext(GameContext);
  
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  
  return context;
}
