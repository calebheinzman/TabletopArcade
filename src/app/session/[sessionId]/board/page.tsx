'use client';

import { useGame } from '@/components/GameContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SessionPlayer } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function BoardContent() {
  const router = useRouter();
  const { gameState } = useGame();

  if (!gameState) return <div>Loading...</div>;

  const renderPlayerHand = (player: SessionPlayer, index: number) => (
    <div className={`absolute ${getPlayerPosition(index)}`} key={index}>
      <div className="flex flex-col items-center scale-50 sm:scale-75 md:scale-90 lg:scale-100">
        <div
          className={`text-xs sm:text-sm font-semibold mb-1 ${
            gameState.currentTurn === player.username ? 'text-green-600' : ''
          }`}
        >
          {player.username}
          {!player.isActive && ' (Disconnected)'}
        </div>
        <div className="flex space-x-1 mb-1">
          {player.cards.map((card, i) => (
            <Card
              key={i}
              className={`w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16 lg:w-14 lg:h-20 
                ${player.isActive ? 'bg-gray-200' : 'bg-gray-400'} shadow-md`}
              {...card}
            />
          ))}
        </div>
        <div className="text-xs sm:text-sm font-semibold">
          Score: {player.score}
        </div>
      </div>
    </div>
  );

  const getPlayerPosition = (index: number) => {
    switch (index) {
      case 0:
        return 'top-[2vh] left-1/2 -translate-x-1/2';
      case 1:
        return 'top-[25vh] right-[2vw] -translate-y-1/2';
      case 2:
        return 'bottom-[25vh] right-[2vw] translate-y-1/2';
      case 3:
        return 'bottom-[2vh] left-1/2 -translate-x-1/2';
      case 4:
        return 'bottom-[25vh] left-[2vw] translate-y-1/2';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-2 sm:p-4">
      <div className="w-full max-w-4xl mx-auto flex flex-col h-[98vh]">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <Button
            onClick={() => router.back()}
            size="sm"
            className="self-start"
          >
            Back
          </Button>
          <div className="space-x-2 self-end">
            <Button
              size="sm"
              disabled={gameState.currentTurn !== 'Alice'} // Example: only active on your turn
            >
              Draw Card ({gameState.deck.length})
            </Button>
            <Button size="sm">Give Token</Button>
            <Button size="sm">Discard Card</Button>
          </div>
        </div>
        <div className="relative flex-grow bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-50 sm:scale-75 md:scale-90 lg:scale-100">
            <Card className="w-16 h-24 sm:w-18 sm:h-26 md:w-20 md:h-28 bg-white border-2 border-black shadow-lg flex items-center justify-center text-black text-base sm:text-lg font-bold">
              {gameState.deck.length}
            </Card>
          </div>

          {gameState.players.map((player, index) =>
            renderPlayerHand(player, index)
          )}

          <div className="absolute top-[2vh] left-[2vw] bg-yellow-400 text-black px-2 py-1 rounded-full text-xs sm:text-sm font-bold">
            Tokens: {gameState.tokens}
          </div>
        </div>
      </div>
    </div>
  );
}
