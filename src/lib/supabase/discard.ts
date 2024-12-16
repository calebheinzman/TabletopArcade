// tabletop-arcade/src/lib/supabase/discard.ts
import { supabase } from '@/lib/supabase';
import { DiscardPile } from '@/types/game-interfaces';

export async function fetchDiscardPiles(gameId: number): Promise<DiscardPile[]> {
  try {
    const { data, error } = await supabase
      .from('discard_pile')
      .select('*')
      .eq('game_id', gameId);

    if (error) {
      throw error;
    }

    return data as DiscardPile[];
  } catch (error) {
    console.error('Error fetching discard piles:', error);
    throw new Error('Failed to fetch discard piles');
  }
}