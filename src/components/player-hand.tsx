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
import { useParams } from 'next/navigation';
import { GameContextType } from '@/components/GameContext';

function handleReveal(playerId: number, cardId: number) {
  console.log('Reveal', playerId, cardId);
}
function handleDiscard(playerId: number, cardId: number) {
  console.log('Discard', playerId, cardId);
}


export function PlayerHand({ gameContext }: { gameContext: GameContextType }) {
  const params = useParams();
  const playerId = parseInt(params?.playerId as string);

  if (!gameContext || !playerId) {
    return <div>Loading game state...</div>;
  }
  let currentPlayer = null;
  for (const player of gameContext.sessionPlayers) {
    if (player.playerid === playerId) {
      currentPlayer = player;
      break;
    }
  }
  if (!currentPlayer) {
    return <div>Error: Player not found</div>;
  }

  const playerCards = gameContext.sessionCards
    .filter(card => card.playerid === playerId)
    .map(sessionCard => {
      const deck = gameContext.decks.find(d => d.deckid === sessionCard.deckid);
      const cardDetails = deck?.cards.find(c => c.cardid === sessionCard.cardid);
      return {
        id: sessionCard.sessioncardid,
        name: cardDetails?.name || 'Unknown Card',
        description: cardDetails?.description || '',
        isRevealed: false
      };
    });

  const playerNames = gameContext.sessionPlayers
    .map((player) => player.username)
    .filter((name) => name !== currentPlayer.username) || [];

  const handleDrawToken = async () => {
    try {
      await gameContext.drawToken(playerId);
    } catch (error) {
      console.error('Error drawing token:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleGiveToken = async (recipient: string) => {
    try {
      await gameContext.giveToken(playerId, recipient);
    } catch (error) {
      console.error('Error giving token:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleDiscard = async (playerId: number, cardId: number) => {
    try {
      await gameContext.discardCard(playerId, cardId);
    } catch (error) {
      console.error('Error discarding card:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">
        {currentPlayer.username}&apos;s Hand
      </h2>
      <div className="flex flex-wrap gap-4 mb-6">
        {playerCards.map((card, index) => (
          <Dialog key={`${card.id}-${index}`}>
            <DialogTrigger asChild>
              <Card className="w-32 h-48 bg-gray-200 shadow-md cursor-pointer hover:shadow-lg transition-shadow relative">
                <CardContent className="flex items-center justify-center h-full">
                  <span className="text-lg font-semibold">{card.name}</span>
                  {card.isRevealed && (
                    <Badge className="absolute top-2 right-2" variant="secondary">
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
          Points: {currentPlayer.num_points || 0}
        </div>
        <div className="space-x-2">
          <Button onClick={() => gameContext.drawCard(playerId)}>Draw Card</Button>
          <Button 
            onClick={handleDrawToken}
            disabled={!gameContext.session.num_tokens || gameContext.session.num_tokens <= 0}
          >
            Draw Token
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button disabled={currentPlayer.num_points === 0}>
                Give Token
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="grid gap-2">
                {playerNames.map((name, index) => (
                  <Button
                    key={index}
                    onClick={() => handleGiveToken(name)}
                    size="sm"
                  >
                    {name}
                  </Button>
                ))}
                <Button onClick={() => handleGiveToken('Board')} size="sm">
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
