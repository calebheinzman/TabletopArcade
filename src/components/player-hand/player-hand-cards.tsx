'use client';

import usePlayerCards from '@/hooks/usePlayerCards';
import { CardData, SessionCard } from '@/types/game-interfaces';
import PlayerHandCard from '../cards/player-hand-card';

interface PlayerHandCardsProps {
  playerId: number;
  playerCards: (SessionCard & CardData)[];
  disabled: boolean;
}

export function PlayerHandCards({
  playerId,
  playerCards,
  disabled,
}: PlayerHandCardsProps) {
  const { handleReveal, handleDiscard, handlePassCard } = usePlayerCards(
    playerId,
    playerCards
  );

  return (
    <div className="flex flex-wrap gap-4 mb-8 justify-center">
      {playerCards.map((card, index) => (
        <PlayerHandCard
          card={card}
          index={index}
          key={`player-hand-${card.sessioncardid}`}
          playerId={playerId}
          onDiscard={handleDiscard}
          onReveal={handleReveal}
          onPassCard={handlePassCard}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
