'use client';

import { CardData, SessionCard, SessionPlayer } from '@/types/game-interfaces';
import Image from 'next/image';
import { PlayerHandCardDialogue } from '../player-hand/player-hand-card-dialogue';
import { CardBack, CardFront, PlayingCard } from '../ui/card';
import { Dialog, DialogTrigger } from '../ui/dialog';

const PlayerHandCard = ({
  card,
  index,
  disabled,
}: {
  card: SessionCard & CardData;
  index: number;
  playerId: SessionPlayer['playerid'];
  disabled: boolean;
}) => {
  return (
    <Dialog key={`${card.cardid}-${index}`}>
      <DialogTrigger asChild>
        <PlayingCard
          card={card}
          className="relative w-32 h-40 xs:w-24 xs:h-32 md:w-40 md:h-48 lg:w-48 lg:h-54 xl:h-80 xl:w-72 cursor-pointer border-none transition-all duration-200"
          front={
            <CardFront>
              <div className="relative w-full h-full">
                {card.front_img_url ? (
                  <Image
                    src={card.front_img_url}
                    alt={card.name}
                    fill
                    className="object-fill rounded"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full p-2 bg-black text-white">
                    <span className="text-xs text-center break-words whitespace-normal leading-tight">
                      Front
                    </span>
                  </div>
                )}
                {/* Name always visible */}
                <div className="absolute bottom-0 w-full p-1 bg-black/50 text-white text-center text-[10px] font-bold truncate">
                  {card.name}
                </div>
                {/* Not Revealed Flag */}
                <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] px-2 py-1 rounded shadow">
                  Revealed
                </div>
              </div>
            </CardFront>
          }
          back={
            <CardBack>
              <div className="relative w-full h-full">
                {card.front_img_url ? (
                  <Image
                    src={card.front_img_url}
                    alt="Revealed"
                    fill
                    className="object-fill rounded"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full p-2">
                    <span className="text-xs text-center">Back</span>
                  </div>
                )}
                {/* Name always visible */}
                <div className="absolute bottom-0 w-full p-1 bg-black/50 text-white text-center text-[10px] font-bold truncate">
                  {card.name}
                </div>
                {/* Revealed Flag */}
                <div className="absolute top-2 right-2 bg-gray-500 text-white text-[10px] px-2 py-1 rounded shadow">
                  Not Revealed
                </div>
              </div>
            </CardBack>
          }
        />
      </DialogTrigger>
      <PlayerHandCardDialogue card={card} disabled={disabled} />
    </Dialog>
  );
};

export default PlayerHandCard;
