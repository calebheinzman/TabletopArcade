// components/Board/BoardContent.tsx

'use client';

import BoardHeader from '@/components/board/board-header';
import BoardPlayerActionsDialog from '@/components/board/board-player-actions-dialog';
import BoardPlayerHands from '@/components/board/board-player-hands';
import { useGame } from '@/components/GameContext';
import React, { useState } from 'react';
import { passTurnToNextPlayer, resetGame } from '@/lib/supabase';
import BoardActionFeed from '@/components/board/board-action-feed';
import { Button } from '@/components/ui/button';
import { pushPlayerAction } from '@/lib/supabase';
const BoardContent: React.FC = () => {
  const gameContext = useGame();

  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [isHost] = useState(true); // TODO: Implement proper host check
  const [isActionFeedOpen, setIsActionFeedOpen] = useState(false);

  if (!gameContext) return <div>Loading...</div>;

  // Sort players by player_order
  const sortedPlayers = [...gameContext.sessionPlayers].sort(
    (a, b) => (a.player_order || 0) - (b.player_order || 0)
  );

  // Destructure necessary data from gameState for clarity
  const deckCount = gameContext.sessionCards.filter(card => card.cardPosition > 0).length;
  const gameTokens = gameContext.session.num_tokens;

  // Find the selected player based on selectedPlayerId
  const selectedPlayer = sortedPlayers.find(
    (player) => player.playerid === selectedPlayerId
  );

  // Handler functions for adjusting tokens and points
  const handleDrawCard = async (playerId: number) => {
    try {
      await gameContext.drawCard(playerId);
    } catch (error) {
      console.error('Error drawing card:', error);
    }
  };

  const handleGiveToken = async (playerId: number, quantity: number) => {
    try {
      await gameContext.giveTokens(playerId, "Board", quantity);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Gave ${quantity} token(s)`
      );
    } catch (error) {
      console.error('Error giving token:', error);
    }
  };
  const handleDrawToken = async (playerId: number, quantity: number) => {
    try {
      await gameContext.drawTokens(playerId, quantity);
    } catch (error) {
      console.error('Error giving token:', error);
    }
  };

  const handleDiscardCard = async (playerId: number) => {
    const playerCard = gameContext.sessionCards.find(
      card => card.playerid === playerId
    );
    if (playerCard) {
      try {
        await gameContext.discardCard(playerId, playerCard.sessioncardid);
      } catch (error) {
        console.error('Error discarding card:', error);
      }
    }
  };

  const handleShuffle = async () => {
    try {
      await gameContext.shuffleDeck();
    } catch (error) {
      console.error('Error shuffling deck:', error);
    }
  };

  const handleIncreasePoints = () => {
    // TODO: Implement points logic when ready
    console.log('Increase points');
  };

  const handleDecreasePoints = () => {
    // TODO: Implement points logic when ready
    console.log('Decrease points');
  };

  const handleEndTurn = async (playerId: number) => {
    try {
      await passTurnToNextPlayer(gameContext.sessionid, playerId);
    } catch (error) {
      console.error('Error ending turn:', error);
    }
  };

  const handleReset = async () => {
    try {
      if (!gameContext) return;
      await resetGame(gameContext);
      // The realtime subscriptions should automatically update the UI
    } catch (error) {
      console.error('Error resetting game:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-2 sm:p-4">
      {/* Main container for board and action feed */}
      <div className="w-full max-w-6xl mx-auto flex h-[90vh] gap-4">
        {/* Board and related components */}
        <div className="flex flex-col flex-grow relative">
          {/* Header Section */}
          <BoardHeader
            deckCount={deckCount}
            players={sortedPlayers}
            onDrawCard={handleDrawCard}
            onGiveToken={handleDrawToken}
            onDiscardCard={handleDiscardCard}
            onShuffle={handleShuffle}
            onReset={handleReset}
          />

          {/* Game Board */}
          <div className="relative flex-grow bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden w-full">
            {/* Toggle Action Feed Button */}
            <Button
              size="sm"
              variant="outline"
              className="absolute top-4 right-4 z-10"
              onClick={() => setIsActionFeedOpen(!isActionFeedOpen)}
            >
              {isActionFeedOpen ? 'Hide Actions' : 'Show Actions'}
            </Button>

            {/* Central Deck Display */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 scale-75 sm:scale-90 md:scale-100">
              <div className="w-16 h-24 sm:w-18 sm:h-26 md:w-20 md:h-28 bg-white border-2 border-black shadow-lg flex items-center justify-center text-black text-base sm:text-lg font-bold">
                {deckCount}
              </div>
            </div>

            {/* Players */}
            <BoardPlayerHands
              players={sortedPlayers}
              totalPlayers={sortedPlayers.length}
              onSelectPlayer={setSelectedPlayerId}
            />

            {/* Game Tokens Display */}
            <div className="absolute top-4 left-4 bg-yellow-400 text-black px-4 py-2 rounded-full text-sm sm:text-base font-bold">
              Tokens: {gameTokens}
            </div>
          </div>

          {/* Player Actions Dialog */}
          {selectedPlayer && (
            <BoardPlayerActionsDialog
              isOpen={!!selectedPlayerId}
              playerName={selectedPlayer.username}
              tokens={selectedPlayer.num_points || 0}
              playerId={selectedPlayer.playerid}
              isHost={isHost}
              is_turn={selectedPlayer.is_turn}
              onClose={() => setSelectedPlayerId(null)}
              onIncreaseToken={() => handleDrawToken(selectedPlayer.playerid, 1)}
              onDecreaseToken={() => handleGiveToken(selectedPlayer.playerid, 1)}
              onEndTurn={handleEndTurn}
            />
          )}
        </div>

        {/* Action Feed */}
        {isActionFeedOpen && (
          <BoardActionFeed />
        )}
      </div>
    </div>
  );
};

export default BoardContent;
