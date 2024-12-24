'use client';

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
  return (
    <div className="flex flex-wrap gap-2 justify-center overflow-auto max-h-[70vh]">
      {playerCards.map((card, index) => (
        <PlayerHandCard
          card={card}
          index={index}
          key={`player-hand-${card.sessioncardid}`}
          playerId={playerId}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
