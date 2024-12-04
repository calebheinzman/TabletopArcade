// components/Board/BoardContent.tsx

'use client';

import BoardHeader from '@/components/board/board-header';
import BoardPlayerActionsDialog from '@/components/board/board-player-actions-dialog';
import BoardPlayerHands from '@/components/board/board-player-hands';
import { useGame } from '@/components/GameContext';
import React, { useState } from 'react';

const BoardContent: React.FC = () => {
  const gameContext = useGame();

  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  if (!gameContext) return <div>Loading...</div>;

  // Destructure necessary data from gameState for clarity
  const players = gameContext.sessionPlayers;
  const deck = gameContext.sessionCards;
  const tokens = gameContext.session.num_tokens;
  const totalPlayers = players.length;
  const deckCount = deck.length;
  const gameTokens = gameContext.session.num_tokens;

  // Find the selected player based on selectedPlayerId
  const selectedPlayer = players.find(
    (player) => player.playerid === selectedPlayerId
  );

  // Handler functions for adjusting tokens and points
  const handleGiveToken = () => {
    if (selectedPlayerId) {
    }
  };

  const handleRemoveToken = () => {
    if (selectedPlayerId) {
      // Optionally, keep the dialog open for multiple adjustments
    }
  };

  const handleIncreasePoints = () => {
    if (selectedPlayerId) {
      // Optionally, keep the dialog open for multiple adjustments
    }
  };

  const handleDecreasePoints = () => {
    if (selectedPlayerId) {
      // Optionally, keep the dialog open for multiple adjustments
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-2 sm:p-4">
      <div className="w-full max-w-6xl mx-auto flex flex-col h-[98vh] relative">
        {/* Header Section */}
        <BoardHeader deckCount={deckCount} />

        {/* Game Board */}
        <div className="relative flex-grow bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden w-full mx-auto">
          {/* Central Deck Display */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 scale-75 sm:scale-90 md:scale-100">
            <div className="w-16 h-24 sm:w-18 sm:h-26 md:w-20 md:h-28 bg-white border-2 border-black shadow-lg flex items-center justify-center text-black text-base sm:text-lg font-bold">
              {deckCount}
            </div>
          </div>

          {/* Players */}
          <BoardPlayerHands
            players={players}
            totalPlayers={totalPlayers}
            onSelectPlayer={setSelectedPlayerId}
          />

          {/* Game Tokens Display (Inside the Board) */}
          <div className="absolute top-4 left-4 bg-yellow-400 text-black px-4 py-2 rounded-full text-sm sm:text-base font-bold">
            Tokens: {gameTokens}
          </div>
        </div>
      </div>

      {/* Player Actions Dialog */}
      {selectedPlayer && (
        <BoardPlayerActionsDialog
          isOpen={!!selectedPlayerId}
          playerName={selectedPlayer.username}
          tokens={selectedPlayer.num_points || 0}
          points={0}
          onClose={() => setSelectedPlayerId(null)}
          onIncreaseToken={handleGiveToken}
          onDecreaseToken={handleRemoveToken}
          onIncreasePoint={handleIncreasePoints}
          onDecreasePoint={handleDecreasePoints}
        />
      )}
    </div>
  );
};

export default BoardContent;
