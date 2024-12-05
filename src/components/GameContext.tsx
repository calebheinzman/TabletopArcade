// GameContext.tsx

'use client';
import { 
  subscribeToPlayer,
  subscribeToPlayerActions,
  subscribeToSession,
  subscribeToSessionCards,
  supabase,
  updatePlayerTokens,
  updateSessionTokens,
  getMaxCardPosition,
  updateDeckOrder,
  discardCardToDb,
  discardAndShuffleCard,
  updateCardRevealed
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
  updateSessionCards
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
  drawToken: (playerId: number) => Promise<void>;
  giveToken: (fromPlayerId: number, toUsername: string) => Promise<void>;
  discardCard: (playerId: number, sessionCardId: number) => Promise<void>;
  shuffleDeck: () => Promise<void>;
  revealCard: (playerId: number, sessionCardId: number) => Promise<void>;
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
  drawCard: async (playerId: number) => {},
  drawToken: async (playerId: number) => {},
  giveToken: async (fromPlayerId: number, toUsername: string) => {},
  discardCard: async (playerId: number, sessionCardId: number) => {},
  shuffleDeck: async () => {},
  revealCard: async (playerId: number, sessionCardId: number) => {},
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

  const drawCard = async (playerId: number) => {
    try {
      const topCard = gameContext.sessionCards.find(card => card.cardPosition === 1);

      if (!topCard) {
        console.error('No cards left in deck');
        return;
      }

      const deckCards = gameContext.sessionCards
        .filter(card => card.cardPosition > 1)
        .sort((a, b) => a.cardPosition - b.cardPosition);

      const updates = [
        {
          sessionid: gameContext.sessionid,
          sessioncardid: topCard.sessioncardid,
          cardPosition: 0,
          playerid: playerId
        },
        ...deckCards.map((card, index) => ({
          sessionid: gameContext.sessionid,
          sessioncardid: card.sessioncardid,
          cardPosition: index + 1,
          playerid: null
        }))
      ];

      await updateSessionCards(updates);
    } catch (error) {
      console.error('Error drawing card:', error);
      throw new Error('Failed to draw card');
    }
  };

  const drawToken = async (playerId: number) => {
    try {
      const currentPlayer = gameContext.sessionPlayers.find(
        player => player.playerid === playerId
      );
      
      if (!currentPlayer) {
        throw new Error('Player not found');
      }

      if (!gameContext.session.num_tokens || gameContext.session.num_tokens <= 0) {
        throw new Error('No tokens left in the session');
      }

      const newPlayerTokens = (currentPlayer.num_points || 0) + 1;
      const newSessionTokens = gameContext.session.num_tokens - 1;

      await Promise.all([
        updatePlayerTokens(gameContext.sessionid, playerId, newPlayerTokens),
        updateSessionTokens(gameContext.sessionid, newSessionTokens)
      ]);

    } catch (error) {
      console.error('Error drawing token:', error);
      throw new Error('Failed to draw token');
    }
  };

  const giveToken = async (fromPlayerId: number, toUsername: string) => {
    try {
      const fromPlayer = gameContext.sessionPlayers.find(
        player => player.playerid === fromPlayerId
      );
      
      if (!fromPlayer) {
        throw new Error('Source player not found');
      }

      if (fromPlayer.num_points <= 0) {
        throw new Error('Player has no tokens to give');
      }

      const toPlayer = gameContext.sessionPlayers.find(
        player => player.username === toUsername
      );

      if (!toPlayer) {
        throw new Error('Recipient player not found');
      }

      const newFromPlayerTokens = fromPlayer.num_points - 1;
      const newToPlayerTokens = (toPlayer.num_points || 0) + 1;

      await Promise.all([
        updatePlayerTokens(gameContext.sessionid, fromPlayerId, newFromPlayerTokens),
        updatePlayerTokens(gameContext.sessionid, toPlayer.playerid, newToPlayerTokens)
      ]);

    } catch (error) {
      console.error('Error giving token:', error);
      throw new Error('Failed to give token');
    }
  };

  const shuffleDeck = async () => {
    try {
      const deckCards = gameContext.sessionCards
        .filter(card => card.cardPosition > 0)
        .sort((a, b) => a.cardPosition - b.cardPosition);

      // Create a shuffled array of positions
      const positions = deckCards.map((_, index) => index + 1);
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }

      // Update each card with its new position
      const updatedCards = deckCards.map((card, index) => ({
        ...card,
        cardPosition: positions[index]
      }));

      await updateDeckOrder(gameContext.sessionid, updatedCards);
    } catch (error) {
      console.error('Error shuffling deck:', error);
      throw new Error('Failed to shuffle deck');
    }
  };

  const discardCard = async (playerId: number, sessionCardId: number) => {
    try {
      const updatedCards = await discardAndShuffleCard(
        gameContext.sessionid,
        sessionCardId,
        gameContext.sessionCards
      );
      console.log('Updated cards after discard and shuffle:', updatedCards);
    } catch (error) {
      console.error('Error discarding card:', error);
      throw new Error('Failed to discard card');
    }
  };

  const revealCard = async (playerId: number, sessionCardId: number) => {
    try {
      await updateCardRevealed(gameContext.sessionid, sessionCardId, true);
    } catch (error) {
      console.error('Error revealing card:', error);
      throw new Error('Failed to reveal card');
    }
  };

  const contextValue = {
    ...gameContext,
    drawCard,
    drawToken,
    giveToken,
    discardCard,
    shuffleDeck,
    revealCard,
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
