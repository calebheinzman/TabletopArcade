import { defaultSessionState } from '@/app/api/player-hand/[player_id]/route';
import { createClient, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { initializeSession } from './defaultGameState';
import { GameContextType } from '@/components/GameContext';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface GameTemplate {
  id: number;
  name: string;
  decks: DeckData[];
  starting_num_cards: number;
}

export interface GameTemplateNameAndId {
  id: GameTemplate['id'];
  name: GameTemplate['name'];
}

export interface CustomGameData {
  name: string;
  num_points: number;
  num_dice: number;
  num_players: number;
  starting_num_cards: number;
  starting_num_points: number;
  can_discard: boolean;
  can_reveal: boolean;
  can_give_points: boolean;
  can_give_cards: boolean;
  can_draw_cards: boolean;
  can_draw_points: boolean;
  face_up_board_discard_piles_row: number | null;
  face_up_board_discard_piles_columbs: number | null;
  face_down_board_discard_piles_row: number | null;
  face_down_board_discard_piles_columbs: number | null;
  face_up_player_discard_piles_row: number | null;
  face_up_player_discard_piles_columbs: number | null;
  face_down_player_discard_piles_row: number | null;
  face_down_player_discard_piles_columbs: number | null;
  is_turn_based: boolean;
  lock_turn: boolean;
  max_cards_per_player: number;
  game_rules: string;
}

export interface DeckData {
  gameid: number;
  deckid: number;
  deckname: string;
  num_cards: number;
  cards: CardData[];
}

export interface CardData {
  deckid: number;
  cardid: number;
  name: string;
  count: number;
  description: string;
  deckName: string;
  front_image_url: string;
  back_image_url: string;
}

export interface Player {
  sessionid: number;
  playerid: number;
  username: string;
  num_points: number;
  is_turn: boolean;
  player_order: number;
  time_last_action: string; // This will store ISO timestamp
}

export interface SessionState {
  sessionid: number;
  gameid: number;
  num_points: number;
  num_players: number;
  num_cards: number;
  players: Player[];
  deck: SessionCard[];
  currentTurn: string;
}

export interface Session {
  gameId: number;
  sessionId: number;
  num_points: number;
  num_players: number;
  num_cards: number;
  is_live: boolean;
}

export interface SessionCard {
  sessionid: number;
  sessioncardid: number;
  cardid: number;
  cardPosition: number;
  playerid: number;
  deckid: number;
  isRevealed: boolean;
}

export interface SessionPlayer {
  sessionid: string;
  playerid: number;
  username: string;
  num_points: number;
  player_order: number;
  is_turn: boolean;
  time_last_action: string; 
}

export interface PlayerAction {
  playerid: number;
  sessionid: number;
  description: string;
  action_id: number;
}

export async function insertSessionCards(sessionId: number, sessionCards: SessionCard[]) {
  try {
    const { error: cardsError } = await supabase
      .from('session_cards')
      .insert(
        sessionCards.map(card => ({
          sessionid: card.sessionid,
          cardid: card.cardid,
          cardPosition: card.cardPosition,
          playerid: card.playerid ? card.playerid: null,
          deckid: card.deckid,
          isRevealed: card.isRevealed
        }))
      );

    if (cardsError) throw cardsError;
  } catch (error) {
    console.error('Error inserting session cards:', error);
    throw new Error('Failed to insert session cards');
  }
}

export async function createCustomGame(
  gameData: CustomGameData,
  decks: DeckData[],
  cards: CardData[][],
  players: Player[]
) {
  try {
    const { data: gameDataResult, error: gameError } = await supabase
      .from('game')
      .insert(gameData)
      .select('gameid')
      .single();

    if (gameError) throw gameError;

    const gameId = gameDataResult.gameid;

    for (const deck of decks) {
      const { data: deckDataResult, error: deckError } = await supabase
        .from('deck')
        .insert({ ...deck, gameid: gameId, num_cards: 0 })
        .select('deckid, deckname')
        .single();

      if (deckError) throw deckError;

      const deckName = deckDataResult.deckname;
      const deckId = deckDataResult.deckid;
      if (cards.length > 0) {
        const deckCards = cards.find((c) => c[0].deckName === deckName);
        if (deckCards) {
          const { error: cardError } = await supabase.from('card').insert(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            deckCards.map(({ deckName, ...card }) => ({
              ...card,
              deckid: deckId,
            }))
          );

          if (cardError) throw cardError;
        }
      }
    }

    // Fetch and store session data
    const { data: sessionData, error: sessionError } = await supabase
      .from('session')
      .select('*')
      .eq('gameid', gameId);

    if (sessionError) throw sessionError;

    // Fetch and store player data
    const { data: playerData, error: playerError } = await supabase
      .from('player')
      .select('*')
      .in('sessionid', sessionData.map(session => session.sessionid));

    if (playerError) throw playerError;

    // Fetch and store player actions data
    const { data: playerActionsData, error: playerActionsError } = await supabase
      .from('player_actions')
      .select('*')
      .in('sessionid', sessionData.map(session => session.sessionid));

    if (playerActionsError) throw playerActionsError;

    // Fetch and store session cards data
    const { data: sessionCardsData, error: sessionCardsError } = await supabase
      .from('session_cards')
      .select('*')
      .in('sessionid', sessionData.map(session => session.sessionid));

    if (sessionCardsError) throw sessionCardsError;

    // Store the fetched data as needed
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

export async function fetchGameTemplate(templateId: GameTemplate['id']) {
    try {
      // Fetch the game data based on the templateId
      const { data: gameData, error: gameError } = await supabase
        .from('game')
        .select(
          `
          *,
          decks:deck(
            *,
            cards:card(*)
          )
        `
        )
        .eq('gameid', templateId)
        .single();

      if (gameError) throw gameError;

      return gameData;
    } catch (error) {
      console.error('Error fetching game template:', error);
      return null;
    }
}

export async function createSessionFromGameTemplateId(templateId: GameTemplate['id']) {
    try {
      const gameData = await fetchGameTemplate(templateId);

      if (!gameData) throw new Error('Failed to fetch game template data.');
      
      const sessionData = {
        gameid: gameData.gameid,
        num_points: gameData.num_points,
        num_players: 0,
        num_cards: gameData.decks[0].cards.length,
        is_live: false
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

export async function createSession(gameContext: GameContextType) {
  // Initialize session and get the deck
  const sessionCards = initializeSession(gameContext);
  // Insert the session cards into the database using the new function
  await insertSessionCards(gameContext.sessionid, sessionCards);
}


export async function fetchGameNames(): Promise<GameTemplateNameAndId[] | []> {
    try {
      const { data, error } = await supabase
        .from('game')
        .select('name, gameid');

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

export async function addPlayer(sessionId: number, username: string): Promise<{ playerId: number | null, error: string | null }> {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('session')
        .select(`
          *,
          game(*),
          player!player_sessionid_fkey(*)
        `)
        .eq('sessionid', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Check if game is already in progress
      if (sessionData.is_live) {
        return { playerId: null, error: 'Game is already in progress' };
      }

      // Check if game is full
      const currentPlayerCount = sessionData.player?.length || 0;
      if (currentPlayerCount >= sessionData.game.num_players) {
        return { playerId: null, error: 'Game is full' };
      }

      const playerOrder = currentPlayerCount + 1;

      const { data: playerData, error: playerError } = await supabase
        .from('player')
        .insert({
          sessionid: sessionId,
          username: username,
          num_points: sessionData.game.starting_num_points || 0,
          player_order: playerOrder,
          is_turn: false,
          time_last_action: new Date().toISOString()
        })
        .select('playerid')
        .single();

      if (playerError) throw playerError;

      return { playerId: playerData.playerid, error: null };
    } catch (error) {
      console.error('Error adding player:', error);
      return { playerId: null, error: 'Failed to add player' };
    }
}

export async function setFirstPlayerTurn(sessionId: number): Promise<void> {
    try {
        // Update all players to is_turn = false first
        await supabase
            .from('player')
            .update({ is_turn: false })
            .eq('sessionid', sessionId);

        // Set is_turn = true for player with player_order = 1
        const { error } = await supabase
            .from('player')
            .update({ is_turn: true })
            .match({ sessionid: sessionId, player_order: 1 });

        if (error) throw error;
    } catch (error) {
        console.error('Error setting first player turn:', error);
        throw error;
    }
}

export function subscribeToPlayerActions(sessionId: number, callback: (payload: RealtimePostgresChangesPayload<any>) => void) {
  const subscription = supabase
    .channel(`public:player_actions:sessionid=${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'player_actions',
        filter: `sessionid=eq.${sessionId}`,
      },
      (payload) => {
        console.log('Change received in player_actions:', payload);
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
}

export function subscribeToSession(sessionId: number, callback: (payload: RealtimePostgresChangesPayload<any>) => void) {
  const subscription = supabase
    .channel(`public:session:sessionid=${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'session',
        filter: `sessionid=eq.${sessionId}`,
      },
      (payload) => {
        console.log('Change received in session:', payload);
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
}

export function subscribeToSessionCards(sessionId: number, callback: (payload: RealtimePostgresChangesPayload<any>) => void) {
  const subscription = supabase
    .channel(`public:session_cards:sessionid=${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'session_cards',
        filter: `sessionid=eq.${sessionId}`,
      },
      (payload) => {
        console.log('Change received in session_cards:', payload);
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
}

export function subscribeToPlayer(
  sessionId: number,
  callback: (payload: RealtimePostgresChangesPayload<SessionPlayer>) => void
) {
  console.log('Setting up player subscription for sessionId:', sessionId);
  
  const channel = supabase.channel('player_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'player',
        filter: `sessionid=eq.${sessionId}`,
      },
      (payload) => {
        console.log('Player change detected:', payload);
        callback(payload as RealtimePostgresChangesPayload<SessionPlayer>);
      }
    )
    .subscribe((status, err) => {
      console.log('Player subscription status:', status);
      if (err) {
        console.error('Subscription error:', err);
      }
    });

  return {
    unsubscribe: () => {
      console.log('Unsubscribing from player changes');
      channel.unsubscribe();
    }
  };
}

export async function fetchInitialPlayers(sessionId: number): Promise<SessionPlayer[]> {
  const { data: playersData, error: playersError } = await supabase
    .from('player')
    .select('*')
    .eq('sessionid', sessionId);
    
  if (playersError) {
    console.error('Error fetching players:', playersError);
    return [];
  }
  
  return playersData || [];
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

export async function fetchSessionCards(sessionId: number) {
  const { data: sessionCards, error: cardsError } = await supabase
    .from('session_cards')
    .select('*')
    .eq('sessionid', sessionId);

  if (cardsError) {
    console.error('Error fetching session cards:', cardsError);
    return [];
  }

  return sessionCards as SessionCard[];
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
};


export async function fetchPlayerActions(sessionId: number): Promise<PlayerAction[]> {
  const { data, error } = await supabase
    .from('player_actions')
    .select('*')
    .eq('sessionid', sessionId);

  if (error) {
    console.error('Error fetching player actions:', error);
    return [];
  }

  return data || [];
}

export async function updateSessionCards(updates: {
  sessionid: number;
  sessioncardid: number;
  cardPosition: number;
  playerid: number | null;
}[]) {
  const { error } = await supabase
    .from('session_cards')
    .upsert(updates, { 
      onConflict: 'sessionid,sessioncardid'
    });

  if (error) throw error;
}

export async function updatePlayerPoints(sessionId: number, playerId: number, newPointCount: number) {
  const { error } = await supabase
    .from('player')
    .update({ num_points: newPointCount })
    .match({ sessionid: sessionId, playerid: playerId });

  if (error) throw error;
}

export async function updateSessionPoints(sessionId: number, newPointCount: number) {
  const { error } = await supabase
    .from('session')
    .update({ num_points: newPointCount })
    .match({ sessionid: sessionId });

  if (error) throw error;
}

export async function getMaxCardPosition(sessionId: number): Promise<number> {
  const { data, error } = await supabase
    .from('session_cards')
    .select('cardPosition')
    .eq('sessionid', sessionId)
    .order('cardPosition', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error getting max card position:', error);
    return 0;
  }

  return data?.cardPosition || 0;
}

export async function discardCardToDb(
  sessionId: number, 
  sessionCardId: number, 
  newPosition: number
): Promise<SessionCard[]> {
  const { data, error } = await supabase
    .from('session_cards')
    .update({ 
      playerid: null,
      cardPosition: newPosition 
    })
    .match({ 
      sessionid: sessionId,
      sessioncardid: sessionCardId 
    })
    .select();

  if (error) throw error;
  return data || [];
}

export async function updateDeckOrder(
  sessionId: number, 
  sessionCards: SessionCard[]
): Promise<SessionCard[]> {
  const deckCards = sessionCards
    .filter(card => card.cardPosition > 0)
    .sort((a, b) => a.cardPosition - b.cardPosition);

  // Create a shuffled array of positions
  const positions = deckCards.map((_, index) => index + 1);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Create updates with new positions
  const updates = deckCards.map((card, index) => ({
    sessionid: sessionId,
    sessioncardid: card.sessioncardid,
    cardPosition: positions[index],
    playerid: null
  }));

  const { data, error } = await supabase
    .from('session_cards')
    .upsert(updates, { onConflict: 'sessionid,sessioncardid' })
    .select();

  if (error) throw error;
  return data || [];
}

export async function discardAndShuffleCard(
  sessionId: number,
  sessionCardId: number,
  sessionCards: SessionCard[]
): Promise<SessionCard[]> {
  try {
    // Get max position and add discarded card to end
    const maxPosition = Math.max(...sessionCards.map(card => card.cardPosition));
    const discardedCards = await discardCardToDb(sessionId, sessionCardId, maxPosition + 1);
    
    // Get updated session cards with discarded card
    const updatedSessionCards = sessionCards.map(card => 
      card.sessioncardid === sessionCardId 
        ? { ...card, cardPosition: maxPosition + 1, playerid: null }
        : card
    );

    // Shuffle all cards in the deck (including the newly discarded card)
    const shuffledCards = await updateDeckOrder(sessionId, updatedSessionCards as SessionCard[]);
    console.log('Shuffled cards:', shuffledCards);
    
    return shuffledCards;
  } catch (error) {
    console.error('Error in discardAndShuffleCard:', error);
    throw error;
  }
}

export async function updateCardRevealed(
  sessionId: number,
  sessionCardId: number,
  isRevealed: boolean
): Promise<void> {
  const { error } = await supabase
    .from('session_cards')
    .update({ isRevealed })
    .match({ 
      sessionid: sessionId,
      sessioncardid: sessionCardId 
    });
  console.log('Updated card revealed:', sessionCardId, isRevealed);
  if (error) throw error;
}

export async function passTurnToNextPlayer(sessionId: number, currentPlayerId: number): Promise<void> {
    try {
        // Get current player's order
        const { data: currentPlayer, error: currentPlayerError } = await supabase
            .from('player')
            .select('player_order')
            .eq('playerid', currentPlayerId)
            .single();

        if (currentPlayerError) throw currentPlayerError;

        // Get total number of players
        const { data: players, error: playersError } = await supabase
            .from('player')
            .select('player_order')
            .eq('sessionid', sessionId)
            .order('player_order', { ascending: true });

        if (playersError) throw playersError;

        // Calculate next player's order
        const maxOrder = Math.max(...players.map(p => p.player_order));
        const nextOrder = currentPlayer.player_order === maxOrder ? 1 : currentPlayer.player_order + 1;

        // Update all players to is_turn = false
        await supabase
            .from('player')
            .update({ is_turn: false })
            .eq('sessionid', sessionId);

        // Set is_turn = true for next player
        const { error: updateError } = await supabase
            .from('player')
            .update({ is_turn: true })
            .match({ sessionid: sessionId, player_order: nextOrder });

        if (updateError) throw updateError;
    } catch (error) {
        console.error('Error passing turn:', error);
        throw error;
    }
}

export async function pushPlayerAction(
  sessionId: number,
  playerId: number,
  description: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('player_actions')
      .insert({
        sessionid: sessionId,
        playerid: playerId,
        description: description
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error pushing player action:', error);
    throw new Error('Failed to push player action');
  }
}

export async function updatePlayerLastAction(sessionId: number, playerId: number): Promise<void> {
  const { error } = await supabase
    .from('player')
    .update({ time_last_action: new Date().toISOString() })
    .match({ sessionid: sessionId, playerid: playerId });

  if (error) throw error;
}

export async function resetGame(gameContext: GameContextType): Promise<void> {
  try {
    // Reset session cards
    const newDeck = initializeSession(gameContext);
    
    // Delete existing session cards
    const { error: deleteError } = await supabase
      .from('session_cards')
      .delete()
      .eq('sessionid', gameContext.sessionid);
    
    if (deleteError) throw deleteError;

    // Insert new session cards
    await insertSessionCards(gameContext.sessionid, newDeck);

    // Reset player points to starting amount
    const { error: playerError } = await supabase
      .from('player')
      .update({ 
        num_points: gameContext.gameData.starting_num_points || 0,
        is_turn: false 
      })
      .eq('sessionid', gameContext.sessionid);

    if (playerError) throw playerError;

    // Reset session points
    const { error: sessionError } = await supabase
      .from('session')
      .update({ 
        num_points: gameContext.gameData.num_points
      })
      .eq('sessionid', gameContext.sessionid);

    if (sessionError) throw sessionError;

    // Set first player's turn
    await setFirstPlayerTurn(gameContext.sessionid);

  } catch (error) {
    console.error('Error resetting game:', error);
    throw error;
  }
}
