'use client';

import { useGame } from '@/components/GameContext';
import { Button } from '@/components/ui/button';
import { useParams, useRouter } from 'next/navigation';

export default function HostStartPage() {
  const router = useRouter();
  const { sessionId } = useParams();
  const { gameState } = useGame();

  const startGame = async () => {
    try {
      // Notify the game server that the game is starting
      await fetch(`/api/games/${sessionId}/start`, {
        method: 'POST',
      });

      // Navigate to the game board
      router.push(`/board/${sessionId}`);
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  if (!gameState) {
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
            Players Joined ({gameState.players.length})
          </p>
          <div className="mt-2 space-y-2">
            {gameState.players.map((player) => (
              <div key={player.id} className="text-sm bg-gray-50 p-2 rounded">
                {player.username}
              </div>
            ))}
          </div>
        </div>
        <Button
          onClick={startGame}
          className="w-full"
          disabled={gameState.players.length < 2} // Require at least 2 players
        >
          Start Game
        </Button>
      </div>
    </div>
  );
}
