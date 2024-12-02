'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface PlayerInfo {
  playerId: string;
  userName: string;
  gameCode: string;
}

export default function WaitingRoomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);

  useEffect(() => {
    // Try to get player info from localStorage
    const storedPlayerInfo = localStorage.getItem('playerInfo');
    if (storedPlayerInfo) {
      setPlayerInfo(JSON.parse(storedPlayerInfo));
    } else {
      // Fallback to URL params
      const playerInfo = {
        playerId: searchParams.get('playerId') || '',
        userName: searchParams.get('userName') || '',
        gameCode: searchParams.get('gameCode') || '',
      };

      if (!playerInfo.playerId || !playerInfo.gameCode) {
        console.error('Missing player information');
        router.push('/'); // Redirect to home if no player info
        return;
      }

      setPlayerInfo(playerInfo);
    }
  }, [router, searchParams]);

  const handleStartGame = () => {
    if (playerInfo) {
      router.push(`/player-hand/${playerInfo.gameCode}/${playerInfo.playerId}`);
    }
  };

  if (!playerInfo) return <div>Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
      <Button onClick={() => router.back()} className="absolute top-4 left-4">
        Back
      </Button>

      <h1 className="text-4xl font-bold mb-8">Waiting Room</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-xl mb-4">Welcome, {playerInfo.userName}!</p>
        <p className="text-lg mb-4">Game Code: {playerInfo.gameCode}</p>
        <p className="text-gray-600 mb-6">Waiting for the game to start...</p>
      </div>

      {/* Temporary button for demo purposes */}
      <Button onClick={handleStartGame} className="mt-8">
        Start Game (Demo)
      </Button>
    </div>
  );
}
