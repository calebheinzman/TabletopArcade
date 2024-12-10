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
  front_img_url: string;
  back_img_url: string;
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
