'use client';

import BoardActionFeed from '@/components/board/board-action-feed';
import { BoardProvider } from '@/components/board/board-context';
import BoardDeckDialog from '@/components/board/board-deck-dialog';
import BoardDiscardPiles from '@/components/board/board-discard-piles';
import BoardGamePoints from '@/components/board/board-game-points';
import BoardHeader from '@/components/board/board-header';
import BoardPlayerActionsDialog from '@/components/board/board-player-actions-dialog';
import BoardPlayerHands from '@/components/board/board-player-hands';
import BoardToggleActions from '@/components/board/board-toggle-actions';
import React, { useRef } from 'react';

const BoardContent: React.FC = () => {
  const boardRef = useRef(null);

  return (
    <BoardProvider boardRef={boardRef}>
      <div
        className="flex flex-col flex-grow relative h-screen"
        ref={boardRef} // Reference for full-screen
      >
        {/* Header Section */}
        <BoardHeader />

        {/* Actions and board */}
        <div className="w-full h-full flex gap-4 p-4">
          {/* Game Board */}
          <div className="relative flex-grow bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden w-full p-2">
            <BoardToggleActions />

            <div className="p-2">
              <BoardPlayerHands />

              <div className="absolute top-[52%] left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="flex items-center space-x-8">
                  <BoardDeckDialog />
                  <BoardDiscardPiles />
                </div>
              </div>
            </div>

            <BoardGamePoints />
          </div>

          <BoardPlayerActionsDialog />

          <BoardActionFeed />
        </div>
      </div>
    </BoardProvider>
  );
};

export default BoardContent;
