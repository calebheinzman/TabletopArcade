'use client';

import usePlayerCards from '@/hooks/usePlayerCards';
import usePlayerPosition from '@/hooks/usePlayerPosition';
import usePlayerStatus from '@/hooks/usePlayerStatus';
import { SessionCard, SessionPlayer } from '@/types/game-interfaces';
import { FC, useEffect, useState } from 'react';
import { TbCards, TbCoin, TbPlugConnectedX } from 'react-icons/tb';
import BoardCard from '../cards/board-card';

interface BoardPlayerHandProps {
  player: SessionPlayer;
  index: number;
  totalPlayers: number;
  onSelect: (playerId: number) => void;
  cards: SessionCard[];
}

const BoardPlayerHand: FC<BoardPlayerHandProps> = ({
  player,
  index,
  totalPlayers,
  onSelect,
  cards,
}) => {
  const position = usePlayerPosition(index, totalPlayers);
  const { active } = usePlayerStatus({ player });

  const {
    playerCards,
    handleCardClick,
    handleReveal,
    handleMouseEnter,
    handleMouseLeave,
    getCardStyle,
    overlapping,
    baseSpacing,
  } = usePlayerCards(player, cards);

  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    const checkActivity = () => {
      const lastAction = new Date(player.time_last_action).getTime();
      const now = new Date().getTime();
      const timeDiff = now - lastAction;
      setIsActive(timeDiff <= 30000); // 30 seconds inactivity threshold
    };

    checkActivity();
    const interval = setInterval(checkActivity, 1000);
    return () => clearInterval(interval);
  }, [player.time_last_action]);

  return (
    <div
      onClick={() => onSelect(player.playerid)}
      style={position}
      className="flex flex-col items-center text-center cursor-pointer absolute transform -translate-x-1/2 -translate-y-1/2"
    >
      {/* Player Info */}
      <div
        className={`mb-2 bg-white rounded-lg shadow-md p-2 ${
          player.is_turn ? 'bg-yellow-50' : ''
        } hover:bg-yellow-100`}
        style={{ marginTop: '20px', marginBottom: '20px' }}
      >
        <div
          className={`text-sm font-semibold flex flex-col gap-1 ${
            active && isActive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          <div className="flex items-center justify-center">
            {player.username}
            {(!active || !isActive) && (
              <div className="ml-1 mr-1">
                <TbPlugConnectedX size={14} />
              </div>
            )}
          </div>
          <div className="flex items-center justify-center text-xs text-gray-600">
            <div className="mr-1">
              <TbCards size={12} />
            </div>
            <span className="mr-2">{playerCards.length}</span>
            <div className="mr-1">
              <TbCoin size={12} />
            </div>
            <span>{player.num_points || 0}</span>
          </div>
        </div>
      </div>

      <div className="relative flex justify-center items-center mt-2">
        <div
          className="relative"
          style={{
            width: `${overlapping ? (playerCards.length - 1) * 20 + 56 : playerCards.length * 56}px`,
            height: '80px',
          }}
        >
          {playerCards.map((card, cardIndex) => {
            const cardStyle = getCardStyle(cardIndex);
            return (
              <div
                key={`card-${card.sessioncardid}-${card.cardid}`}
                onMouseEnter={() => handleMouseEnter(cardIndex)}
                onMouseLeave={handleMouseLeave}
                style={{
                  position: 'absolute',
                  ...cardStyle,
                }}
              >
                <BoardCard
                  card={card}
                  index={cardIndex}
                  hoveredCardIndex={null} // Not needed since logic is now handled in the hook
                  handleCardClick={handleCardClick}
                  handleReveal={handleReveal}
                  spacing={baseSpacing}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BoardPlayerHand;
