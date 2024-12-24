// components/board/board-discard-pile.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ViewDiscardCards } from '@/components/view-discard-cards';
import { useGame } from '@/providers/game-provider';
import { DiscardPile } from '@/types/game-interfaces';
import React from 'react';

interface BoardDiscardPileProps {
  pile: DiscardPile;
  playerId?: number;
  className?: string;
  variant?: 'board' | 'player';
}

const BoardDiscardPile: React.FC<BoardDiscardPileProps> = ({
  pile,
  playerId,
  className = '',
  variant = 'board',
}) => {
  const gameContext = useGame();

  // Get all cards in this pile
  const pileCards = gameContext.sessionCards
    .filter((card) => {
      if (pile.is_player) {
        return card.pile_id === pile.pile_id && card.playerid === playerId;
      } else {
        return card.pile_id === pile.pile_id;
      }
    })
    .sort((a, b) => a.cardPosition - b.cardPosition);

  // Get the top card
  const topCard = pileCards[0];

  // Find the card details if we have a top card
  let topCardDetails;
  if (topCard) {
    const deck = gameContext.decks.find((d) => d.deckid === topCard.deckid);
    topCardDetails = deck?.cards.find((c) => c.cardid === topCard.cardid);
  }

  const handleMoveAllToDeck = async () => {
    try {
      // Get max position in deck
      const maxDeckPosition = Math.max(
        ...gameContext.sessionCards
          .filter((card) => card.cardPosition > 0 && !card.pile_id)
          .map((card) => card.cardPosition),
        0
      );

      // Create updates for all cards in pile
      const updates = pileCards.map((card, index) => ({
        sessionid: gameContext.sessionid,
        sessioncardid: card.sessioncardid,
        cardPosition: maxDeckPosition + index + 1,
        playerid: null,
        pile_id: null,
        isRevealed: false,
      }));

      // First update the cards
      await gameContext.updateSessionCards(updates);

      // Then shuffle the deck
      await gameContext.shuffleDeck();
    } catch (error) {
      console.error('Error moving cards to deck:', error);
    }
  };

  const handleMoveToOtherPile = async (
    targetPileId: number,
    targetPlayerId?: number
  ) => {
    try {
      const targetPile = gameContext.discardPiles.find(
        (p) => p.pile_id === targetPileId
      );
      if (!targetPile) return;

      // Get existing cards in target pile
      const existingCards = gameContext.sessionCards.filter((card) => {
        if (targetPile.is_player) {
          return (
            card.pile_id === targetPileId && card.playerid === targetPlayerId
          );
        } else {
          return card.pile_id === targetPileId;
        }
      });

      // Create updates for all cards
      const updates = pileCards.map((card, index) => ({
        sessionid: gameContext.sessionid,
        sessioncardid: card.sessioncardid,
        cardPosition: existingCards.length + index + 1,
        playerid: targetPile.is_player ? (targetPlayerId ?? null) : null,
        pile_id: targetPileId,
        isRevealed: targetPile.is_face_up,
      }));

      await gameContext.updateSessionCards(updates);
    } catch (error) {
      console.error('Error moving cards to other pile:', error);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!gameContext.gameData.can_discard) return;

    const sessionCardId = e.dataTransfer.getData('sessionCardId');
    const playerId = e.dataTransfer.getData('playerId');

    if (sessionCardId && playerId) {
      try {
        await gameContext.discardCard(
          parseInt(playerId),
          parseInt(sessionCardId),
          pile.pile_id
        );
      } catch (error) {
        console.error('Error discarding card to pile:', error);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (gameContext.gameData.can_discard) {
      e.preventDefault();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`
            ${variant === 'board' ? 'w-16 h-24 sm:w-18 sm:h-26 md:w-20 md:h-28' : className}
            rounded-lg 
            ${pile.is_face_up && !pile.hide_values && pileCards.length > 0 ? '' : 'border-2 border-gray-300 bg-white'}
            ${pileCards.length === 0 ? 'border-2 border-dashed border-gray-300 bg-gray-50 hover:shadow-md' : ''} 
            flex flex-col items-center justify-center
            transition-all
            relative
            ${gameContext.gameData.can_discard ? 'cursor-pointer' : 'cursor-not-allowed'}
          `}
        >
          {pile.is_face_up && !pile.hide_values && pileCards.length > 0 ? (
            <div
              className="relative w-full h-full"
              style={{ marginLeft: '3rem' }}
            >
              {pileCards.map((card, index) => {
                const deck = gameContext.decks.find(
                  (d) => d.deckid === card.deckid
                );
                const cardDetails = deck?.cards.find(
                  (c) => c.cardid === card.cardid
                );

                return (
                  <div
                    key={card.sessioncardid}
                    className="absolute inset-0 bg-white border rounded-lg shadow-sm"
                    style={{
                      transform: `rotate(${(index - (pileCards.length - 1) / 2) * 25}deg) translateX(${index * 25}%) translateY(${index * -10}%)`,
                      zIndex: index + 1,
                      left: '1rem',
                    }}
                  >
                    {cardDetails && (
                      <div className="text-xs font-medium text-gray-800 p-2">
                        {cardDetails.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-2">
              {pileCards.length > 0 ? (
                <div className="space-y-1">
                  {pile.is_face_up && topCardDetails && (
                    <div className="text-xs font-medium text-gray-800 overflow-hidden text-ellipsis">
                      {topCardDetails.name}
                    </div>
                  )}
                  <div className="text-sm font-medium text-gray-600">
                    {pileCards.length}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-400">Empty</div>
              )}
            </div>
          )}
        </div>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {pile.pile_name || `Discard Pile ${pile.pile_id}`}
          </DialogTitle>
          <DialogDescription>
            {pileCards.length} card{pileCards.length !== 1 ? 's' : ''} in pile
          </DialogDescription>
        </DialogHeader>

        <ViewDiscardCards
          gameContext={gameContext}
          pileCards={pileCards}
          onMoveAllToDeck={handleMoveAllToDeck}
          onMoveToOtherPile={handleMoveToOtherPile}
        />
      </DialogContent>
    </Dialog>
  );
};

export default BoardDiscardPile;
