import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CardData, SessionCard } from '@/types/game-interfaces';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

const BoardCard = ({
  index,
  card,
  spacing = 55,
  handleCardClick,
  handleReveal,
}: {
  index: number;
  card: SessionCard & CardData;
  hoveredCardIndex?: number | null;
  spacing?: number;
  handleCardClick: (e: React.MouseEvent) => void;
  handleReveal: (sessionCardId: number) => void;
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card
          onClick={handleCardClick}
          isRevealed={card.isRevealed}
          className="w-16 h-24 cursor-pointer border-none relative"
          style={{ left: `${index * spacing}px` }}
          front={{
            content: (
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
            ),
            className: 'custom-front-class',
          }}
          back={{
            content: (
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
            ),
            className: 'custom-back-class',
          }}
        />
      </DialogTrigger>
      <DialogContent onClick={handleCardClick}>
        <DialogHeader>
          <DialogTitle>{card.name}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center mt-4">
          <DialogClose asChild>
            <Button onClick={() => handleReveal(card.sessioncardid)}>
              {card.isRevealed ? 'Hide Card' : 'Reveal Card'}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BoardCard;
