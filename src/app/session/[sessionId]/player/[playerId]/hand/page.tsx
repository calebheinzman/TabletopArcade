'use client';

import { useGame } from '@/components/GameContext';
import { PlayerHand } from '@/components/player-hand';
import { Button } from '@/components/ui/button';
import { SessionPlayer } from '@/types/game-interfaces';
import { useParams, useRouter } from 'next/navigation';

export default function PlayerHandContent() {
  const router = useRouter();
  const params = useParams();
  const playerId = parseInt(params.playerId as string);

  const gameContext = useGame();
  console.log('PLAYERHAND GAME CONTEXT', gameContext);

  if (!gameContext || !playerId) return <div>Loading...</div>;

  // Find the current player from game state
  const currentPlayer = gameContext.sessionPlayers.find(
    (player: SessionPlayer) => player.playerid === playerId
  );
  console.log('PLAYERHAND CURRENT PLAYER', currentPlayer);
  console.log('PLAYERHAND PLAYER ID', playerId);

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
        <PlayerHand gameContext={gameContext} />
      </main>
    </div>
  );
}
