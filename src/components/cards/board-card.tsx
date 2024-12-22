'use client';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CardData,
  DiscardPile,
  SessionCard,
  SessionPlayer,
} from '@/types/game-interfaces';
import Image from 'next/image';
import { Button } from '../ui/button';
import { CardBack, CardFront, PlayingCard } from '../ui/card';

const BoardCard = ({
  index,
  card,
  hoveredCardIndex,
  spacing = 55,
  handleMouseEnter,
  handleMouseLeave,
  handleCardClick,
  handleReveal,
  handleDiscard,
  handlePassCard,
  gameContext,
  player,
  getZIndex,
  isLargeCard,
  baseSpacing,
}: {
  index: number;
  card: SessionCard & CardData;
  hoveredCardIndex: number | null;
  spacing?: number;
  handleMouseEnter: (index: number) => void;
  handleMouseLeave: () => void;
  handleCardClick: (e: React.MouseEvent, card: SessionCard & CardData) => void;
  handleReveal: (sessionCardId: number) => void;
  handleDiscard: (
    playerId: number,
    cardId: number,
    pileId?: number,
    targetPlayerId?: number
  ) => void;
  handlePassCard: (
    fromPlayerId: number,
    cardId: number,
    targetPlayerId: number
  ) => void;
  gameContext: any; // Replace `any` with the actual type of `gameContext`
  player: any; // Replace `any` with the actual type of `player`
  getZIndex: (index: number) => number;
  isLargeCard: boolean;
  baseSpacing: number;
}) => {
  const isHovered = hoveredCardIndex === index;

  // Adjust positions to create spacing when hovering a card
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <PlayingCard
          card={card}
          className={`
            absolute w-16 h-24 md:w-24 md:h-32 lg:w-32 lg:h-40 xl:w-40 xl:h-48 cursor-pointer border-none transition-all duration-200
            ${isHovered ? '-translate-y-2' : ''}
          `}
          style={{
            left: `${leftOffset}px`,
            zIndex: getZIndex(index),
          }}
          front={
            <CardFront>
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
        />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{card.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          <DialogClose asChild>
            <Button onClick={() => handleReveal(card.sessioncardid)}>
              {card.isRevealed ? 'Hide Card' : 'Reveal Card'}
            </Button>
          </DialogClose>

          {gameContext?.gameData?.can_discard && (
            <div className="flex flex-col gap-2">
              {gameContext.discardPiles.length > 0 ? (
                <>
                  <h4 className="text-sm font-semibold">Discard to:</h4>
                  {gameContext.discardPiles.map((pile: DiscardPile) => {
                    if (pile.is_player) {
                      return gameContext.sessionPlayers.map(
                        (sessionPlayer: SessionPlayer) => (
                          <DialogClose
                            key={`${pile.pile_id}-${sessionPlayer.playerid}`}
                            asChild
                          >
                            <Button
                              variant="outline"
                              onClick={() =>
                                handleDiscard(
                                  player.playerid,
                                  card.sessioncardid,
                                  pile.pile_id,
                                  sessionPlayer.playerid
                                )
                              }
                            >
                              {`${sessionPlayer.username}'s Discard`}
                            </Button>
                          </DialogClose>
                        )
                      );
                    } else {
                      return (
                        <DialogClose key={pile.pile_id} asChild>
                          <Button
                            variant="outline"
                            onClick={() =>
                              handleDiscard(
                                player.playerid,
                                card.sessioncardid,
                                pile.pile_id
                              )
                            }
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
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleDiscard(player.playerid, card.sessioncardid)
                    }
                  >
                    Discard to Deck
                  </Button>
                </DialogClose>
              )}
            </div>
          )}

          {gameContext?.gameData.pass_cards && (
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold">Pass card to:</h4>
              {gameContext.sessionPlayers
                .filter(
                  (sessionPlayer: SessionPlayer) =>
                    sessionPlayer.playerid !== player.playerid
                )
                .map((targetPlayer: SessionPlayer) => (
                  <DialogClose key={targetPlayer.playerid} asChild>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handlePassCard(
                          player.playerid,
                          card.sessioncardid,
                          targetPlayer.playerid
                        )
                      }
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
