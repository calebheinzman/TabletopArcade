'use client';

import BoardActionFeed from '@/components/board/board-action-feed';
import BoardDeckDialog from '@/components/board/board-deck-dialog';
import BoardDiscardPile from '@/components/board/board-discard-pile';
import BoardHeader from '@/components/board/board-header';
import BoardPlayerActionsDialog from '@/components/board/board-player-actions-dialog';
import BoardPlayerHands from '@/components/board/board-player-hands';
import { useFullScreen } from '@/components/FullscreenContext';
import { useGame } from '@/components/GameContext';
import { Button } from '@/components/ui/button';
import { passTurnToNextPlayer, pushPlayerAction } from '@/lib/supabase/player';
import { resetGame } from '@/lib/supabase/session';
import React, { useRef, useState } from 'react';

const BoardContent: React.FC = () => {
  const gameContext = useGame();
  const { toggleFullScreen } = useFullScreen();
  const boardRef = useRef<HTMLDivElement>(null);

  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [isHost] = useState(true); // TODO: Implement proper host check
  const [isActionFeedOpen, setIsActionFeedOpen] = useState(false);

  if (!gameContext) return <div>Loading...</div>;

  const sortedPlayers = [...gameContext.sessionPlayers].sort(
    (a, b) => (a.player_order || 0) - (b.player_order || 0)
  );

  const deckCount = gameContext.sessionCards.filter(
    (card) => card.cardPosition > 0
  ).length;
  const gamePoints = gameContext.session.num_points;

  const selectedPlayer = sortedPlayers.find(
    (player) => player.playerid === selectedPlayerId
  );

  const handleDrawCard = async (playerId: number, card_hidden: boolean) => {
    try {
      await gameContext.drawCard(playerId, card_hidden);
    } catch (error) {
      console.error('Error drawing card:', error);
    }
  };

  const handleGivePoint = async (playerId: number, quantity: number) => {
    try {
      await gameContext.givePoints(playerId, 'Board', quantity);
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
      console.error('Error drawing point:', error);
    }
  };

  const handleDiscardCard = async (
    playerId: number,
    sessionCardId: number,
    pileId?: number
  ) => {
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

  const handleReset = async () => {
    try {
      if (!gameContext) return;
      await resetGame(gameContext);
    } catch (error) {
      console.error('Error resetting game:', error);
    }
  };

  const handleEndTurn = async (playerId: number) => {
    try {
      await passTurnToNextPlayer(gameContext.sessionid, playerId);
    } catch (error) {
      console.error('Error ending turn:', error);
    }
  };

  console.log('BOARD REF', boardRef.current);
  return (
    <div
      className="flex flex-col flex-grow relative h-screen"
      ref={boardRef} // Reference for full-screen
    >
      {/* Header Section */}
      <BoardHeader
        deckCount={deckCount}
        players={sortedPlayers}
        onDrawCard={handleDrawCard}
        onGivePoint={handleDrawPoint}
        onDiscardCard={(playerId) => handleDiscardCard(playerId, 0)}
        onShuffle={handleShuffle}
        onReset={handleReset}
        onFullScreen={() => toggleFullScreen(boardRef)}
      />

      {/* Actions and board */}
      <div className="w-full h-full flex gap-4 p-4">
        {/* Game Board */}
        <div className="relative flex-grow bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden w-full p-2">
          <Button
            size="sm"
            variant="outline"
            className="absolute top-2 right-2 z-10"
            onClick={() => setIsActionFeedOpen(!isActionFeedOpen)}
          >
            {isActionFeedOpen ? 'Hide Actions' : 'Show Actions'}
          </Button>

          <div className="p-2">
            <BoardPlayerHands
              players={sortedPlayers}
              totalPlayers={sortedPlayers.length}
              onSelectPlayer={setSelectedPlayerId}
            />

            <div className="absolute top-[52%] left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="flex items-center space-x-8">
                <BoardDeckDialog
                  deckCount={deckCount}
                  players={sortedPlayers}
                  onDrawCard={handleDrawCard}
                />

                <div className="flex space-x-4 items-center">
                  {gameContext.discardPiles
                    .filter((pile) => !pile.is_player)
                    .map((pile) => (
                      <BoardDiscardPile
                        key={pile.pile_id}
                        pile={pile}
                        variant="board"
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>

          {gamePoints > 0 && (
            <div className="absolute top-4 left-4 bg-yellow-400 text-black px-4 py-2 rounded-full text-sm sm:text-base font-bold">
              Points: {gamePoints}
            </div>
          )}
        </div>

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

        {isActionFeedOpen && <BoardActionFeed />}
      </div>
    </div>
  );
};

export default BoardContent;
