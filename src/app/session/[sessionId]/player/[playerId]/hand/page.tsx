'use client';

import { useGame } from '@/components/GameContext';
import { PlayerHand } from '@/components/player-hand/player-hand';
import { Button } from '@/components/ui/button';
import { SessionPlayer } from '@/types/game-interfaces';
import { useParams, useRouter } from 'next/navigation';

export default function PlayerHandContent() {
  const router = useRouter();
  const params = useParams();
  const playerId = parseInt(params.playerId as string);

  const gameContext = useGame();

  if (!gameContext || !playerId) return <div>Loading...</div>;

  const currentPlayer = gameContext.sessionPlayers.find(
    (player: SessionPlayer) => player.playerid === playerId
  );

  if (!currentPlayer) return <div>Player not found</div>;

  return (
    <div className="flex flex-col w-screen h-screen bg-white overflow-hidden">
      {/* Only show header on desktop */}
      <header className="bg-white shadow-sm p-2 hidden md:block h-[10vh]">
        <div className="flex justify-between items-center w-full">
          <Button onClick={() => router.back()} size="sm">
            Back
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">
            {currentPlayer.username}&apos;s Hand
          </h1>
          <div className="w-[73px]"></div>
        </div>
      </header>

      <main className="flex-grow md:h-[90vh] h-screen overflow-hidden p-0" id="main-content">
        <PlayerHand gameContext={gameContext} />
      </main>
    </div>
  );
}