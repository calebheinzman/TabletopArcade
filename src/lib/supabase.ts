import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CustomGameData {
  name: string;
  num_tokens: number;
  num_dice: number;
  num_players: number;
  starting_num_cards: number;
  can_discard: boolean;
  can_reveal: boolean;
  can_give_tokens: boolean;
  can_give_cards: boolean;
  can_draw_cards: boolean;
  can_draw_tokens: boolean;
  face_up_board_discard_piles_row: number | null;
  face_up_board_discard_piles_columbs: number | null;
  face_down_board_discard_piles_row: number | null;
  face_down_board_discard_piles_columbs: number | null;
  face_up_player_discard_piles_row: number | null;
  face_up_player_discard_piles_columbs: number | null;
  face_down_player_discard_piles_row: number | null;
  face_down_player_discard_piles_columbs: number | null;
}

export interface DeckData {
  gameid?: number;
  deckname: string;
  num_cards: number;
}

export interface CardData {
  deckid?: number;
  name: string;
  count: number;
  description: string;
  deckName: string;
}

export const gameActions = {
  async createCustomGame(
    gameData: CustomGameData,
    decks: DeckData[],
    cards: CardData[][]
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
        console.log('DECK STUFF');
        console.log(deck);
        console.log(deckDataResult);
        console.log('GAME STUFF');
        console.log(gameId);
        console.log(gameData);
        console.log('CARDS');
        console.log(cards);
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

      return { success: true, gameId };
    } catch (error) {
      console.error('Error creating custom game:', error);
      return { success: false, error: 'Failed to create custom game' };
    }
  },

  async fetchGameNames() {
    try {
      const { data, error } = await supabase.from('game').select('name');

      if (error) throw error;

      return data.map((game) => game.name);
    } catch (error) {
      console.error('Error fetching game names:', error);
      return [];
    }
  },
};
