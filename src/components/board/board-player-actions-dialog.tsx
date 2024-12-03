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
  points: number;
  onClose: () => void;
  onIncreaseToken: () => void;
  onDecreaseToken: () => void;
  onIncreasePoint: () => void;
  onDecreasePoint: () => void;
}

const BoardPlayerActionsDialog: FC<BoardPlayerActionsDialogProps> = ({
  isOpen,
  playerName,
  tokens,
  points,
  onClose,
  onIncreaseToken,
  onDecreaseToken,
  onIncreasePoint,
  onDecreasePoint,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={isOpen ? onClose : undefined}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust {playerName}&apos;s Stats</DialogTitle>
          <DialogDescription>
            Modify tokens and points for {playerName}.
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
                disabled={false} // Assuming tokens are available
                size="sm"
                variant="default"
              >
                +
              </Button>
            </div>
          </div>

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
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BoardPlayerActionsDialog;
