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

  const renderPlayerHand = (
    player: SessionPlayer,
    index: number,
    totalPlayers: number
  ) => {
    const position = getPlayerPosition(index, totalPlayers);

    return (
      <div
        key={player.id}
        style={{
          position: 'absolute',
          ...position,
          transform: 'translate(-50%, -50%)',
        }}
        className="flex flex-col items-center text-center"
      >
        {/* Player's Name */}
        <div
          className={`text-xs sm:text-sm font-semibold mb-1 ${
            gameState.currentTurn === player.username ? 'text-green-600' : ''
          }`}
        >
          {player.username} {!player.isActive && '(Disconnected)'}
        </div>

        {/* Tokens and Number of Cards */}
        <div className="text-xs sm:text-sm font-semibold mb-2">
          Tokens: {player.tokens || 0} | Cards: {player.cards.length}
        </div>

        {/* Player's Cards */}
        <div className="relative flex justify-center items-center mt-2 gap-2">
          {player.cards.map((card, i) => (
            <Card
              key={i}
              className={`w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16 lg:w-14 lg:h-20 
        ${player.isActive ? 'bg-gray-200' : 'bg-gray-400'} shadow-md flex items-center justify-center p-1`}
              {...card}
            >
              {card.isRevealed && (
                <div className="text-center text-xs sm:text-sm break-words whitespace-normal overflow-hidden">
                  {card.name}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Player's Score */}
        <div className="text-xs sm:text-sm font-semibold mt-2">
          Score: {player.score}
        </div>
      </div>
    );
  };

  const getPlayerPosition = (index: number, totalPlayers: number) => {
    const angle = (360 / totalPlayers) * index;
    const radians = (angle * Math.PI) / 180;
    const radius = 40;

    return {
      top: `${50 + radius * Math.sin(radians)}%`,
      left: `${50 + radius * Math.cos(radians)}%`,
    };
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
            <Button size="sm" disabled={gameState.currentTurn !== 'Alice'}>
              Draw Card ({gameState.deck.length})
            </Button>
            <Button size="sm">Give Token</Button>
            <Button size="sm">Discard Card</Button>
          </div>
        </div>
        <div className="relative flex-grow bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-75 sm:scale-90 md:scale-100">
            <Card className="w-16 h-24 sm:w-18 sm:h-26 md:w-20 md:h-28 bg-white border-2 border-black shadow-lg flex items-center justify-center text-black text-base sm:text-lg font-bold">
              {gameState.deck.length}
            </Card>
          </div>

          {gameState.players.map((player, index) =>
            renderPlayerHand(player, index, gameState.players.length)
          )}

          <div className="absolute top-[2vh] left-[2vw] bg-yellow-400 text-black px-2 py-1 rounded-full text-xs sm:text-sm font-bold z-10">
            Tokens: {gameState.tokens}
          </div>
        </div>
      </div>
    </div>
  );
}
