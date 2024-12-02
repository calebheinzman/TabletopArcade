'use client';

import { useGame } from '@/components/GameContext';
import { PlayerHand } from '@/components/player-hand';
import { Button } from '@/components/ui/button';
import { SessionPlayer } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

export default function PlayerHandContent() {
  const router = useRouter();
  const params = useParams();
  const playerId = params.playerId as string;

  const { gameState } = useGame();

  console.log('GAME STATE', gameState);
  if (!gameState || !playerId) return <div>Loading...</div>;

  // Find the current player from game state
  const currentPlayer = gameState.players.find(
    (player: SessionPlayer) => player.id === playerId
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
        <PlayerHand playerId={playerId} />
      </main>
    </div>
  );
}
