'use client';

import BoardDiscardPile from '@/components/board/board-discard-pile';
import usePlayerCards from '@/hooks/usePlayerCards';
import usePlayerPosition from '@/hooks/usePlayerPosition';
import usePlayerStatus from '@/hooks/usePlayerStatus';
import { SessionCard, SessionPlayer } from '@/types/game-interfaces';
import { FC } from 'react';
import { TbCards, TbCoin, TbPlugConnectedX } from 'react-icons/tb';
import BoardCard from '../cards/board-card';
import { useGame } from '../GameContext';

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
  const gameContext = useGame();
  const position = usePlayerPosition(index, totalPlayers);
  const { active } = usePlayerStatus({ player });
  const {
    playerCards,
    handleCardClick,
    handleReveal,
    handleMouseEnter,
    handleMouseLeave,
    getCardStyle,
    handleDiscard,
    handlePassCard,
    getZIndex,
    baseSpacing,
    hoveredCardIndex,
    isOverflowing,
    isLargeCard,
    revealedCards,
    playerDiscardPiles,
  } = usePlayerCards(player.playerid, cards);

  return (
    <div
      className="flex flex-col items-center text-center absolute transform -translate-x-1/2 -translate-y-1/2"
      style={position}
    >
      {/* Player Info */}
      <div
        onClick={() => onSelect(player.playerid)}
        className={`
          mb-1 bg-white rounded-lg shadow-md p-1 cursor-pointer
          ${gameContext.gameData.turn_based && player.is_turn ? 'bg-yellow-50' : ''} 
          hover:bg-yellow-100
        `}
      >
        <div
          className={`text-sm font-semibold flex flex-col gap-1 ${
            active && active ? 'text-green-600' : 'text-red-600'
          }`}
        >
          <div className="flex items-center justify-center">
            {player.username}
            {(!active || !active) && (
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

      {playerCards.length > 0 && (
        <div className="relative flex flex-col justify-center items-center mt-1 mb-2">
          {/* Main hand - adjust positioning based on player location */}
          <div
            className="relative"
            style={{
              width: `${
                isOverflowing
                  ? (playerCards.length - 1) * 8 + 48 + 80 // 80px total padding
                  : playerCards.length * baseSpacing
              }px`,
              height: '80px',
              left: isOverflowing
                ? position.left && position.left.toString().includes('-')
                  ? '-80px' // For left side of board
                  : position.top === '50%'
                    ? '0px' // For top/bottom of board
                    : '80px' // For right side of board
                : '0px',
              transform: 'none',
            }}
          >
            {playerCards.map((card, cardIndex) => (
              <BoardCard
                key={`card-${card.sessioncardid}-not-revealed`}
                index={cardIndex}
                card={card}
                hoveredCardIndex={hoveredCardIndex}
                spacing={baseSpacing}
                handleMouseEnter={handleMouseEnter}
                handleMouseLeave={handleMouseLeave}
                handleCardClick={handleCardClick}
                handleReveal={handleReveal}
                handleDiscard={handleDiscard}
                handlePassCard={handlePassCard}
                gameContext={gameContext}
                player={player}
                getZIndex={getZIndex}
                isLargeCard={isLargeCard}
                baseSpacing={baseSpacing}
              />
            ))}
          </div>

          {/* Revealed cards section when overflowing */}
          {isOverflowing && revealedCards.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-[300px]">
              {playerCards
                .filter((card) => revealedCards.includes(card.sessioncardid))
                .map((card, cardIndex) => (
                  <BoardCard
                    key={`card-${card.sessioncardid}-revealed`}
                    index={cardIndex}
                    card={card}
                    hoveredCardIndex={hoveredCardIndex}
                    spacing={baseSpacing}
                    handleMouseEnter={handleMouseEnter}
                    handleMouseLeave={handleMouseLeave}
                    handleCardClick={handleCardClick}
                    handleReveal={handleReveal}
                    handleDiscard={handleDiscard}
                    handlePassCard={handlePassCard}
                    gameContext={gameContext}
                    player={player}
                    getZIndex={getZIndex}
                    isLargeCard={isLargeCard}
                    baseSpacing={baseSpacing}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {playerDiscardPiles.length > 0 && (
        <div
          className={`${playerCards.length === 0 ? 'mt-1' : 'mt-2'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-4">
            {playerDiscardPiles.map((pile) => (
              <BoardDiscardPile
                key={pile.pile_id}
                pile={pile}
                playerId={player.playerid}
                className="w-14 h-20"
                variant="player"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardPlayerHand;
