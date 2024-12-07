'use client';

import { useGame } from '@/components/GameContext';
import { Button } from '@/components/ui/button';
import { SessionPlayer } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PlayerInfo {
  playerId: number;
  userName: string;
  gameCode: number;
}

export default function WaitingRoomPage() {
  const router = useRouter();
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
  const gameContext = useGame();

  useEffect(() => {
    // Try to get player info from localStorage
    const storedPlayerInfo = localStorage.getItem('playerInfo');
    if (storedPlayerInfo) {
      setPlayerInfo(JSON.parse(storedPlayerInfo));
    } else {
      console.error('Missing player information');
      router.push('/');
      return;
    }
  }, [router]);

  // Add new effect to watch for game.is_live changes
  useEffect(() => {
    if (gameContext?.session?.is_live && playerInfo) {
      router.push(
        `/session/${playerInfo.gameCode}/player/${playerInfo.playerId}/hand`
      );
    }
  }, [gameContext?.session?.is_live, playerInfo, router]);

  if (!playerInfo) return <div>Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
      <Button onClick={() => router.back()} className="absolute top-4 left-4">
        Back
      </Button>

      <h1 className="text-4xl font-bold mb-8">Waiting Room</h1>

      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <p className="text-xl mb-4">Welcome, {playerInfo.userName}!</p>
        <p className="text-lg mb-4">Game Code: {playerInfo.gameCode}</p>
        <p className="text-gray-600 mb-6">Waiting for the game to start...</p>

        {gameContext && gameContext.sessionPlayers ? (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Players:</h2>
            <ul className="space-y-2">
              {gameContext.sessionPlayers.map((player: SessionPlayer) => (
                <li
                  key={player.playerid}
                  className={`p-2 rounded ${
                    player.playerid === playerInfo.playerId
                      ? 'bg-blue-100 font-bold'
                      : 'bg-gray-100'
                  }`}
                >
                  {player.username}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>Loading players...</div>
        )}
      </div>
    </div>
  );
}
