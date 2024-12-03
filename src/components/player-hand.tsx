// PlayerHand.tsx

'use client';

import { useGame } from '@/components/GameContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SessionPlayer } from '@/lib/supabase';
import { useParams } from 'next/navigation';

export function PlayerHand() {
  const {
    gameState,
    drawCard,
    handleReveal,
    handleDiscard,
    drawToken,
    giveToken,
  } = useGame();
  const params = useParams();
  const playerId = params?.playerId as string;

  if (!gameState || !playerId) {
    return <div>Loading game state...</div>;
  }

  const currentPlayer = gameState.players.find(
    (player: SessionPlayer) => player.id === playerId
  );

  if (!currentPlayer) {
    return <div>Error: Player not found</div>;
  }

  const playerNames =
    gameState.players
      .map((player) => player.username)
      .filter((name) => name !== currentPlayer.username) || [];

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">
        {currentPlayer.username}&apos;s Hand
      </h2>
      <div className="flex flex-wrap gap-4 mb-6">
        {currentPlayer.cards.map((card, index) => (
          <Dialog key={`${card.id}-${index}`}>
            <DialogTrigger asChild>
              <Card className="w-32 h-48 bg-gray-200 shadow-md cursor-pointer hover:shadow-lg transition-shadow relative">
                <CardContent className="flex items-center justify-center h-full">
                  <span className="text-lg font-semibold">{card.name}</span>
                  {card.isRevealed && (
                    <Badge
                      className="absolute top-2 right-2"
                      variant="secondary"
                    >
                      Revealed
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{card.name}</DialogTitle>
                <DialogDescription>{card.description}</DialogDescription>
              </DialogHeader>
              <div className="flex justify-between mt-4">
                <DialogClose asChild>
                  <Button
                    onClick={() => handleReveal(playerId, card.id)}
                    disabled={card.isRevealed}
                  >
                    {card.isRevealed ? 'Already Revealed' : 'Reveal on Board'}
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    variant="destructive"
                    onClick={() => handleDiscard(playerId, card.id)}
                  >
                    Discard
                  </Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-xl font-bold">
          Points: {currentPlayer.points || 0}
        </div>
        <div className="space-x-2">
          <Button onClick={() => drawCard(playerId)}>Draw Card</Button>
          <Button onClick={() => drawToken(playerId)}>Draw Token</Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button disabled={currentPlayer.points === 0}>Give Token</Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="grid gap-2">
                {playerNames.map((name, index) => (
                  <Button
                    key={index}
                    onClick={() => giveToken(playerId, name)}
                    size="sm"
                  >
                    {name}
                  </Button>
                ))}
                <Button onClick={() => giveToken(playerId, 'Board')} size="sm">
                  Board
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
