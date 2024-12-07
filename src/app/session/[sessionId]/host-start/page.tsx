'use client';

import { useGame } from '@/components/GameContext';
import { Button } from '@/components/ui/button';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SessionPlayer,createSession, setFirstPlayerTurn } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export default function HostStartPage() {
  const router = useRouter();
  const { sessionId } = useParams();
  const gameContext = useGame();
  const [players, setPlayers] = useState<SessionPlayer[]>([]);

  // Monitor changes to gameContext
  useEffect(() => {
    console.log('HostStartPage: gameContext updated', gameContext?.sessionPlayers);
    if (gameContext?.sessionPlayers) {
      setPlayers(gameContext.sessionPlayers);
    }
  }, [gameContext?.sessionPlayers]);

  const startGame = async () => {
    try {
      await createSession(gameContext);
      await setFirstPlayerTurn(parseInt(sessionId as string));
      
      const { error: updateError } = await supabase
        .from('session')
        .update({ is_live: true })
        .eq('sessionid', sessionId);

      if (updateError) throw updateError;

      await fetch(`/api/games/${sessionId}/start`, {
        method: 'POST',
      });
      router.push(`/session/${sessionId}/board`);
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  if (!gameContext || !gameContext.session) {
    return <div>Loading game state...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
      <Button onClick={() => router.back()} className="absolute top-4 left-4">
        Back
      </Button>
      <h1 className="text-4xl font-bold mb-8">Host Game</h1>
      <div className="bg-white p-8 rounded-lg shadow-md w-96 space-y-6">
        <div>
          <p className="text-sm font-medium text-gray-700">Game Code</p>
          <p className="text-2xl font-bold">{sessionId}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">
            Players Joined ({players.length})
          </p>
          <div className="mt-2 space-y-2">
            {players.map((player) => (
              <div key={player.playerid} className="text-sm bg-gray-50 p-2 rounded">
                {player.username}
              </div>
            ))}
          </div>
        </div>
        <Button
          onClick={startGame}
          className="w-full"
          disabled={players.length < 2}
        >
          Start Game
        </Button>
      </div>
    </div>
  );
}
