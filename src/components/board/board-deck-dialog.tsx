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
import { SessionPlayer } from '@/lib/supabase';
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
          <div className="w-16 h-24 sm:w-18 sm:h-26 md:w-20 md:h-28 bg-white border-2 border-black shadow-lg flex items-center justify-center text-black text-base sm:text-lg font-bold hover:shadow-xl transition-shadow">
            {deckCount}
          </div>
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
