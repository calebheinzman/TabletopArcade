// components/cards/board-card.tsx

'use client';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import useCardInteractions from '@/hooks/useCardInteractions';
import usePlayerCard from '@/hooks/usePlayerCard'; // <-- import the new hook
import { cn } from '@/lib/utils';
import { CardData, SessionCard, SessionPlayer } from '@/types/game-interfaces';
import Image from 'next/image';
import { useFullScreen } from '../../context/fullscreen-context';
import { Button } from '../ui/button';
import { CardBack, CardFront, PlayingCard } from '../ui/card';

interface BoardCardProps {
  index: number;
  card: SessionCard & CardData;
  player: SessionPlayer;
  baseSpacing: number;
  isLargeCard: boolean;
  size?: {
    fullscreen?: Record<'sm' | 'md' | 'lg' | 'xl', string>;
    normal?: Record<'sm' | 'md' | 'lg' | 'xl', string>;
  };
}

const BoardCard: React.FC<BoardCardProps> = ({
  index,
  card,
  player,
  baseSpacing,
  isLargeCard,
  size,
}) => {
  const { isFullScreen } = useFullScreen();
  const { onRevealCard, onDiscardCard, onPassCard, gameContext } =
    usePlayerCard(card); // <-- Use the new hook, passing `card`
  const {
    hoveredCardIndex,
    handleMouseEnter,
    handleMouseLeave,
    handleCardClick,
    getZIndex,
  } = useCardInteractions(player.playerid, gameContext);

  const isHovered = hoveredCardIndex === index;

  // Position logic (unchanged)
  let leftOffset = index * baseSpacing;
  if (hoveredCardIndex !== null) {
    const distance = Math.abs(index - hoveredCardIndex);
    const shift = 20 - distance * 5;
    if (index < hoveredCardIndex) {
      leftOffset -= shift;
    } else if (index > hoveredCardIndex) {
      leftOffset += shift;
    }
  }

  // Example default sizing logic (unchanged)...
  // Define default sizes and merge with custom sizes
  const defaultSizes = {
    fullscreen: {
      default: 'w-14 h-24',
      sm: 'sm:w-12 sm:h-16',
      md: 'md:w-16 md:h-20',
      lg: 'lg:w-24 lg:h-32',
      xl: 'xl:w-32 xl:h-40',
    },
    normal: {
      default: 'w-14 h-24',
      sm: 'sm:w-10 sm:h-14',
      md: 'md:w-12 md:h-16',
      lg: 'lg:w-20 lg:h-28',
      xl: 'xl:w-28 xl:h-36',
    },
  };

  const cardSizes = isFullScreen
    ? { ...defaultSizes.fullscreen, ...(size?.fullscreen ?? {}) }
    : { ...defaultSizes.normal, ...(size?.normal ?? {}) };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <PlayingCard
          card={card}
          className={cn(
            'absolute cursor-pointer border-none transition-all duration-200',
            isHovered && '-translate-y-2',
            cardSizes.default,
            cardSizes.sm,
            cardSizes.md,
            cardSizes.lg,
            cardSizes.xl
          )}
          style={{
            left: `${leftOffset}px`,
            zIndex: getZIndex(index),
          }}
          front={
            <CardFront>
              {/* Your front face logic, same as before */}
              <div className="relative w-full h-full">
                {card.front_img_url ? (
                  <>
                    <Image
                      src={card.front_img_url}
                      alt={card.name}
                      fill
                      className="object-cover rounded"
                    />
                    <div className="absolute bottom-0 w-full p-1 rounded-b bg-gradient-to-t from-black via-black/60 to-transparent text-white">
                      <h3 className="text-[10px] font-bold whitespace-normal break-words leading-tight">
                        {card.name}
                      </h3>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full p-2 bg-black text-white">
                    <span className="text-xs text-center break-words whitespace-normal leading-tight">
                      {card.name}
                    </span>
                  </div>
                )}
              </div>
            </CardFront>
          }
          back={
            <CardBack>
              {/* Your back face logic, same as before */}
              <div className="relative w-full h-full">
                {card.back_img_url ? (
                  <Image
                    src={card.back_img_url}
                    alt="Back"
                    fill
                    className="object-cover rounded"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full p-2">
                    <span className="text-xs text-center">Back</span>
                  </div>
                )}
              </div>
            </CardBack>
          }
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => handleCardClick(e, card)}
        />
      </DialogTrigger>

      {/* Dialog / Modal for card actions (reveal, discard, pass, etc.) */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{card.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4">
          <DialogClose asChild>
            <Button onClick={() => onRevealCard()}>
              {card.isRevealed ? 'Hide Card' : 'Reveal Card'}
            </Button>
          </DialogClose>

          {/* Discard Section */}
          {gameContext?.gameData?.can_discard && (
            <div className="flex flex-col gap-2">
              {gameContext.discardPiles.length > 0 ? (
                <>
                  <h4 className="text-sm font-semibold">Discard to:</h4>
                  {gameContext.discardPiles.map((pile) => {
                    if (pile.is_player) {
                      return gameContext.sessionPlayers.map((sessionPlayer) => (
                        <DialogClose
                          key={`${pile.pile_id}-${sessionPlayer.playerid}`}
                          asChild
                        >
                          <Button
                            variant="outline"
                            onClick={() =>
                              onDiscardCard(
                                pile.pile_id,
                                sessionPlayer.playerid
                              )
                            }
                          >
                            {`${sessionPlayer.username}'s Discard`}
                          </Button>
                        </DialogClose>
                      ));
                    } else {
                      return (
                        <DialogClose key={pile.pile_id} asChild>
                          <Button
                            variant="outline"
                            onClick={() => onDiscardCard(pile.pile_id)}
                          >
                            {pile.pile_name || `Discard Pile ${pile.pile_id}`}
                            {pile.is_face_up ? ' (Face Up)' : ' (Face Down)'}
                          </Button>
                        </DialogClose>
                      );
                    }
                  })}
                </>
              ) : (
                // If no discard piles, discard to deck
                <DialogClose asChild>
                  <Button variant="outline" onClick={() => onDiscardCard()}>
                    Discard to Deck
                  </Button>
                </DialogClose>
              )}
            </div>
          )}

          {/* Pass Card Section */}
          {gameContext?.gameData?.pass_cards && (
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold">Pass card to:</h4>
              {gameContext.sessionPlayers
                .filter(
                  (sessionPlayer) => sessionPlayer.playerid !== player.playerid
                )
                .map((targetPlayer) => (
                  <DialogClose key={targetPlayer.playerid} asChild>
                    <Button
                      variant="outline"
                      onClick={() => onPassCard(targetPlayer.playerid)}
                    >
                      Pass to {targetPlayer.username}
                    </Button>
                  </DialogClose>
                ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BoardCard;
