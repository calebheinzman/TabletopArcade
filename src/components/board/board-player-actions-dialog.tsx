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
import { claimTurn, pushPlayerAction } from '@/lib/supabase/player';
import { FC } from 'react';
import { useBoardContext } from '../../context/board-context';

const BoardPlayerActionsDialog: FC = () => {
  const {
    selectedPlayer,
    selectedPlayerId,
    isHost,
    gameContext,
    onDrawPoint,
    onGivePoint,
    onDrawCard,
    onEndTurn,
    onSelectPlayer,
  } = useBoardContext();

  if (!selectedPlayer) return null;

  const {
    username: playerName,
    num_points: points,
    playerid: playerId,
    is_turn,
  } = selectedPlayer;
  const isOpen = !!selectedPlayerId;

  const playerCardCount = gameContext.sessionCards.filter(
    (card) => card.playerid === playerId
  ).length;
  const deckCount = gameContext.sessionCards.filter(
    (card) => card.cardPosition > 0
  ).length;
  const atMaxCards =
    playerCardCount >= (gameContext.gameData.max_cards_per_player || 0);

  const canAssignTurn =
    isHost &&
    gameContext.gameData.claim_turns &&
    gameContext.gameData.turn_based;

  const handleAssignTurn = async () => {
    try {
      await claimTurn(gameContext.sessionid, playerId);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Turn assigned to ${playerName} by host`
      );
    } catch (error) {
      console.error('Error assigning turn:', error);
    }
  };

  const handleDrawCard = () => {
    onDrawCard(playerId, gameContext.session.hand_hidden);
  };

  const onClose = () => onSelectPlayer(undefined);
  const onOpenChange = () => (isOpen ? onClose() : undefined);

  const onIncreasePoint = () => onDrawPoint(selectedPlayer.playerid, 1);
  const onDecreasePoint = () => onGivePoint(selectedPlayer.playerid, 1);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust {playerName}&apos;s Stats</DialogTitle>
          <DialogDescription>Modify points for {playerName}.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          {/* Points Control - Only show if points are enabled */}
          {gameContext.gameData.num_points > 0 &&
            gameContext.session.num_points > 0 && (
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
            )}

          {/* Draw Card Control */}
          <div className="flex items-center justify-between">
            <span className="font-semibold">Cards:</span>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDrawCard}
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
          <div className="flex gap-2">
            {isHost && gameContext.gameData.turn_based && (
              <>
                <Button
                  variant="default"
                  onClick={() => onEndTurn(playerId)}
                  disabled={!is_turn}
                >
                  End Player Turn
                </Button>
                {canAssignTurn && (
                  <Button variant="secondary" onClick={handleAssignTurn}>
                    Assign Turn
                  </Button>
                )}
              </>
            )}
          </div>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BoardPlayerActionsDialog;
