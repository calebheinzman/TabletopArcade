import { supabase } from './index';
import { GameContextType } from '@/components/GameContext';
import { 
  GameTemplate, 
  GameTemplateNameAndId, 
  CustomGameData, 
  DeckData, 
  CardData, 
  Player, 
  SessionCard, 
  DiscardPile 
} from '@/types/game-interfaces';
import { insertSessionCards } from './card';
import { setFirstPlayerTurn } from './player';
import { initializeSession } from '../defaultGameState';
import { updateSessionCards } from './card';

export async function createCustomGame(
  gameData: CustomGameData,
  decks: DeckData[],
  cards: CardData[][],
  discardPiles: DiscardPile[]
) {
  try {
    const { data: gameDataResult, error: gameError } = await supabase
      .from('game')
      .insert(gameData)
      .select('gameid')
      .single();

    if (gameError) throw gameError;

    const gameId = gameDataResult.gameid;

    // Insert discard piles first to get their IDs
    let discardPileIds: number[] = [];
    if (discardPiles && discardPiles.length > 0) {
      const discardPilesWithGameId = discardPiles.map(({ pile_id, ...pile }) => ({
        ...pile,
        game_id: gameId
      }));

      const { data: discardPileData, error: discardPileError } = await supabase
        .from('discard_pile')
        .insert(discardPilesWithGameId)
        .select('pile_id');

      if (discardPileError) throw discardPileError;
      
      discardPileIds = discardPileData.map(pile => pile.pile_id);
    }

    for (const deck of decks) {
      const { data: deckDataResult, error: deckError } = await supabase
        .from('deck')
        .insert({ 
          gameid: gameId, 
          deckname: deck.deckname,
          num_cards: 0
        })
        .select('deckid, deckname')
        .single();

      if (deckError) throw deckError;

      const deckName = deckDataResult.deckname;
      const deckId = deckDataResult.deckid;
      
      // Check if there are cards for this specific deck
      const deckCards = cards.find((cardSet) => cardSet && cardSet.length > 0 && cardSet[0]?.deckName === deckName);
      if (deckCards && deckCards.length > 0) {
        const { error: cardError } = await supabase.from('card').insert(
          deckCards.map(({ deckName, ...card }) => ({
            ...card,
            deckid: deckId,
            drop_order: card.drop_order || 0,
          }))
        );

        if (cardError) throw cardError;
      }
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from('session')
      .select('*')
      .eq('gameid', gameId);

    if (sessionError) throw sessionError;

    const { data: playerData, error: playerError } = await supabase
      .from('player')
      .select('*')
      .in('sessionid', sessionData.map(session => session.sessionid));

    if (playerError) throw playerError;

    const { data: playerActionsData, error: playerActionsError } = await supabase
      .from('player_actions')
      .select('*')
      .in('sessionid', sessionData.map(session => session.sessionid));

    if (playerActionsError) throw playerActionsError;

    const { data: sessionCardsData, error: sessionCardsError } = await supabase
      .from('session_cards')
      .select('*, pile_id')
      .in('sessionid', sessionData.map(session => session.sessionid));

    if (sessionCardsError) throw sessionCardsError;

    const gameState = {
      gameId,
      sessions: sessionData,
      players: playerData,
      playerActions: playerActionsData,
      sessionCards: sessionCardsData,
    };

    return { success: true, gameId, gameState };
  } catch (error) {
    console.error('Error creating custom game:', error);
    return { success: false, error: 'Failed to create custom game' };
  }
}

export const fetchGameTemplate = async (gameId: number) => {
  try {
    // Fetch game template
    const { data: gameData, error: gameError } = await supabase
      .from('game')
      .select(`
        *,
        decks:deck(*,
          cards:card(*)
        ),
        discard_piles:discard_pile(*)
      `)
      .eq('gameid', gameId)
      .single();

    if (gameError) throw gameError;
    return gameData;

  } catch (error) {
    console.error('Error fetching game template:', error);
    return null;
  }
};

export async function createSessionFromGameTemplateId(templateId: GameTemplate['id']) {
    try {
      const gameData = await fetchGameTemplate(templateId);

      if (!gameData) throw new Error('Failed to fetch game template data.');
      
      const sessionData = {
        gameid: gameData.gameid,
        num_points: gameData.num_points,
        num_players: 0,
        num_cards: gameData.decks[0].cards.length,
        is_live: false,
        locked_player_discard: false
      };

      const { data: sessionResult, error: sessionError } = await supabase
        .from('session')
        .insert(sessionData)
        .select('sessionid')
        .single();

      if (sessionError) throw sessionError;

      return { error: null, sessionId: sessionResult.sessionid };
    } catch (error) {
      console.error('Error creating session from game:', error);
      return { sessionId: null, error: 'Failed to create session from game' };
    }
}

export async function createSession(sessionId: number, sessionCards: SessionCard[]) {
  await insertSessionCards(sessionId, sessionCards);
}

export async function fetchGameNames(): Promise<GameTemplateNameAndId[] | []> {
    try {
      const { data, error } = await supabase
        .from('game')
        .select('name, gameid, tags');

      if (error) throw error;

      return data.map((game) => ({ ...game, id: game.gameid }));
    } catch (error) {
      console.error('Error fetching game names:', error);
      return [];
    }
}

export async function fetchGameSession(sessionId: string) {
    const { data, error } = await supabase
      .from('session')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching game state:', error);
    }

    return data;
}

export async function fetchGameData(sessionId: number) {
  const { data: sessionData, error: sessionError } = await supabase
    .from('session')
    .select('*, game(*)')
    .eq('sessionid', sessionId)
    .single();

  if (sessionError) {
    console.error('Error fetching game data:', sessionError);
    return { gameData: null, gameId: null };
  }

  return { 
    gameData: sessionData.game as CustomGameData, 
    gameId: sessionData.gameid 
  };
}

export async function fetchDecksAndCards(gameId: number) {
  const { data: decksData, error: decksError } = await supabase
    .from('deck')
    .select(`
      *,
      cards:card(*)
    `)
    .eq('gameid', gameId);

  if (decksError) {
    console.error('Error fetching decks and cards:', decksError);
    return { decks: [], cards: [] };
  }

  const decks = decksData as DeckData[];
  const cards = decks.map(deck => deck.cards as CardData[]);

  return { decks, cards };
}

export async function fetchSession(sessionId: number) {
  const { data, error } = await supabase
    .from('session')
    .select('*')
    .eq('sessionid', sessionId)
    .single();

  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }

  return data;
}

export async function updateSessionPoints(sessionId: number, newPointCount: number) {
  const { error } = await supabase
    .from('session')
    .update({ num_points: newPointCount })
    .match({ sessionid: sessionId });

  if (error) throw error;
}

export async function resetGame(gameContext: GameContextType, generateNewDeck: () => SessionCard[]): Promise<void> {
  try {
    const existingCards = [...gameContext.sessionCards];

    // Sort cards by drop_order if deal_all_cards is true
    if (gameContext.gameData.deal_all_cards) {
      existingCards.sort((a, b) => {
        const cardA = gameContext.cards.flat().find(c => c.cardid === a.cardid);
        const cardB = gameContext.cards.flat().find(c => c.cardid === b.cardid);
        return (cardB?.drop_order || 0) - (cardA?.drop_order || 0);
      });
    }

    // Shuffle the array of existing cards
    for (let i = existingCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [existingCards[i], existingCards[j]] = [existingCards[j], existingCards[i]];
    }

    const cardUpdates: {
      sessionid: number;
      sessioncardid: number;
      cardPosition: number;
      playerid: number | null;
      pile_id: null;
      isRevealed: boolean;
    }[] = [];

    let currentCardIndex = 0;

    if (gameContext.gameData.deal_all_cards) {
      // Calculate cards per player (rounded down)
      const cardsPerPlayer = Math.floor(existingCards.length / gameContext.sessionPlayers.length);
      
      // Deal cards to each player
      for (const player of gameContext.sessionPlayers) {
        for (let i = 0; i < cardsPerPlayer; i++) {
          if (currentCardIndex < existingCards.length) {
            cardUpdates.push({
              sessionid: gameContext.sessionid,
              sessioncardid: existingCards[currentCardIndex].sessioncardid,
              cardPosition: 0,
              playerid: player.playerid,
              pile_id: null,
              isRevealed: false
            });
            currentCardIndex++;
          }
        }
      }
    } else if (gameContext.gameData.starting_num_cards > 0) {
      // Original logic for dealing specific number of cards
      for (const player of gameContext.sessionPlayers) {
        for (let i = 0; i < gameContext.gameData.starting_num_cards; i++) {
          if (currentCardIndex < existingCards.length) {
            cardUpdates.push({
              sessionid: gameContext.sessionid,
              sessioncardid: existingCards[currentCardIndex].sessioncardid,
              cardPosition: 0,
              playerid: player.playerid,
              pile_id: null,
              isRevealed: false
            });
            currentCardIndex++;
          }
        }
      }
    }

    // Update remaining cards as deck cards
    for (let i = currentCardIndex; i < existingCards.length; i++) {
      cardUpdates.push({
        sessionid: gameContext.sessionid,
        sessioncardid: existingCards[i].sessioncardid,
        cardPosition: i - currentCardIndex + 1,
        playerid: null,
        pile_id: null,
        isRevealed: false
      });
    }

    // Reset session points and hand visibility settings
    const { error: sessionError } = await supabase
      .from('session')
      .update({ 
        num_points: gameContext.gameData.num_points,
        hand_hidden: false,           // Reset hand visibility
        locked_player_discard: false  // Reset locked player discard
      })
      .eq('sessionid', gameContext.sessionid);

    if (sessionError) throw sessionError;

    // Reset player points, turns, and card reveal status
    const finalCardUpdates = cardUpdates.map(update => ({
      ...update,
      isRevealed: false,  // Ensure all cards are hidden when game resets
      card_hidden: false  // Reset card hidden state to default
    }));

    // Update all cards in a single operation
    await updateSessionCards(finalCardUpdates);

    // Reset player points and turns - modified to handle claim_turn
    const { error: playerError } = await supabase
      .from('player')
      .update({ 
        num_points: gameContext.gameData.starting_num_points || 0,
        is_turn: gameContext.gameData.claim_turns ? false : false // All players start with is_turn false if claim_turn is true
      })
      .eq('sessionid', gameContext.sessionid);

    if (playerError) throw playerError;

    // Only set first player turn if claim_turn is false
    if (!gameContext.gameData.claim_turns) {
      await setFirstPlayerTurn(gameContext.sessionid);
    }

  } catch (error) {
    console.error('Error resetting game:', error);
    throw error;
  }
}
