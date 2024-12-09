import { supabase } from './index';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { SessionPlayer } from '@/types/game-interfaces';

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
