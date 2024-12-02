'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { gameActions } from '@/lib/supabase';

export default function GameSelectPage() {
  const [games, setGames] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const loadGames = async () => {
      const gameNames = await gameActions.fetchGameNames();
      setGames(gameNames);
    };
    loadGames();
  }, []);

  const handleGameSelect = async (game: string) => {
    try {
      const response = await fetch('/api/games/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameType: game }),
      });

      if (!response.ok) {
        throw new Error('Failed to create game');
      }

      const { gameId } = await response.json();
      router.push(`/host-start/${gameId}`);
    } catch (error) {
      console.error('Error creating game:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
      <Button onClick={() => router.back()} className="absolute top-4 left-4">
        Back
      </Button>
      <h1 className="text-4xl font-bold mb-8">Select a Game</h1>
      <div className="space-y-6">
        {games.map((game) => (
          <Button
            key={game}
            className="w-48"
            onClick={() => handleGameSelect(game)}
          >
            {game}
          </Button>
        ))}
        <Link href="/create-custom-game">
          <Button className="w-48" variant="outline">
            Create Custom Game
          </Button>
        </Link>
      </div>
    </div>
  );
}
