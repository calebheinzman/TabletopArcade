// mockGameActions.ts
import { GameTemplate, Session, SessionCard, SessionPlayer, SessionState } from '@/lib/supabase'; // Adjust the import path as necessary

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

function generateDeck(gameData: GameTemplate): SessionCard[] {
	const allCards: SessionCard[] = [];
	let cardPosition = 0;

	if (!gameData.decks) return [];
  var idx = 0;
	gameData.decks.forEach(deck => {
		if (!deck.cards) return;

		deck.cards.forEach(card => {
			// Create multiple copies based on card count
			for (let i = 0; i < card.count; i++) {
				allCards.push({
					sessionid: '',  // Will be set when initializing session
					sessionCardId: idx,
          cardid: card.cardid.toString(),
					cardPosition: cardPosition++,
					playerid: '',   // Empty means card is in deck
					deckid: deck.deckid.toString()
				});
        idx++;
			}
		});
	});

	return shuffle(allCards);
}


export function initializeSession(sessionId: string,gameData: GameTemplate) {
  // Generate and shuffle the deck
  const deck = generateDeck(gameData);
  
  // Update all cards with the sessionId
  deck.forEach(card => {
    card.sessionid = sessionId;
  });

  console.log('DECK0');
  console.log(deck);

  // Create initial players
  const players: SessionPlayer[] = [
    {
      sessionid: sessionId,
      playerid: '1',
      username: 'Caleb',
      num_points: 2,
    },
    {
      sessionid: sessionId,
      playerid: '2',
      username: 'Seth',
      num_points: 2,
    },
    {
      sessionid: sessionId,
      playerid: '3',
      username: 'JD',
      num_points: 2,
    },
    {
      sessionid: sessionId,
      playerid: '4',
      username: 'Anna',
      num_points: 2,
    },
    {
      sessionid: sessionId,
      playerid: '5',
      username: 'Emily',
      num_points: 2,
    },
    {
      sessionid: sessionId,
      playerid: '6',
      username: 'Chris',
      num_points: 2,
    },
    // Add more mock players if needed
  ];
  // Create the initial session state
  const session: Session = {
    sessionId: sessionId,
    gameId: '1',
    num_tokens: 10,
    num_players: players.length,
    num_cards:
     deck.length,
  };

  // Assign starting cards to players in round-robin fashion
  const totalStartingCards = gameData.starting_num_cards * players.length;
  deck.forEach((card, index) => {
    if (index < totalStartingCards) {
      var player = players[index % players.length]
      card.playerid = player.playerid;
      card.cardPosition = 0;
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

