'use client';

import { Button } from '@/components/ui/button';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HostStartPage() {
  const [players, setPlayers] = useState<string[]>([]);
  const params = useParams();
  const router = useRouter();

  // Simulate websocket connection and player updates
  useEffect(() => {
    // In reality, this would be your websocket connection
    console.log(`Connecting to game server for game ${params.gameId}...`);

    // Simulate periodic player joins
    const interval = setInterval(() => {
      setPlayers((current) => {
        if (current.length >= 6) return current; // Max players
        const newPlayer = `Player${current.length + 1}`;
        return [...current, newPlayer];
      });
    }, 2000); // Add a new player every 2 seconds (for demo)

    // Cleanup function
    return () => {
      clearInterval(interval);
      console.log('Disconnecting from game server...');
    };
  }, [params.gameId]);

  const startGame = async () => {
    try {
      // Notify the game server that the game is starting
      await fetch(`/api/games/${params.gameId}/start`, {
        method: 'POST',
      });

      // Server will broadcast to all players and host
      // Navigation will happen through the socket event listener, for now it's here.
      // Listen for game start event
      router.push(`/board/${params.gameId}`);
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
      <Button onClick={() => router.back()} className="absolute top-4 left-4">
        Back
      </Button>
      <h1 className="text-4xl font-bold mb-8">Host Game</h1>
      <div className="bg-white p-8 rounded-lg shadow-md w-96 space-y-6">
        <div>
          <p className="text-sm font-medium text-gray-700">Game Code</p>
          <p className="text-2xl font-bold">{params.gameId}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">
            Players Joined ({players.length})
          </p>
          <div className="mt-2 space-y-2">
            {players.map((player, index) => (
              <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                {player}
              </div>
            ))}
          </div>
        </div>
        <Button
          onClick={startGame}
          className="w-full"
          disabled={players.length < 2} // Require at least 2 players
        >
          Start Game
        </Button>
      </div>
    </div>
  );
}
