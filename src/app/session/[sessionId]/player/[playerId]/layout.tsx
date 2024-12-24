import { PlayerProvider } from '@/context/player-context';
import { fetchInitialPlayers } from '@/lib/supabase/player';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ sessionId: string; playerId: string }>;
}

export default async function Layout({ children, params }: LayoutProps) {
  const { sessionId, playerId } = await params;

  console.log('PLAYER ID FROM PARAMS', playerId);
  const players = await fetchInitialPlayers(parseInt(sessionId));
  if (!players) return null;

  const player = players.find((p) => p.playerid === parseInt(playerId));
  if (!player) return null;

  return <PlayerProvider player={player}>{children}</PlayerProvider>;
}
