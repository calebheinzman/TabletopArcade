'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GameContextType } from "@/components/GameContext";
import { updateSessionCards } from "@/lib/supabase/card";
import { pushPlayerAction } from "@/lib/supabase/player";
import { PlayerHandCardDialogue } from './player-hand-card-dialogue';

interface PlayerHandCardsProps {
  gameContext: GameContextType;
  playerId: number;
  playerCards: Array<{
    id: number;
    name: string;
    description: string;
    isRevealed: boolean;
    hidden: boolean;
  }>;
  disabled: boolean;
}

export function PlayerHandCards({ 
  gameContext, 
  playerId, 
  playerCards,
  disabled 
}: PlayerHandCardsProps) {
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

  const handleDiscard = async (playerId: number, cardId: number, pileId?: number, targetPlayerId?: number) => {
    try {
      if (!gameContext.gameData.can_discard) return;

      if (gameContext.gameData.lock_player_discard && gameContext.session.locked_player_discard) {
        console.log('Player discarding is currently locked');
        return;
      }

      const cardsInPile = gameContext.sessionCards.filter(card => {
        if (pileId === undefined) return false; 
        const pile = gameContext.discardPiles.find(p => p.pile_id === pileId);
        if (!pile) return false;

        if (pile.is_player) {
          return card.pile_id === pileId && card.playerid === targetPlayerId;
        } else {
          return card.pile_id === pileId;
        }
      });

      if (pileId !== undefined) {
        const discardPile = gameContext.discardPiles.find(p => p.pile_id === pileId);
        if (!discardPile) throw new Error('Discard pile not found');

        const newPlayerId: number | null = discardPile.is_player ? (targetPlayerId ?? null) : null;

        const updates = cardsInPile.map(card => ({
          sessionid: gameContext.sessionid,
          sessioncardid: card.sessioncardid,
          cardPosition: card.cardPosition + 1,
          playerid: newPlayerId,
          pile_id: pileId,
          isRevealed: discardPile.is_face_up
        }));

        updates.push({
          sessionid: gameContext.sessionid,
          sessioncardid: cardId,
          cardPosition: 1,
          playerid: newPlayerId,
          pile_id: pileId,
          isRevealed: discardPile.is_face_up
        });

        await updateSessionCards(updates);
      } else {
        await gameContext.discardCard(gameContext.sessionid, cardId);
      }

      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Discarded card`
      );
    } catch (error) {
      console.error('Error discarding card:', error);
    }
  };

  const handlePassCard = async (playerId: number, cardId: number, targetPlayerId: number) => {
    try {
      const updates = [{
        sessionid: gameContext.sessionid,
        sessioncardid: cardId,
        cardPosition: 0,
        playerid: targetPlayerId,
        pile_id: null,
        isRevealed: false,
        card_hidden: false
      }];

      await updateSessionCards(updates);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Passed a card to ${gameContext.sessionPlayers.find(p => p.playerid === targetPlayerId)?.username}`
      );
    } catch (error) {
      console.error('Error passing card:', error);
    }
  };

  return (
    <div className="flex-grow overflow-auto p-2 md:p-6 lg:p-8">
      <div className="grid landscape:md:grid auto-rows-auto grid-cols-[repeat(auto-fill,minmax(100px,160px))] gap-2 landscape:md:justify-center landscape:flex md:landscape:block landscape:overflow-x-auto landscape:md:overflow-visible justify-center landscape:justify-start">
        {playerCards.map((card, index) => {
          return !card.hidden ? (
            <Dialog key={`${card.id}-${index}`}>
              <DialogTrigger asChild>
                <Card className="aspect-[2/3] landscape:aspect-[2/2.5] landscape:md:aspect-[2/3] landscape:w-[120px] landscape:md:w-full w-full bg-gray-200 shadow-md cursor-pointer hover:shadow-lg transition-shadow relative shrink-0">
                  <CardContent className="flex items-center justify-center h-full">
                    <span className="text-lg md:text-xl font-semibold">{card.name}</span>
                    {card.isRevealed && (
                      <Badge className="absolute top-2 right-2" variant="secondary">
                        Revealed
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </DialogTrigger>
              <PlayerHandCardDialogue
                gameContext={gameContext}
                playerId={playerId}
                card={card}
                disabled={disabled}
                onReveal={handleReveal}
                onDiscard={handleDiscard}
                onPassCard={handlePassCard}
              />
            </Dialog>
          ) : (
            <Card 
              key={`${card.id}-${index}`}
              className="aspect-[2/3] landscape:aspect-[2/2.5] landscape:md:aspect-[2/3] landscape:w-[120px] landscape:md:w-full w-full bg-gray-300 shadow-md cursor-not-allowed shrink-0"
            >
              <CardContent className="flex items-center justify-center h-full">
                <span className="text-gray-500 md:text-lg">Hidden</span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
