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
  onDrawCard: (playerId: number) => void;
}

const BoardDeckDialog: FC<BoardDeckDialogProps> = ({
  deckCount,
  players,
  onDrawCard,
}) => {
  const gameContext = useGame();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 scale-75 sm:scale-90 md:scale-100 cursor-pointer">
          <div className="w-16 h-24 sm:w-18 sm:h-26 md:w-20 md:h-28 bg-white/90 border border-gray-300 rounded-lg shadow-lg flex items-center justify-center text-gray-700 text-base sm:text-lg font-semibold transition-all">
            <div className="absolute -bottom-1 -right-1 w-full h-full bg-gray-100 rounded-lg border border-gray-300 -z-10" />
            <div className="absolute -bottom-2 -right-2 w-full h-full bg-gray-50 rounded-lg border border-gray-300 -z-20" />
            {deckCount}
          </div>
          <div className="absolute top-0 left-0 w-full h-full bg-transparent rounded-lg hover:shadow-xl hover:scale-100 transition-all" />
        </div>
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
            
            return (
              <Button
                key={player.playerid}
                onClick={() => onDrawCard(player.playerid)}
                disabled={atMaxCards || deckCount === 0}
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
