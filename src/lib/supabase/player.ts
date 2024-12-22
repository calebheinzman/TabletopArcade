import { supabase } from './index';
import { SessionPlayer, PlayerAction } from '@/types/game-interfaces';

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

      if (sessionData.is_live) {
        return { playerId: null, error: 'Game is already in progress' };
      }

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

export async function updatePlayerPoints(sessionId: number, playerId: number, newPointCount: number) {
  const { error } = await supabase
    .from('player')
    .update({ num_points: newPointCount })
    .match({ sessionid: sessionId, playerid: playerId });

  if (error) throw error;
}

export async function setFirstPlayerTurn(sessionId: number): Promise<void> {
    try {
        await supabase
            .from('player')
            .update({ is_turn: false })
            .eq('sessionid', sessionId);

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

export async function passTurnToNextPlayer(sessionId: number, currentPlayerId: number): Promise<void> {
    try {
        const { data: currentPlayer, error: currentPlayerError } = await supabase
            .from('player')
            .select('player_order')
            .eq('playerid', currentPlayerId)
            .single();

        if (currentPlayerError) throw currentPlayerError;

        const { data: players, error: playersError } = await supabase
            .from('player')
            .select('player_order')
            .eq('sessionid', sessionId)
            .order('player_order', { ascending: true });

        if (playersError) throw playersError;

        const maxOrder = Math.max(...players.map(p => p.player_order));
        const nextOrder = currentPlayer.player_order === maxOrder ? 1 : currentPlayer.player_order + 1;

        await supabase
            .from('player')
            .update({ is_turn: false })
            .eq('sessionid', sessionId);

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

export async function claimTurn(sessionId: number, playerId: number): Promise<void> {
  try {
    // First, set all players' turns to false
    await supabase
      .from('player')
      .update({ is_turn: false })
      .eq('sessionid', sessionId);

    // Then set the selected player's turn to true
    const { error } = await supabase
      .from('player')
      .update({ is_turn: true })
      .match({ sessionid: sessionId, playerid: playerId });

    if (error) throw error;
  } catch (error) {
    console.error('Error claiming turn:', error);
    throw error;
  }
}
