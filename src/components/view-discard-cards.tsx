// view-discard-cards.tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { GameContextType } from '@/providers/game-provider';
import { SessionCard } from '@/types/game-interfaces';
import { useState } from 'react';

interface ViewDiscardCardsProps {
  gameContext: GameContextType;
  pileCards: SessionCard[];
  onMoveAllToDeck?: () => Promise<void>;
  onMoveToOtherPile?: (
    targetPileId: number,
    targetPlayerId?: number
  ) => Promise<void>;
  showMoveOptions?: boolean;
}

export function ViewDiscardCards({
  gameContext,
  pileCards,
  onMoveAllToDeck,
  onMoveToOtherPile,
  showMoveOptions = true,
}: ViewDiscardCardsProps) {
  const [selectedCard, setSelectedCard] = useState<SessionCard | null>(null);

  const handleMoveSingleCardToDeck = async (card: SessionCard) => {
    try {
      // Get max position in deck
      const maxDeckPosition = Math.max(
        ...gameContext.sessionCards
          .filter((c) => c.cardPosition > 0 && !c.pile_id)
          .map((c) => c.cardPosition),
        0
      );

      // Create update for single card
      const update = [
        {
          sessionid: gameContext.sessionid,
          sessioncardid: card.sessioncardid,
          cardPosition: maxDeckPosition + 1,
          playerid: null,
          pile_id: null,
          isRevealed: false,
        },
      ];

      await gameContext.updateSessionCards(update);
      await gameContext.shuffleDeck();
    } catch (error) {
      console.error('Error moving card to deck:', error);
    }
  };

  const handleMoveSingleCardToPile = async (
    card: SessionCard,
    targetPileId: number,
    targetPlayerId?: number
  ) => {
    try {
      const targetPile = gameContext.discardPiles.find(
        (p) => p.pile_id === targetPileId
      );
      if (!targetPile) return;

      // Get existing cards in target pile
      const existingCards = gameContext.sessionCards.filter((c) => {
        if (targetPile.is_player) {
          return c.pile_id === targetPileId && c.playerid === targetPlayerId;
        } else {
          return c.pile_id === targetPileId;
        }
      });

      // Create update for single card
      const update = [
        {
          sessionid: gameContext.sessionid,
          sessioncardid: card.sessioncardid,
          cardPosition: existingCards.length + 1,
          playerid: targetPile.is_player ? (targetPlayerId ?? null) : null,
          pile_id: targetPileId,
          isRevealed: targetPile.is_face_up,
        },
      ];

      await gameContext.updateSessionCards(update);
    } catch (error) {
      console.error('Error moving card to pile:', error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Cards List */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-2">Cards in Pile:</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {pileCards.map((card, index) => {
            const deck = gameContext.decks.find(
              (d) => d.deckid === card.deckid
            );
            const cardDetails = deck?.cards.find(
              (c) => c.cardid === card.cardid
            );

            return (
              <Popover key={card.sessioncardid}>
                <PopoverTrigger asChild>
                  <div
                    className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedCard(card)}
                  >
                    <span className="text-sm">
                      {cardDetails?.name || 'Unknown Card'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Position: {index + 1}
                    </span>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="flex flex-col gap-2">
                    <h4 className="font-medium text-sm">Move this card to:</h4>

                    {/* Move single card to deck */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveSingleCardToDeck(card)}
                    >
                      Deck
                    </Button>

                    {/* Move single card to other piles */}
                    {gameContext.discardPiles.map((targetPile) => (
                      <div key={targetPile.pile_id}>
                        {targetPile.is_player ? (
                          // For player piles, show option for each player
                          gameContext.sessionPlayers.map((player) => (
                            <Button
                              key={`${targetPile.pile_id}-${player.playerid}`}
                              variant="outline"
                              size="sm"
                              className="mb-1 w-full"
                              onClick={() =>
                                handleMoveSingleCardToPile(
                                  card,
                                  targetPile.pile_id,
                                  player.playerid
                                )
                              }
                            >
                              {player.username}&apos;s{' '}
                              {targetPile.pile_name || 'Pile'}
                            </Button>
                          ))
                        ) : (
                          // For board piles, show single option
                          <Button
                            variant="outline"
                            size="sm"
                            className="mb-1 w-full"
                            onClick={() =>
                              handleMoveSingleCardToPile(
                                card,
                                targetPile.pile_id
                              )
                            }
                          >
                            {targetPile.pile_name ||
                              `Pile ${targetPile.pile_id}`}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      </div>

      {/* Move All Options */}
      {showMoveOptions && (
        <>
          {/* Move all to Deck Button */}
          {onMoveAllToDeck && (
            <Button onClick={onMoveAllToDeck} disabled={pileCards.length === 0}>
              Move All Cards to Deck and Shuffle
            </Button>
          )}

          {/* Move all to Other Piles */}
          {onMoveToOtherPile &&
            gameContext.discardPiles.map((targetPile) => (
              <div key={targetPile.pile_id}>
                {targetPile.is_player ? (
                  // For player piles, show option for each player
                  gameContext.sessionPlayers.map((player) => (
                    <Button
                      key={`${targetPile.pile_id}-${player.playerid}`}
                      variant="outline"
                      className="mb-2 w-full"
                      onClick={() =>
                        onMoveToOtherPile(targetPile.pile_id, player.playerid)
                      }
                      disabled={pileCards.length === 0}
                    >
                      Move All to {player.username}&apos;s{' '}
                      {targetPile.pile_name || 'Pile'}
                    </Button>
                  ))
                ) : (
                  // For board piles, show single option
                  <Button
                    variant="outline"
                    className="mb-2 w-full"
                    onClick={() => onMoveToOtherPile(targetPile.pile_id)}
                    disabled={pileCards.length === 0}
                  >
                    Move All to{' '}
                    {targetPile.pile_name || `Pile ${targetPile.pile_id}`}
                  </Button>
                )}
              </div>
            ))}
        </>
      )}
    </div>
  );
}
