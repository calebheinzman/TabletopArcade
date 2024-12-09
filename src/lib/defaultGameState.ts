// mockGameActions.ts
import { GameContextType } from '@/components/GameContext';
import { Session, SessionCard, SessionPlayer, SessionState } from '@/types/game-interfaces';

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

const subscribers: {
  [sessionId: string]: Array<(state: SessionState) => void>;
} = {};

function generateDeck(gameContext: GameContextType): SessionCard[] {
	const allCards: SessionCard[] = [];
	let cardPosition = 0;

	if (!gameContext.decks) return [];
  var idx = 0;
	gameContext.decks.forEach(deck => {
		if (!deck.cards) return;

		deck.cards.forEach(card => {
			// Create multiple copies based on card count
			for (let i = 0; i < card.count; i++) {
				allCards.push({
					sessionid: 0,  // Will be set when initializing session
					sessioncardid: idx,
          cardid: card.cardid,
					cardPosition: cardPosition++,
					playerid: 0,   // Empty means card is in deck
					deckid: deck.deckid,
          isRevealed: false
				});
        idx++;
			}
		});
	});

	return shuffle(allCards);
}


export function initializeSession(gameContext: GameContextType) {
  const { sessionid, sessionPlayers } = gameContext;

  // Generate and shuffle the deck
  const deck = generateDeck(gameContext);

  // Update all cards with the sessionId
  deck.forEach(card => {
    card.sessionid = sessionid;
  });

  console.log('DECK0');
  console.log(deck);

  // Use players from sessionPlayers in game context, initialize with starting points
  const players = sessionPlayers.map((player: SessionPlayer) => ({
    ...player,
    sessionid: sessionid,
    num_points: gameContext.gameData.starting_num_points || 0  // Initialize with starting points
  }));

  // Create the initial session state
  const session: Session = {
    sessionId: sessionid,
    gameId: gameContext.gameid,
    num_points: gameContext.gameData.num_points,
    num_players: players.length,
    num_cards: deck.length,
    is_live: false
  };

  // Assign starting cards to players in round-robin fashion
  const totalStartingCards = gameContext.gameData.starting_num_cards * players.length;
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

