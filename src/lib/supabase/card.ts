import { supabase } from './index';
import { SessionCard } from '@/types/game-interfaces';

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

export async function updateSessionCards(updates: {
  sessionid: number;
  sessioncardid: number;
  cardPosition: number;
  playerid: number | null;
  pile_id?: number | null;
  isRevealed?: boolean;
}[]) {
  const { error } = await supabase
    .from('session_cards')
    .upsert(updates, { 
      onConflict: 'sessionid,sessioncardid'
    });

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

  const positions = deckCards.map((_, index) => index + 1);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

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
    const maxPosition = Math.max(...sessionCards.map(card => card.cardPosition));
    const discardedCards = await discardCardToDb(sessionId, sessionCardId, maxPosition + 1);
    
    const updatedSessionCards = sessionCards.map(card => 
      card.sessioncardid === sessionCardId 
        ? { ...card, cardPosition: maxPosition + 1, playerid: null }
        : card
    );

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

export async function fetchAllDecks() {
  const { data, error } = await supabase
    .from('deck')
    .select(`
      *,
      cards:card(*)
    `);

  if (error) {
    console.error('Error fetching decks:', error);
    return [];
  }

  return data;
}
