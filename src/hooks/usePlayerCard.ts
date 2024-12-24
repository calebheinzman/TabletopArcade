// hooks/usePlayerCard.ts

import { useGame } from '@/context/game-context';
import { CardData, SessionCard, SessionPlayer } from '@/types/game-interfaces';

// Hook to handle player card actions.
const usePlayerCard = ({ sessioncardid, playerid }: SessionCard & CardData) => {
  const gameContext = useGame();
  const { revealCard, discardCard, passCard } = gameContext;

  const onRevealCard = () => revealCard(playerid, sessioncardid);

  const onDiscardCard = (
    pileId?: SessionCard['pile_id'],
    targetPlayerId?: SessionPlayer['playerid']
  ) => discardCard(playerid, sessioncardid, pileId, targetPlayerId);

  const onPassCard = (targetPlayerId: SessionPlayer['playerid']) =>
    passCard(playerid, sessioncardid, targetPlayerId);

  return {
    onRevealCard,
    onDiscardCard,
    onPassCard,
    gameContext, // if you need additional context data
  };
};

export default usePlayerCard;
