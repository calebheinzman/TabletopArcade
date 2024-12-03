import { defaultSessionState } from '@/app/api/player-hand/[player_id]/route';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface GameTemplate {
  id: string;
  name: string;
}

export interface GameTemplateNameAndId {
  id: GameTemplate['id'];
  name: GameTemplate['name'];
}

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

export interface Player {
  username: string;
  cards: number;
  score: number;
  isActive: boolean;
  id: string;
}

export interface SessionState {
  players: SessionPlayer[];
  tokens: number;
  currentTurn: string;
  deck: SessionCard[];
}

export interface SessionCard {
  id: string;
  name: string;
  description: string;
  isRevealed: boolean;
  count: number;
}

export interface SessionPlayer {
  tokens: number;
  points: number;
  username: string;
  cards: SessionCard[];
  score: number;
  isActive: boolean;
  id: string;
  tokens?: number;
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

  async fetchGameTemplate(templateId: GameTemplate['id']) {
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
  },

  async createSessionFromGameTemplateId(templateId: GameTemplate['id']) {
    try {
      // Step 1: Fetch the game template with decks and cards
      const gameData = await this.fetchGameTemplate(templateId);

      if (!gameData) throw new Error('Failed to fetch game template data.');

      // Step 2: Insert a new session based on the game template
      const sessionData = {
        ...gameData,
      };

      const { data: sessionResult, error: sessionError } = await supabase
        .from('session')
        .insert(sessionData)
        .select('sessionid')
        .single();

      if (sessionError) throw sessionError;

      const sessionId = sessionResult.sessionid;

      // Step 3: Copy decks and associate them with the new session
      for (const deck of gameData.decks) {
        const deckData = {
          sessionid: sessionId,
          deckname: deck.deckname,
          num_cards: deck.num_cards,
          // Add other deck fields as needed
        };

        const { data: newDeck, error: deckError } = await supabase
          .from('deck')
          .insert(deckData)
          .select('deckid')
          .single();

        if (deckError) throw deckError;

        const newDeckId = newDeck.deckid;

        // Step 4: Copy cards and associate them with the new deck
        for (const card of deck.cards) {
          const cardData = {
            deckid: newDeckId,
            name: card.name,
            count: card.count,
            description: card.description,
            // Add other card fields as needed
          };

          const { error: cardError } = await supabase
            .from('card')
            .insert(cardData);

          if (cardError) throw cardError;
        }
      }

      return { error: null, sessionId };
    } catch (error) {
      console.error('Error creating session from game:', error);
      return { sessionId: null, error: 'Failed to create session from game' };
    }
  },

  async fetchGameNames(): Promise<GameTemplateNameAndId[] | []> {
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
  },

  async fetchGameSession(sessionId: string) {
    const { data, error } = await supabase
      .from('session')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching game state:', error);
    }

    return data;
  },

  // New function to subscribe to a session
  subscribeToSession(
    sessionId: string,
    onUpdate: (gameState: SessionState) => void,
    useDefaultValues: boolean = false
  ) {
    if (useDefaultValues) {
      // Simulate an initial update
      onUpdate(defaultSessionState);

      // Simulate real-time updates
      const interval = setInterval(() => {
        // Modify defaultSessionState to simulate changes
        const newGameState = {
          ...defaultSessionState,
          tokens: defaultSessionState.tokens - Math.floor(Math.random() * 5),
          currentTurn:
            defaultSessionState.players[
              Math.floor(Math.random() * defaultSessionState.players.length)
            ].id,
        };
        onUpdate(newGameState);
      }, 5000); // Update every 5 seconds

      // Return an unsubscribe function
      const unsubscribe = () => {
        clearInterval(interval);
        console.log('Unsubscribed from default session:', sessionId);
      };

      return { unsubscribe };
    } else {
      // Existing Supabase subscription logic
      const channel = supabase
        .channel(`session:${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'session',
            filter: `id=eq.${sessionId}`,
          },
          (payload) => {
            console.log('Received update from Supabase:', payload);
            if (
              payload.eventType === 'UPDATE' ||
              payload.eventType === 'INSERT'
            ) {
              onUpdate(payload.new as SessionState);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to session ${sessionId}`);
          }
        });

      // Return a function to unsubscribe
      const unsubscribe = () => {
        supabase.removeChannel(channel);
        console.log('Unsubscribed from session:', sessionId);
      };

      return { unsubscribe };
    }
  },
};
