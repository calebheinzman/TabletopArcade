'use client';

import { Button } from '@/components/ui/button';
import useGameNamesAndId from '@/hooks/useGameNamesAndId';
import { gameActions, GameTemplateNameAndId } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function GameSelectPage() {
  const router = useRouter();
  const { games, error, isLoading } = useGameNamesAndId();
  const [actionError, setActionError] = useState('');

  // Create new session based on game id selected. Route to host-start page if successful.
  const handleGameSelect = async (game: GameTemplateNameAndId) => {
    // Clear previous error
    setActionError('');

    const { error: createError, sessionId } =
      await gameActions.createSessionFromGameTemplateId(game.id);

    // Display error if unsuccessful.
    if (createError || !sessionId) {
      return setActionError(
        createError ?? 'There was a problem selecting the game.'
      );
    }

    // Navigate to the host-start page using the session id.
    router.push(`/host-start/${sessionId}`);
  };

  // Display loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading games...</div>
      </div>
    );
  }

  // Display error if fetching games failed
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500" role="alert">
          Error fetching games: {error}
        </div>
      </div>
    );
  }

  console.log(games);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
      <Button onClick={() => router.back()} className="absolute top-4 left-4">
        Back
      </Button>
      <h1 className="text-4xl font-bold mb-8">Select a Game</h1>

      {/* Error Message */}
      {actionError && (
        <div className="text-red-500 mb-4" role="alert">
          {actionError}
        </div>
      )}

      <div className="space-y-6">
        {games.map((game) => (
          <Button
            key={game.id}
            className="w-48"
            onClick={() => handleGameSelect(game)}
          >
            {game.name}
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
