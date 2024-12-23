// GameContext.tsx

'use client';
import {
  subscribeToPlayer,
  subscribeToPlayerActions,
  subscribeToSession,
  subscribeToSessionCards,
} from '@/lib/supabase/subscription';

import {
  fetchInitialPlayers,
  fetchPlayerActions,
  pushPlayerAction,
  updatePlayerPoints,
} from '@/lib/supabase/player';

import {
  discardAndShuffleCard,
  fetchSessionCards,
  updateCardRevealed,
  updateDeckOrder,
  updateSessionCards as updateSessionCardsSupabase,
} from '@/lib/supabase/card';

import {
  fetchDecksAndCards,
  fetchGameData,
  fetchSession,
  updateSessionPoints,
} from '@/lib/supabase/session';

import { fetchDiscardPiles } from '@/lib/supabase/discard';
import {
  CardData,
  CustomGameData,
  DeckData,
  DiscardPile,
  PlayerAction,
  Session,
  SessionCard,
  SessionPlayer,
} from '@/types/game-interfaces';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

// Types
export interface GameContextType {
  gameid: number;
  sessionid: number;
  gameData: CustomGameData;
  decks: DeckData[];
  cards: CardData[][];
  discardPiles: DiscardPile[];
  sessionCards: SessionCard[];
  playerActions: PlayerAction[];
  session: Session;
  sessionPlayers: SessionPlayer[];
  drawCard: (
    playerId: SessionCard['playerid'],
    card_hidden: SessionCard['card_hidden']
  ) => Promise<void>;
  drawPoints: (playerId: number, quantity: number) => Promise<void>;
  givePoints: (
    fromPlayerId: number,
    toUsername: string,
    quantity: number
  ) => Promise<void>;
  discardCard: (
    playerId: SessionCard['playerid'],
    sessionCardId: SessionCard['cardid'],
    pileId?: SessionCard['pile_id'],
    targetPlayerId?: SessionPlayer['playerid']
  ) => Promise<void>;
  shuffleDeck: () => Promise<void>;
  revealCard: (playerId: number, sessionCardId: number) => Promise<void>;
  passCard: (
    playerId: SessionPlayer['playerid'],
    sessionCardId: SessionCard['sessioncardid'],
    targetPlayerId: SessionPlayer['playerid']
  ) => Promise<void>;
  updateSessionCards: (
    updates: {
      sessionid: number;
      sessioncardid: number;
      cardPosition: number;
      playerid: number | null;
      pile_id?: number | null;
      isRevealed?: boolean;
    }[]
  ) => Promise<void>;
  pickupFromDiscardPile: (playerId: number, pileId: number) => Promise<void>;
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
  drawCard: async (
    playerId: SessionCard['playerid'],
    card_hidden: SessionCard['card_hidden']
  ) => {},
  drawPoints: async (playerId: number, quantity: number) => {},
  givePoints: async (
    fromPlayerId: number,
    toUsername: string,
    quantity: number
  ) => {},
  discardCard: async (
    playerId: SessionCard['playerid'],
    sessionCardId: SessionCard['cardid'],
    pileId?: SessionCard['pile_id'],
    targetPlayerId?: SessionPlayer['playerid']
  ) => {},
  shuffleDeck: async () => {},
  passCard: async (
    playerId: SessionPlayer['playerid'],
    sessionCardId: SessionCard['sessioncardid'],
    targetPlayerId: SessionPlayer['playerid']
  ) => {},
  revealCard: async (playerId: number, sessionCardId: number) => {},
  discardPiles: [],
  updateSessionCards: async (updates) => {},
  pickupFromDiscardPile: async (playerId: number, pileId: number) => {},
};

// Context
const GameContext = createContext<GameContextType | null>(null);

// Helper Functions
const handlePlayerUpdate = (
  currentPlayers: SessionPlayer[],
  payload: any
): SessionPlayer[] => {
  const updatedPlayers = [...currentPlayers];

  switch (payload.eventType) {
    case 'INSERT':
      return [...updatedPlayers, payload.new];

    case 'UPDATE':
      return updatedPlayers.map((player) =>
        player.playerid === payload.new.playerid ? payload.new : player
      );

    case 'DELETE':
      return updatedPlayers.filter(
        (player) => player.playerid !== payload.old.playerid
      );

    default:
      return currentPlayers;
  }
};

// Provider Component
export function GameProvider({
  children,
  sessionId,
}: {
  children: React.ReactNode;
  sessionId: number;
}) {
  const [gameContext, setGameContext] = useState<GameContextType>({
    ...initialGameContext,
    sessionid: sessionId,
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
        const [
          { decks, cards },
          sessionCards,
          players,
          playerActions,
          session,
        ] = await Promise.all([
          fetchDecksAndCards(gameId),
          fetchSessionCards(sessionId),
          fetchInitialPlayers(sessionId),
          fetchPlayerActions(sessionId),
          fetchSession(sessionId),
        ]);

        // Add discardPiles to the Promise.all array
        const discardPiles = await fetchDiscardPiles(gameId);

        if (!mounted) return;

        setGameContext((prev) => ({
          ...prev,
          gameid: gameId,
          gameData: gameData || ({} as CustomGameData),
          decks,
          cards,
          sessionCards,
          sessionPlayers: players,
          playerActions,
          session: session || ({} as Session),
          discardPiles,
        }));
      } catch (error) {
        console.error('Error initializing game data:', error);
      }
    };

    initializeGameData();

    // Set up all subscriptions
    const playerSubscription = subscribeToPlayer(sessionId, (payload) => {
      if (!mounted) return;
      setGameContext((prev) => ({
        ...prev,
        sessionPlayers: handlePlayerUpdate(prev.sessionPlayers, payload),
      }));
    });

    const playerActionsSubscription = subscribeToPlayerActions(
      sessionId,
      (payload) => {
        if (!mounted) return;
        setGameContext((prev) => ({
          ...prev,
          playerActions: [...prev.playerActions, payload.new as PlayerAction],
        }));
      }
    );

    const sessionSubscription = subscribeToSession(sessionId, (payload) => {
      if (!mounted) return;
      if (payload.eventType === 'UPDATE') {
        setGameContext((prev) => ({
          ...prev,
          session: payload.new as Session,
        }));
      }
    });

    const sessionCardsSubscription = subscribeToSessionCards(
      sessionId,
      (payload) => {
        if (!mounted) return;

        switch (payload.eventType) {
          case 'INSERT':
            setGameContext((prev) => ({
              ...prev,
              sessionCards: [...prev.sessionCards, payload.new as SessionCard],
            }));
            break;
          case 'UPDATE':
            setGameContext((prev) => ({
              ...prev,
              sessionCards: prev.sessionCards.map((card) =>
                card.sessioncardid === payload.new.sessioncardid
                  ? (payload.new as SessionCard)
                  : card
              ),
            }));
            break;
          case 'DELETE':
            setGameContext((prev) => ({
              ...prev,
              sessionCards: prev.sessionCards.filter(
                (card) => card.sessioncardid !== payload.old.sessioncardid
              ),
            }));
            break;
        }
      }
    );

    // Cleanup function
    return () => {
      mounted = false;
      playerSubscription.unsubscribe();
      playerActionsSubscription.unsubscribe();
      sessionSubscription.unsubscribe();
      sessionCardsSubscription.unsubscribe();
    };
  }, [sessionId]);

  const updateSessionCards: GameContextType['updateSessionCards'] = useCallback(
    async (updates) => {
      await updateSessionCardsSupabase(updates);
    },
    []
  );

  const drawCard: GameContextType['drawCard'] = useCallback(
    async (playerId: number, card_hidden: boolean = false) => {
      try {
        // Only get cards from main deck (positive cardPosition and no pile_id)
        const topCard = gameContext.sessionCards
          .filter((card) => card.cardPosition > 0 && !card.pile_id)
          .sort((a, b) => a.cardPosition - b.cardPosition)[0];

        if (!topCard) {
          console.error('No cards left in deck');
          return;
        }

        // Get remaining deck cards, excluding the top card
        const deckCards = gameContext.sessionCards
          .filter(
            (card) =>
              card.cardPosition > 1 &&
              !card.pile_id &&
              card.sessioncardid !== topCard.sessioncardid
          )
          .sort((a, b) => a.cardPosition - b.cardPosition);

        // Create updates array with unique sessioncardids
        const updates = [
          // Update for the drawn card
          {
            sessionid: gameContext.sessionid,
            sessioncardid: topCard.sessioncardid,
            cardPosition: 0,
            playerid: playerId,
            pile_id: null,
            isRevealed: false,
            card_hidden,
          },
          // Updates for remaining deck cards
          ...deckCards.map((card, index) => ({
            sessionid: gameContext.sessionid,
            sessioncardid: card.sessioncardid,
            cardPosition: index + 1,
            playerid: null,
            pile_id: null,
            isRevealed: false,
          })),
        ];
        console.log('updates', updates);
        console.log(
          'gameContext.session.hand_hidden',
          gameContext.session.hand_hidden
        );
        console.log('card_hidden', card_hidden);
        console.log('playerId', playerId);
        console.log('gameContext.sessionCards', gameContext.sessionCards);
        console.log('gameContext.sessionCards[0]', gameContext.sessionCards[0]);

        // Verify no duplicate sessioncardids
        const sessionCardIds = new Set();
        const uniqueUpdates = updates.filter((update) => {
          if (sessionCardIds.has(update.sessioncardid)) {
            return false;
          }
          sessionCardIds.add(update.sessioncardid);
          return true;
        });

        await updateSessionCards(uniqueUpdates);
      } catch (error) {
        console.error('Error drawing card:', error);
        throw new Error('Failed to draw card');
      }
    },
    [gameContext, updateSessionCards]
  );

  const drawPoints: GameContextType['drawPoints'] = useCallback(
    async (playerId, quantity) => {
      try {
        const currentPlayer = gameContext.sessionPlayers.find(
          (player) => player.playerid === playerId
        );

        if (!currentPlayer) {
          throw new Error('Player not found');
        }

        if (
          !gameContext.session.num_points ||
          gameContext.session.num_points < quantity
        ) {
          throw new Error('Not enough points left in the session');
        }

        const newPlayerPoints = (currentPlayer.num_points || 0) + quantity;
        const newSessionPoints = gameContext.session.num_points - quantity;

        await Promise.all([
          updatePlayerPoints(gameContext.sessionid, playerId, newPlayerPoints),
          updateSessionPoints(gameContext.sessionid, newSessionPoints),
        ]);
      } catch (error) {
        console.error('Error drawing points:', error);
        throw new Error('Failed to draw points');
      }
    },
    [gameContext, updatePlayerPoints, updateSessionPoints]
  );

  const givePoints: GameContextType['givePoints'] = useCallback(
    async (fromPlayerId, toUsername, quantity) => {
      try {
        const fromPlayer = gameContext.sessionPlayers.find(
          (player) => player.playerid === fromPlayerId
        );

        if (!fromPlayer) {
          throw new Error('Source player not found');
        }

        if (fromPlayer.num_points < quantity) {
          throw new Error('Player does not have enough points to give');
        }

        const newFromPlayerPoints = fromPlayer.num_points - quantity;

        if (toUsername === 'Board') {
          // Give points back to the board
          const newSessionPoints =
            (gameContext.session.num_points || 0) + quantity;
          await Promise.all([
            updatePlayerPoints(
              gameContext.sessionid,
              fromPlayerId,
              newFromPlayerPoints
            ),
            updateSessionPoints(gameContext.sessionid, newSessionPoints),
          ]);
        } else {
          // Give points to another player
          const toPlayer = gameContext.sessionPlayers.find(
            (player) => player.username === toUsername
          );

          if (!toPlayer) {
            throw new Error('Recipient player not found');
          }

          const newToPlayerPoints = (toPlayer.num_points || 0) + quantity;
          await Promise.all([
            updatePlayerPoints(
              gameContext.sessionid,
              fromPlayerId,
              newFromPlayerPoints
            ),
            updatePlayerPoints(
              gameContext.sessionid,
              toPlayer.playerid,
              newToPlayerPoints
            ),
          ]);
        }
      } catch (error) {
        console.error('Error giving points:', fromPlayerId, toUsername, error);
        throw new Error('Failed to give points');
      }
    },
    [gameContext, updatePlayerPoints, updateSessionPoints]
  );

  const shuffleDeck: GameContextType['shuffleDeck'] = useCallback(async () => {
    try {
      const deckCards = gameContext.sessionCards
        .filter((card) => card.cardPosition > 0)
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
        cardPosition: positions[index],
      }));

      await updateDeckOrder(gameContext.sessionid, updatedCards);
    } catch (error) {
      console.error('Error shuffling deck:', error);
      throw new Error('Failed to shuffle deck');
    }
  }, [gameContext, updateDeckOrder]);

  const discardCard: GameContextType['discardCard'] = useCallback(
    async (playerId, sessionCardId, pileId, targetPlayerId) => {
      try {
        if (pileId !== undefined) {
          const discardPile = gameContext.discardPiles.find(
            (p) => p.pile_id === pileId
          );
          if (!discardPile) throw new Error('Discard pile not found');

          // Get all cards currently in this pile
          const cardsInPile = gameContext.sessionCards.filter((card) => {
            if (discardPile.is_player) {
              // For player piles, match both pile_id and playerid
              return (
                card.pile_id === pileId && card.playerid === targetPlayerId
              );
            } else {
              // For board piles, just match pile_id
              return card.pile_id === pileId;
            }
          });

          // Determine the playerid value for the updates
          const newPlayerId: number | null = discardPile.is_player
            ? (targetPlayerId ?? null)
            : null;

          // Update positions of existing cards in pile
          const updates: {
            sessionid: number;
            sessioncardid: number;
            cardPosition: number;
            playerid: number | null;
            pile_id?: number | null;
            isRevealed?: boolean;
          }[] = cardsInPile.map((card) => ({
            sessionid: gameContext.sessionid,
            sessioncardid: card.sessioncardid,
            cardPosition: card.cardPosition + 1,
            playerid: newPlayerId,
            pile_id: pileId,
            isRevealed: discardPile.is_face_up,
          }));

          // Add the new card at position 1
          updates.push({
            sessionid: gameContext.sessionid,
            sessioncardid: sessionCardId,
            cardPosition: 1,
            playerid: newPlayerId,
            pile_id: pileId,
            isRevealed: discardPile.is_face_up,
          });

          await updateSessionCards(updates);
        } else {
          // Original shuffle behavior for deck
          await discardAndShuffleCard(
            gameContext.sessionid,
            sessionCardId,
            gameContext.sessionCards
          );
        }
      } catch (error) {
        console.error('Error discarding card:', error);
        throw new Error('Failed to discard card');
      }
    },
    [gameContext, updateSessionCards, discardAndShuffleCard]
  );

  const revealCard: GameContextType['revealCard'] = useCallback(
    async (playerId, sessionCardId) => {
      try {
        // Find the current card to get its revealed state
        const card = gameContext.sessionCards.find(
          (c) => c.sessioncardid === sessionCardId
        );
        if (!card) throw new Error('Card not found');

        // Toggle the revealed state
        await updateCardRevealed(
          gameContext.sessionid,
          sessionCardId,
          !card.isRevealed
        );
      } catch (error) {
        console.error('Error revealing card:', error);
        throw new Error('Failed to reveal card');
      }
    },
    [gameContext, updateCardRevealed]
  );

  const pickupFromDiscardPile: GameContextType['pickupFromDiscardPile'] =
    useCallback(
      async (playerId, pileId) => {
        try {
          // Get all cards from the specified pile for this player
          const pileCards = gameContext.sessionCards.filter(
            (card) => card.pile_id === pileId && card.playerid === playerId
          );

          // Create updates array to move cards to player's hand
          const updates = pileCards.map((card) => ({
            sessionid: gameContext.sessionid,
            sessioncardid: card.sessioncardid,
            cardPosition: 0,
            playerid: playerId,
            pile_id: null,
            isRevealed: false,
          }));

          await updateSessionCards(updates);
        } catch (error) {
          console.error('Error picking up cards from discard pile:', error);
          throw new Error('Failed to pickup cards from discard pile');
        }
      },
      [gameContext]
    );

  const passCard: GameContextType['passCard'] = useCallback(
    async (fromPlayerId, cardId, targetPlayerId) => {
      try {
        const updates = [
          {
            sessionid: gameContext.sessionid,
            sessioncardid: cardId,
            cardPosition: 0,
            playerid: targetPlayerId,
            pile_id: null,
            isRevealed: false,
          },
        ];

        await updateSessionCards(updates);
        await pushPlayerAction(
          gameContext.sessionid,
          fromPlayerId,
          `Passed a card to ${gameContext.sessionPlayers.find((p) => p.playerid === targetPlayerId)?.username}`
        );
      } catch (error) {
        console.error('Error passing card:', error);
      }
    },
    [updateSessionCards, pushPlayerAction, gameContext]
  );

  const contextValue = {
    ...gameContext,
    drawCard,
    drawPoints,
    givePoints,
    discardCard,
    shuffleDeck,
    revealCard,
    passCard,
    updateSessionCards,
    pickupFromDiscardPile,
  };

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
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
