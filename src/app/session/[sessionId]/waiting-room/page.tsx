'use client';

import { useGame } from '@/components/GameContext';
import { Button } from '@/components/ui/button';
import { SessionPlayer } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PlayerInfo {
  playerId: string;
  userName: string;
  gameCode: string;
}

export default function WaitingRoomPage() {
  const router = useRouter();
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
  const { gameState } = useGame();

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

  const handleStartGame = () => {
    if (playerInfo) {
      router.push(
        `/session/${playerInfo.gameCode}/player/${playerInfo.playerId}/hand`
      );
    }
  };

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

        {gameState && gameState.players ? (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Players:</h2>
            <ul className="space-y-2">
              {gameState.players.map((player: SessionPlayer) => (
                <li
                  key={player.id}
                  className={`p-2 rounded ${
                    player.id === playerInfo.playerId
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

      {/* Temporary button for demo purposes */}
      <Button onClick={handleStartGame} className="mt-8">
        Start Game (Demo)
      </Button>
    </div>
  );
}
