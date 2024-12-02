'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlayerHand } from '@/components/player-hand';
import { GameProvider, useGame } from '@/components/GameContext';
import { useEffect } from 'react';

function PlayerHandContent() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId;
  const playerId = params.playerId;

  const { gameState, subscribeToGame, unsubscribeFromGame } = useGame();

  useEffect(() => {
    if (gameId && playerId) {
      subscribeToGame(gameId as string);
    }

    return () => unsubscribeFromGame();
  }, [gameId, playerId, subscribeToGame, unsubscribeFromGame]);

  if (!gameState || !playerId) return <div>Loading...</div>;

  // Find the current player from game state
  const currentPlayer = gameState.players.find(
    (player) => player.id === playerId
  );
  if (!currentPlayer) return <div>Player not found</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-2 sm:p-4">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <Button onClick={() => router.back()} size="sm">
            Back
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">
            {currentPlayer.username}&apos;s Hand
          </h1>
          <div className="w-[73px]"></div> {/* Spacer to balance the layout */}
        </div>
      </header>
      <main className="flex-grow p-2 sm:p-4">
        <PlayerHand player_id={playerId as string} />
      </main>
    </div>
  );
}

export default function PlayerHandPage() {
  return (
    <GameProvider>
      <PlayerHandContent />
    </GameProvider>
  );
}
