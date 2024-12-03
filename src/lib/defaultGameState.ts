// mockGameActions.ts

import { SessionCard, SessionPlayer, SessionState } from '@/lib/supabase'; // Adjust the import path as necessary

// Define the character cards for Coup
const characterCards: Omit<SessionCard, 'id'>[] = [
  {
    name: 'Duke',
    description: 'Take 3 coins from the treasury. Block foreign aid.',
    count: 3,
    isRevealed: false,
  },
  {
    name: 'Assassin',
    description: "Pay 3 coins to assassinate another player's character.",
    count: 3,
    isRevealed: true,
  },
  {
    name: 'Captain',
    description: 'Steal 2 coins from another player. Block stealing.',
    count: 3,
    isRevealed: true,
  },
  {
    name: 'Ambassador',
    description:
      'Draw 2 cards from the Court (deck), choose which (if any) to exchange with your face-down cards.',
    count: 3,
    isRevealed: false,
  },
  {
    name: 'Contessa',
    description: 'Block assassination attempts.',
    count: 3,
    isRevealed: true,
  },
];

// Generate the full deck with unique IDs
function generateDeck(): SessionCard[] {
  const deck: SessionCard[] = [];
  let idCounter = 1;

  characterCards.forEach((cardType) => {
    for (let i = 0; i < cardType.count; i++) {
      const card: SessionCard = {
        ...cardType,
        id: `card-${idCounter}-${Date.now()}`, // Generate a unique ID
      };
      deck.push(card);
      idCounter++;
    }
  });

  // Shuffle the deck
  return shuffle(deck);
}

// Shuffle function
function shuffle<T>(array: T[]): T[] {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Initialize session states and subscribers
const sessionStates: { [sessionId: string]: SessionState } = {};
const subscribers: {
  [sessionId: string]: Array<(state: SessionState) => void>;
} = {};

function initializeSession(sessionId: string) {
  // Generate and shuffle the deck
  const deck = generateDeck();

  // Create initial players
  const players: SessionPlayer[] = [
    {
      id: '1',
      username: 'Caleb',
      cards: [],
      score: 0,
      isActive: true,
      points: 2,
      tokens: 0,
    },
    {
      id: '2',
      username: 'Seth',
      cards: [],
      score: 0,
      isActive: true,
      points: 2,
      tokens: 0,
    },
    {
      id: '3',
      username: 'JD',
      cards: [],
      score: 0,
      isActive: true,
      points: 2,
      tokens: 0,
    },
    {
      id: '4',
      username: 'Anna',
      cards: [],
      score: 0,
      isActive: true,
      points: 2,
      tokens: 0,
    },
    {
      id: '5',
      username: 'Emily',
      cards: [],
      score: 0,
      isActive: true,
      points: 2,
      tokens: 0,
    },
    {
      id: '6',
      username: 'Chris',
      cards: [],
      score: 0,
      isActive: true,
      points: 2,
      tokens: 0,
    },
    {
      id: '7',
      username: 'Mom',
      cards: [],
      score: 0,
      isActive: true,
      points: 2,
      tokens: 0,
    },
    {
      id: '8',
      username: 'Dad',
      cards: [],
      score: 0,
      isActive: true,
      tokens: 0,
      points: 0,
    },
    // Add more mock players if needed
  ];

  // Deal 2 cards to each player
  players.forEach((player) => {
    player.cards = deck.splice(0, 2);
  });

  // Create the initial session state
  const sessionState: SessionState = {
    players,
    tokens: 50, // Number of coins in the treasury
    currentTurn: '1',
    deck: deck,
  };

  sessionStates[sessionId] = sessionState;
}

// Create a mock gameActions object
export const mockGameActions = {
  subscribeToSession(
    sessionId: string,
    onUpdate: (sessionState: SessionState) => void
  ) {
    if (!sessionStates[sessionId]) {
      initializeSession(sessionId);
    }

    // Add the subscriber
    if (!subscribers[sessionId]) {
      subscribers[sessionId] = [];
    }
    subscribers[sessionId].push(onUpdate);

    // Immediately invoke onUpdate with the current session state
    onUpdate(sessionStates[sessionId]);

    // Return an unsubscribe function
    const unsubscribe = () => {
      subscribers[sessionId] = subscribers[sessionId].filter(
        (fn) => fn !== onUpdate
      );
      console.log('Unsubscribed from mock session:', sessionId);
    };

    return { unsubscribe };
  },

  // Function to update the game state
  updateGameState(sessionId: string, newState: SessionState) {
    sessionStates[sessionId] = newState;

    // Notify all subscribers
    if (subscribers[sessionId]) {
      subscribers[sessionId].forEach((fn) => fn(newState));
    }
  },

  // Game action functions
  drawCard(sessionId: string, playerId: string) {
    const state = sessionStates[sessionId];
    if (!state) return;

    if (state.deck.length > 0) {
      const newCard = state.deck.shift()!;
      const updatedPlayers = state.players.map((player) => {
        if (player.id === playerId) {
          const updatedCards = [...player.cards, newCard];
          return { ...player, cards: updatedCards };
        } else {
          return player;
        }
      });

      const updatedState = {
        ...state,
        players: updatedPlayers,
        deck: state.deck,
      };

      this.updateGameState(sessionId, updatedState);
    } else {
      console.log('No more cards in the deck');
    }
  },

  handleReveal(sessionId: string, playerId: string, cardId: string) {
    const state = sessionStates[sessionId];
    if (!state) return;

    const updatedPlayers = state.players.map((player) => {
      if (player.id === playerId) {
        const updatedCards = player.cards.map((card) => {
          if (card.id === cardId) {
            return { ...card, isRevealed: true };
          } else {
            return card;
          }
        });
        return { ...player, cards: updatedCards };
      } else {
        return player;
      }
    });

    const updatedState = { ...state, players: updatedPlayers };
    this.updateGameState(sessionId, updatedState);
  },

  handleDiscard(sessionId: string, playerId: string, cardId: string) {
    const state = sessionStates[sessionId];
    if (!state) return;

    const updatedPlayers = state.players.map((player) => {
      if (player.id === playerId) {
        const updatedCards = player.cards.filter((card) => card.id !== cardId);
        return { ...player, cards: updatedCards };
      } else {
        return player;
      }
    });

    const updatedState = { ...state, players: updatedPlayers };
    this.updateGameState(sessionId, updatedState);
  },

  drawToken(sessionId: string, playerId: string) {
    const state = sessionStates[sessionId];
    if (!state) return;

    const updatedPlayers = state.players.map((player) => {
      if (player.id === playerId) {
        return { ...player, points: (player.points || 0) + 1 };
      } else {
        return player;
      }
    });

    const updatedState = { ...state, players: updatedPlayers };
    this.updateGameState(sessionId, updatedState);
  },

  increasePoints(sessionId: string, playerId: string) {
    const state = sessionStates[sessionId];
    if (!state) return;

    const updatedPlayers = state.players.map((player) => {
      if (player.id === playerId) {
        return { ...player, score: (player.score || 0) + 1 };
      } else {
        return player;
      }
    });

    const updatedState = { ...state, players: updatedPlayers };
    this.updateGameState(sessionId, updatedState);
  },

  decreasePoints(sessionId: string, playerId: string) {
    const state = sessionStates[sessionId];
    if (!state) return;

    const updatedPlayers = state.players.map((player) => {
      if (player.id === playerId) {
        const newScore = (player.score || 0) - 1;
        return { ...player, score: newScore >= 0 ? newScore : 0 };
      } else {
        return player;
      }
    });

    const updatedState = { ...state, players: updatedPlayers };
    this.updateGameState(sessionId, updatedState);
  },

  giveToken(sessionId: string, playerId: string) {
    const state = sessionStates[sessionId];
    if (!state) return;

    if (state.tokens <= 0) {
      console.log('No tokens available to give.');
      return;
    }

    const updatedTokens = state.tokens - 1;
    const updatedPlayers = state.players.map((player) => {
      if (player.id === playerId) {
        return { ...player, tokens: (player.tokens || 0) + 1 };
      } else {
        return player;
      }
    });

    const updatedState = {
      ...state,
      players: updatedPlayers,
      tokens: updatedTokens,
    };
    this.updateGameState(sessionId, updatedState);
  },

  removeToken(sessionId: string, playerId: string) {
    const state = sessionStates[sessionId];
    if (!state) return;

    const player = state.players.find((p) => p.id === playerId);
    if (!player || (player.tokens || 0) <= 0) {
      console.log('Player has no tokens to remove.');
      return;
    }

    const updatedTokens = state.tokens + 1;
    const updatedPlayers = state.players.map((p) => {
      if (p.id === playerId) {
        const newTokens = (p.tokens || 0) - 1;
        return { ...p, tokens: newTokens >= 0 ? newTokens : 0 };
      } else {
        return p;
      }
    });

    const updatedState = {
      ...state,
      players: updatedPlayers,
      tokens: updatedTokens,
    };
    this.updateGameState(sessionId, updatedState);
  },
};
