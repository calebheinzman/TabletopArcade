// components/Board/BoardContent.tsx

'use client';

import BoardHeader from '@/components/board/board-header';
import BoardPlayerActionsDialog from '@/components/board/board-player-actions-dialog';
import BoardPlayerHands from '@/components/board/board-player-hands';
import { useGame } from '@/components/GameContext';
import React, { useState } from 'react';
import { passTurnToNextPlayer } from '@/lib/supabase/player';
import { resetGame } from '@/lib/supabase/session';
import BoardActionFeed from '@/components/board/board-action-feed';
import { Button } from '@/components/ui/button';
import { pushPlayerAction } from '@/lib/supabase/player';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import BoardDeckDialog from '@/components/board/board-deck-dialog';
import BoardDiscardPile from '@/components/board/board-discard-pile';

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
  const gamePoints = gameContext.session.num_points;

  // Find the selected player based on selectedPlayerId
  const selectedPlayer = sortedPlayers.find(
    (player) => player.playerid === selectedPlayerId
  );

  // Handler functions for adjusting points and points
  const handleDrawCard = async (playerId: number) => {
    try {
      await gameContext.drawCard(playerId);
    } catch (error) {
      console.error('Error drawing card:', error);
    }
  };

  const handleGivePoint = async (playerId: number, quantity: number) => {
    try {
      await gameContext.givePoints(playerId, "Board", quantity);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Gave ${quantity} point(s)`
      );
    } catch (error) {
      console.error('Error giving points:', error);
    }
  };
  const handleDrawPoint = async (playerId: number, quantity: number) => {
    try {
      await gameContext.drawPoints(playerId, quantity);
    } catch (error) {
      console.error('Error giving point:', error);
    }
  };

  const handleDiscardCard = async (playerId: number, sessionCardId: number, pileId?: number) => {
    try {
      await gameContext.discardCard(playerId, sessionCardId, pileId);
    } catch (error) {
      console.error('Error discarding card:', error);
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
      await resetGame(gameContext, () => gameContext.sessionCards);
      // The realtime subscriptions should automatically update the UI
    } catch (error) {
      console.error('Error resetting game:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-2 sm:p-4">
      {/* Main container for board and action feed */}
      <div className="w-full max-w-7xl mx-auto flex h-[90vh] gap-4">
        {/* Board and related components */}
        <div className="flex flex-col flex-grow relative">
          {/* Header Section */}
          <BoardHeader
            deckCount={deckCount}
            players={sortedPlayers}
            onDrawCard={handleDrawCard}
            onGivePoint={handleDrawPoint}
            onDiscardCard={(playerId) => handleDiscardCard(playerId, 0)}
            onShuffle={handleShuffle}
            onReset={handleReset}
          />

          {/* Game Board */}
          <div className="relative flex-grow bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden w-full p-4 sm:p-8">
            {/* Toggle Action Feed Button */}
            <Button
              size="sm"
              variant="outline"
              className="absolute top-4 right-4 z-10"
              onClick={() => setIsActionFeedOpen(!isActionFeedOpen)}
            >
              {isActionFeedOpen ? 'Hide Actions' : 'Show Actions'}
            </Button>

            {/* Reduced padding container around the game content */}
            <div className="p-4 sm:p-8 md:p-12">
              {/* Central Deck Area - reduced top margin */}
              <div className="flex items-center justify-center gap-8 mb-4 sm:mb-8 mt-8 sm:mt-12">
                <div className="flex items-center space-x-8">
                  <BoardDeckDialog
                    deckCount={deckCount}
                    players={sortedPlayers}
                    onDrawCard={handleDrawCard}
                  />
                  
                  {/* Discard Piles */}
                  <div className="flex space-x-4 items-center">
                    {gameContext.discardPiles
                      .filter(pile => !pile.is_player)
                      .map((pile) => {
                        return (
                          <BoardDiscardPile
                            key={pile.pile_id}
                            pile={pile}
                            variant="board"
                          />
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Players */}
              <BoardPlayerHands
                players={sortedPlayers}
                totalPlayers={sortedPlayers.length}
                onSelectPlayer={setSelectedPlayerId}
              />
            </div>

            {/* Game Points Display */}
            <div className="absolute top-4 left-4 bg-yellow-400 text-black px-4 py-2 rounded-full text-sm sm:text-base font-bold">
              Points: {gamePoints}
            </div>
          </div>

          {/* Player Actions Dialog */}
          {selectedPlayer && (
            <BoardPlayerActionsDialog
              isOpen={!!selectedPlayerId}
              playerName={selectedPlayer.username}
              points={selectedPlayer.num_points || 0}
              playerId={selectedPlayer.playerid}
              isHost={isHost}
              is_turn={selectedPlayer.is_turn}
              onClose={() => setSelectedPlayerId(null)}
              onIncreasePoint={() => handleDrawPoint(selectedPlayer.playerid, 1)}
              onDecreasePoint={() => handleGivePoint(selectedPlayer.playerid, 1)}
              onEndTurn={handleEndTurn}
              onDrawCard={handleDrawCard}
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
