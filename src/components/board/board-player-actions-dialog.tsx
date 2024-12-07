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

interface BoardPlayerActionsDialogProps {
  isOpen: boolean;
  playerName: string;
  tokens: number;
  playerId: number;
  isHost: boolean;
  is_turn: boolean;
  onClose: () => void;
  onIncreaseToken: () => void;
  onDecreaseToken: () => void;
  onEndTurn: (playerId: number) => void;
}

const BoardPlayerActionsDialog: FC<BoardPlayerActionsDialogProps> = ({
  isOpen,
  playerName,
  tokens,
  playerId,
  isHost,
  is_turn,
  onClose,
  onIncreaseToken,
  onDecreaseToken,
  onEndTurn,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={isOpen ? onClose : undefined}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust {playerName}&apos;s Stats</DialogTitle>
          <DialogDescription>
            Modify tokens for {playerName}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          {/* Tokens Control */}
          <div className="flex items-center justify-between">
            <span className="font-semibold">Tokens:</span>
            <div className="flex items-center gap-2">
              <Button
                onClick={onDecreaseToken}
                disabled={tokens === 0}
                size="sm"
                variant="destructive"
              >
                -
              </Button>
              <span className="text-sm">{tokens}</span>
              <Button
                onClick={onIncreaseToken}
                disabled={false}
                size="sm"
                variant="default"
              >
                +
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
