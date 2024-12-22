'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SessionPlayer } from '@/types/game-interfaces';
import { FC } from 'react';
import { useGame } from '@/components/GameContext';

interface BoardDeckDialogProps {
  deckCount: number;
  players: SessionPlayer[];
  onDrawCard: (playerId: number, card_hidden: boolean) => void;
}

const BoardDeckDialog: FC<BoardDeckDialogProps> = ({
  deckCount,
  players,
  onDrawCard,
}) => {
  const gameContext = useGame();

  const actualDeckCount = gameContext.sessionCards.filter(card => 
    card.cardPosition > 0 && !card.pile_id
  ).length;

  const handleDrawCard = (playerId: number) => {
    onDrawCard(playerId, gameContext.session.hand_hidden);
    // Close dialog code...
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="cursor-pointer relative w-16 h-24 sm:w-18 sm:h-26 md:w-20 md:h-28 p-0"
        >
          <div className="absolute -bottom-2 -right-2 w-full h-full bg-gray-50 rounded-lg border border-gray-300" />
          <div className="absolute -bottom-1 -right-1 w-full h-full bg-gray-100 rounded-lg border border-gray-300" />
          <div className="absolute top-0 left-0 w-full h-full bg-white border border-gray-300 rounded-lg shadow-lg flex items-center justify-center text-gray-700 text-base sm:text-lg font-semibold">
            {actualDeckCount}
          </div>
          <div className="absolute top-0 left-0 w-full h-full bg-transparent rounded-lg hover:shadow-xl hover:scale-100 transition-all z-10" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Draw Card</DialogTitle>
          <DialogDescription>
            Select a player to draw a card
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {players.map((player) => {
            const playerCardCount = gameContext.sessionCards.filter(card => 
              card.playerid === player.playerid
            ).length;
            const atMaxCards = playerCardCount >= (gameContext.gameData.max_cards_per_player || 0);
            console.log('gameContext.session.hand_hidden', gameContext.session.hand_hidden);
            return (
              <Button
                key={player.playerid}
                onClick={() => handleDrawCard(player.playerid)}
                disabled={atMaxCards || actualDeckCount === 0}
                className={atMaxCards ? "opacity-50" : ""}
              >
                {player.username} ({playerCardCount}/{gameContext.gameData.max_cards_per_player})
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BoardDeckDialog;
