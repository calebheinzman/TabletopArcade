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
import { passTurnToNextPlayer, pushPlayerAction, updatePlayerLastAction } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export function PlayerHand({ gameContext }: { gameContext: GameContextType }) {
  const params = useParams();
  const playerId = parseInt(params?.playerId as string);

  // New state variables for handling token quantity and popover visibility
  const [numTokensToDraw, setNumTokensToDraw] = useState(1);
  const [drawTokenPopoverOpen, setDrawTokenPopoverOpen] = useState(false);

  const [numTokensToGive, setNumTokensToGive] = useState(1);
  const [giveTokenPopoverOpen, setGiveTokenPopoverOpen] = useState(false);

  useEffect(() => {
    if (!playerId || !gameContext?.sessionid) return;

    const updateLastActive = () => {
      updatePlayerLastAction(gameContext.sessionid, playerId)
        .catch(error => console.error('Error updating last active:', error));
    };

    updateLastActive();

    const interval = setInterval(updateLastActive, 30000);

    return () => clearInterval(interval);
  }, [playerId, gameContext?.sessionid]);

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
        isRevealed: sessionCard.isRevealed || false
      };
    });

  const playerNames = gameContext.sessionPlayers
    .map((player) => player.username)
    .filter((name) => name !== currentPlayer.username) || [];

  const handleDrawTokens = async () => {
    try {
      await gameContext.drawTokens(playerId, numTokensToDraw);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Drew ${numTokensToDraw} token(s)`
      );
    } catch (error) {
      console.error('Error drawing tokens:', error);
    } finally {
      setDrawTokenPopoverOpen(false);
      setNumTokensToDraw(1);
    }
  };

  const handleGiveTokens = async (recipient: string) => {
    try {
      await gameContext.giveTokens(playerId, recipient, numTokensToGive);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Gave ${numTokensToGive} token(s) to ${recipient}`
      );
    } catch (error) {
      console.error('Error giving tokens:', error);
    } finally {
      setGiveTokenPopoverOpen(false);
      setNumTokensToGive(1);
    }
  };

  const handleDiscard = async (playerId: number, cardId: number) => {
    try {
      await gameContext.discardCard(playerId, cardId);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Discarded card`
      );
    } catch (error) {
      console.error('Error discarding card:', error);
    }
  };

  const handleReveal = async (playerId: number, cardId: number) => {
    try {
      await gameContext.revealCard(playerId, cardId);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Revealed card ${cardId}`
      );
    } catch (error) {
      console.error('Error revealing card:', error);
    }
  };

  const handleEndTurn = async () => {
    try {
      await passTurnToNextPlayer(gameContext.sessionid, playerId);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        "Ended their turn"
      );
    } catch (error) {
      console.error('Error ending turn:', error);
    }
  };

  const handleDrawCard = async () => {
    try {
      await gameContext.drawCard(playerId);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        "Drew a card"
      );
    } catch (error) {
      console.error('Error drawing card:', error);
    }
  };

  console.log('playerCards', playerCards);
  const disabled = !currentPlayer.is_turn && gameContext.gameData.lock_turn;
  const atMaxCards = playerCards.length >= gameContext.gameData.max_cards_per_player;
  const deckCount = gameContext.sessionCards.filter(card => card.cardPosition > 0).length;
  const noDeckCards = deckCount === 0;

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
                    disabled={false}
                  >
                    {card.isRevealed ? 'Unreveal Card' : 'Reveal on Board'}
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
          <Button 
            onClick={handleDrawCard}
            disabled={disabled || atMaxCards || noDeckCards}
          >
            Draw Card ({deckCount})
          </Button>

          {/* Draw Token Button with Popover */}
          <Popover open={drawTokenPopoverOpen} onOpenChange={setDrawTokenPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                disabled={
                  disabled ||
                  !gameContext.session.num_tokens ||
                  gameContext.session.num_tokens <= 0
                }
              >
                Draw Token
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="flex flex-col items-center">
                <span className="mb-2">Select Number of Tokens to Draw</span>
                <div className="flex space-x-2">
                  {[1, 2, 3].map((num) => (
                    <Button
                      key={num}
                      variant={numTokensToDraw === num ? 'default' : 'outline'}
                      onClick={() => setNumTokensToDraw(num)}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
                <Button
                  className="mt-4"
                  onClick={handleDrawTokens}
                  disabled={
                    disabled ||
                    !gameContext.session.num_tokens ||
                    gameContext.session.num_tokens < numTokensToDraw
                  }
                >
                  Confirm
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Give Token Button with Popover */}
          <Popover open={giveTokenPopoverOpen} onOpenChange={setGiveTokenPopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                disabled={
                  disabled ||
                  currentPlayer.num_points === 0
                }
              >
                Give Token
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="flex flex-col">
                <span className="mb-2">Select Number of Tokens to Give</span>
                <div className="flex space-x-2 mb-2">
                  {[1, 2, 3].map((num) => (
                    <Button
                      key={num}
                      variant={numTokensToGive === num ? 'default' : 'outline'}
                      onClick={() => setNumTokensToGive(num)}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
                <div className="grid gap-2">
                  {playerNames.map((name, index) => (
                    <Button
                      key={index}
                      onClick={() => handleGiveTokens(name)}
                      size="sm"
                      disabled={currentPlayer.num_points < numTokensToGive}
                    >
                      {name}
                    </Button>
                  ))}
                  <Button
                    onClick={() => handleGiveTokens('Board')}
                    size="sm"
                    disabled={currentPlayer.num_points < numTokensToGive}
                  >
                    Board
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button 
            onClick={handleEndTurn}
            disabled={!currentPlayer.is_turn}
            variant={gameContext.gameData.lock_turn ? "default" : "outline"}
          >
            End Turn
          </Button>
        </div>
      </div>
    </div>
  );
}
