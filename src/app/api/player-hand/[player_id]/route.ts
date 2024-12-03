// mockGameActions.ts

import { SessionCard, SessionPlayer, SessionState } from '@/lib/supabase'; // Adjust the import path as necessary

// Define some mock cards based on your SessionCard interface
const mockCardsWithCounts: SessionCard[] = [
  {
    id: '1',
    name: 'Duke',
    description: 'Take 3 coins from the treasury. Block foreign aid.',
    count: 3, // There are 3 Dukes in the deck
    isRevealed: false,
  },
  {
    id: '2',
    name: 'Assassin',
    description: "Pay 3 coins to assassinate another player's character.",
    count: 3, // 3 Assassins
    isRevealed: false,
  },
  {
    id: '3',
    name: 'Captain',
    description: 'Steal 2 coins from another player. Block stealing.',
    count: 3, // 3 Captains
    isRevealed: false,
  },
  {
    id: '4',
    name: 'Ambassador',
    description:
      'Draw 2 cards from the Court (deck), choose which (if any) to exchange with your face-down cards.',
    count: 3, // 3 Ambassadors
    isRevealed: false,
  },
  {
    id: '5',
    name: 'Contessa',
    description: 'Block assassination attempts.',
    count: 3, // 3 Contessas
    isRevealed: false,
  },
];

// Function to generate the full deck based on counts
function generateFullDeck(): SessionCard[] {
  const fullDeck: SessionCard[] = [];
  mockCardsWithCounts.forEach((cardTemplate) => {
    for (let i = 0; i < cardTemplate.count; i++) {
      const card: SessionCard = { ...cardTemplate };
      // Assign unique IDs if necessary
      card.id = `${cardTemplate.id}-${i + 1}`; // e.g., '1-1', '1-2', '1-3' for Dukes
      fullDeck.push(card);
    }
  });
  return fullDeck;
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

// Generate and shuffle the deck
const fullDeck: SessionCard[] = generateFullDeck();
const shuffledDeck: SessionCard[] = shuffle(fullDeck);

// Define the players
const players: SessionPlayer[] = [
  {
    id: '1',
    username: 'Alice',
    cards: [], // Will assign cards later
    score: 0,
    isActive: true,
  },
  {
    id: '2',
    username: 'Bob',
    cards: [],
    score: 0,
    isActive: true,
  },
  // Add more players if needed
];

// Deal 2 cards to each player
players.forEach((player) => {
  player.cards = shuffledDeck.splice(0, 2);
});

// Define default session state for testing
export const defaultSessionState: SessionState = {
  players: players,
  tokens: 50,
  currentTurn: '1',
  deck: shuffledDeck, // Remaining cards in the deck
};

// Create a mock gameActions object
export const mockGameActions = {
  subscribeToSession(
    sessionId: string,
    onUpdate: (sessionState: SessionState) => void
  ) {
    // Immediately invoke onUpdate with the default session state
    onUpdate(defaultSessionState);

    // Simulate real-time updates using setInterval
    const interval = setInterval(() => {
      // Simulate drawing or discarding cards
      const newSessionState: SessionState = {
        ...defaultSessionState,
        tokens: defaultSessionState.tokens - Math.floor(Math.random() * 2), // Random token usage
        currentTurn:
          defaultSessionState.players[
            Math.floor(Math.random() * defaultSessionState.players.length)
          ].id,
        players: defaultSessionState.players.map((player) => {
          // Randomly decide whether to draw or discard a card
          const action = Math.random() > 0.5 ? 'draw' : 'discard';
          const updatedCards = [...player.cards];

          if (action === 'draw' && defaultSessionState.deck.length > 0) {
            // Draw a new card from the deck
            const newCard = defaultSessionState.deck.shift();
            if (newCard) {
              updatedCards.push(newCard);
            }
          } else if (action === 'discard' && updatedCards.length > 0) {
            // Discard a random card
            const discardIndex = Math.floor(
              Math.random() * updatedCards.length
            );
            updatedCards.splice(discardIndex, 1);
            // Optionally, add the discarded card back to the deck or a discard pile
          }

          return {
            ...player,
            cards: updatedCards,
          };
        }),
        deck: defaultSessionState.deck, // Update deck after drawing
      };

      // Invoke the onUpdate callback with the new session state
      onUpdate(newSessionState);
    }, 5000); // Update every 5 seconds

    // Return an unsubscribe function to clear the interval
    const unsubscribe = () => {
      clearInterval(interval);
      console.log('Unsubscribed from mock session:', sessionId);
    };

    return { unsubscribe };
  },

  // You can add other mock functions if needed
};
