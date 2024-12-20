import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GameContextType } from "@/components/GameContext";

interface PlayerHandCardDialogueProps {
  gameContext: GameContextType;
  playerId: number;
  card: {
    id: number;
    name: string;
    description: string;
    isRevealed: boolean;
  };
  disabled: boolean;
  onReveal: (playerId: number, cardId: number) => Promise<void>;
  onDiscard: (playerId: number, cardId: number, pileId?: number, targetPlayerId?: number) => Promise<void>;
  onPassCard: (playerId: number, cardId: number, targetPlayerId: number) => Promise<void>;
}

export function PlayerHandCardDialogue({
  gameContext,
  playerId,
  card,
  disabled,
  onReveal,
  onDiscard,
  onPassCard
}: PlayerHandCardDialogueProps) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{card.name}</DialogTitle>
        <DialogDescription>{card.description}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4 mt-4">
        {gameContext.gameData.can_reveal && (
          <DialogClose asChild>
            <Button
              onClick={() => onReveal(playerId, card.id)}
              disabled={disabled}
            >
              {card.isRevealed ? 'Unreveal Card' : 'Reveal on Board'}
            </Button>
          </DialogClose>
        )}
        
        {gameContext.gameData.can_discard && (
          <div className="flex flex-col gap-2">
            {gameContext.discardPiles.length > 0 ? (
              <>
                <h4 className="text-sm font-semibold">Discard to:</h4>
                {gameContext.discardPiles.map((pile) => {
                  if (pile.is_player) {
                    return gameContext.sessionPlayers.map(player => (
                      <DialogClose key={`${pile.pile_id}-${player.playerid}`} asChild>
                        <Button
                          variant="outline"
                          onClick={() => onDiscard(playerId, card.id, pile.pile_id, player.playerid)}
                        >
                          {player.playerid === playerId ? 'Your Pile' : `${player.username}'s Pile`}
                        </Button>
                      </DialogClose>
                    ));
                  } else {
                    return (
                      <DialogClose key={pile.pile_id} asChild>
                        <Button
                          variant="outline"
                          onClick={() => onDiscard(playerId, card.id, pile.pile_id)}
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
                  onClick={() => onDiscard(playerId, card.id)}
                >
                  Discard to Deck
                </Button>
              </DialogClose>
            )}
          </div>
        )}

        {gameContext.gameData.pass_cards && (
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold">Pass card to:</h4>
            {gameContext.sessionPlayers
              .filter(player => player.playerid !== playerId)
              .map(player => (
                <DialogClose key={player.playerid} asChild>
                  <Button
                    variant="outline"
                    onClick={() => onPassCard(playerId, card.id, player.playerid)}
                    disabled={disabled}
                  >
                    Pass to {player.username}
                  </Button>
                </DialogClose>
              ))}
          </div>
        )}
      </div>
    </DialogContent>
  );
}
