// mockGameActions.ts
import { GameContextType } from '@/components/GameContext';
import { Session, SessionCard, SessionPlayer } from '@/types/game-interfaces';

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

function generateDeck(gameContext: GameContextType): SessionCard[] {
  if (!gameContext.decks) return [];

  let cardPosition = 0;

  // Use flatMap to iterate through decks and cards, and generate copies for each card based on count
  const allCards = gameContext.decks.flatMap(
    (deck) =>
      deck.cards?.flatMap((card) =>
        Array.from({ length: card.count }, (_, idx) => ({
          sessionid: 0, // Will be set when initializing session
          sessioncardid: cardPosition + idx, // Use cardPosition to track the sessioncardid
          cardid: card.cardid,
          cardPosition: cardPosition++, // Increment position for each card
          playerid: 0, // Empty means card is in deck
          deckid: deck.deckid,
          isRevealed: false,
        }))
      ) ?? [] // In case no cards exist for a deck, return an empty array
  );

  return shuffle(allCards);
}

export function initializeSession(gameContext: GameContextType) {
  const { sessionid, sessionPlayers } = gameContext;

  // Generate and shuffle the deck
  const deck = generateDeck(gameContext);

  // Update all cards with the sessionId
  deck.forEach((card) => {
    card.sessionid = sessionid;
  });

  console.log('DECK0');
  console.log(deck);

  // Use players from sessionPlayers in game context, initialize with starting points
  const players = sessionPlayers.map((player: SessionPlayer) => ({
    ...player,
    sessionid: sessionid,
    num_points: gameContext.gameData.starting_num_points || 0, // Initialize with starting points
  }));

  // Create the initial session state
  const session: Session = {
    sessionId: sessionid,
    gameId: gameContext.gameid,
    num_points: gameContext.gameData.num_points,
    num_players: players.length,
    num_cards: deck.length,
    is_live: false,
  };

  // Assign starting cards to players in round-robin fashion
  const totalStartingCards =
    gameContext.gameData.starting_num_cards * players.length;
  deck.forEach((card, index) => {
    if (index < totalStartingCards) {
      const player = players[index % players.length];
      card.playerid = player.playerid;
      card.cardPosition = 0;
    } else {
      // Renumber remaining deck cards starting from 1
      card.cardPosition = index - totalStartingCards + 1;
      card.playerid = 0;
    }
  });

  console.log('SESSION');
  console.log(session);
  console.log('DECK');
  console.log(deck);
  console.log('PLAYERS');
  console.log(players);

  return deck; // Return the deck so we can insert it into Supabase
}
