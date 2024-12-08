// components/Board/PlayerActionsDialog.tsx

'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FC } from 'react';
import { useGame } from '@/components/GameContext';

interface BoardPlayerActionsDialogProps {
  isOpen: boolean;
  playerName: string;
  points: number;
  playerId: number;
  isHost: boolean;
  is_turn: boolean;
  onClose: () => void;
  onIncreasePoint: () => void;
  onDecreasePoint: () => void;
  onEndTurn: (playerId: number) => void;
  onDrawCard: (playerId: number) => void;
}

const BoardPlayerActionsDialog: FC<BoardPlayerActionsDialogProps> = ({
  isOpen,
  playerName,
  points,
  playerId,
  isHost,
  is_turn,
  onClose,
  onIncreasePoint,
  onDecreasePoint,
  onEndTurn,
  onDrawCard,
}) => {
  const gameContext = useGame();
  const playerCardCount = gameContext.sessionCards.filter(card => 
    card.playerid === playerId
  ).length;
  const deckCount = gameContext.sessionCards.filter(card => card.cardPosition > 0).length;
  const atMaxCards = playerCardCount >= (gameContext.gameData.max_cards_per_player || 0);

  return (
    <Dialog open={isOpen} onOpenChange={isOpen ? onClose : undefined}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust {playerName}&apos;s Stats</DialogTitle>
          <DialogDescription>
            Modify points for {playerName}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          {/* Points Control */}
          <div className="flex items-center justify-between">
            <span className="font-semibold">Points:</span>
            <div className="flex items-center gap-2">
              <Button
                onClick={onDecreasePoint}
                disabled={points === 0}
                size="sm"
                variant="destructive"
              >
                -
              </Button>
              <span className="text-sm">{points}</span>
              <Button
                onClick={onIncreasePoint}
                disabled={false}
                size="sm"
                variant="default"
              >
                +
              </Button>
            </div>
          </div>

          {/* Draw Card Control */}
          <div className="flex items-center justify-between">
            <span className="font-semibold">Cards:</span>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onDrawCard(playerId)}
                disabled={atMaxCards || deckCount === 0}
                size="sm"
                variant="default"
              >
                Draw Card ({deckCount})
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          {isHost && (
            <Button 
              variant="default"
              onClick={() => onEndTurn(playerId)}
              disabled={!is_turn}
            >
              End Player Turn
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BoardPlayerActionsDialog;
