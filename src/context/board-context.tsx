import { GameContextType, useGame } from '@/context/game-context';
import { passTurnToNextPlayer, pushPlayerAction } from '@/lib/supabase/player';
import { resetGame } from '@/lib/supabase/session';
import { Session, SessionPlayer } from '@/types/game-interfaces';
import React, {
  Dispatch,
  RefObject,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from 'react';
import { useFullScreen } from './fullscreen-context';

interface BoardContextProps {
  deckCount: number;
  players: SessionPlayer[];
  selectedPlayer: SessionPlayer | undefined;
  totalPlayers: number;
  isActionFeedOpen: boolean;
  gameContext: GameContextType;
  gamePoints: Session['num_points'];
  isHost: boolean;
  selectedPlayerId: SessionPlayer['playerid'] | undefined;
  onFullScreen: () => void;
  onDrawCard: (playerId: number, card_hidden: boolean) => void;
  onGivePoint: (playerId: number, quantity: number) => void;
  onDrawPoint: (playerId: number, quantity: number) => void;
  onDiscardCard: (
    playerId: number,
    sessionCardId: number,
    pileId?: number
  ) => void;
  onShuffle: () => void;
  onReset: () => void;
  onEndTurn: (playerId: number) => void;
  toggleActionFeed: () => void;
  onSelectPlayer: Dispatch<
    SetStateAction<SessionPlayer['playerid'] | undefined>
  >;
}

const BoardContext = createContext<BoardContextProps | undefined>(undefined);

export const useBoardContext = (): BoardContextProps => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardContext must be used within a BoardProvider');
  }
  return context;
};

export const BoardProvider: React.FC<{
  children: React.ReactNode;
  boardRef: RefObject<HTMLElement>;
}> = ({ children, boardRef }) => {
  const gameContext = useGame();
  const { toggleFullScreen } = useFullScreen();

  const [selectedPlayerId, setSelectedPlayerId] =
    useState<SessionPlayer['playerid']>();
  const [isHost] = useState(true); // TODO: Implement proper host check
  const [isActionFeedOpen, setIsActionFeedOpen] = useState(false);

  if (!gameContext) return <div>Loading...</div>;

  const sortedPlayers = [...gameContext.sessionPlayers].sort(
    (a, b) => (a.player_order || 0) - (b.player_order || 0)
  );

  const totalPlayers = sortedPlayers.length;

  const deckCount = gameContext.sessionCards.filter(
    (card) => card.cardPosition > 0
  ).length;
  const gamePoints = gameContext.session.num_points;

  const selectedPlayer = sortedPlayers.find(
    (player) => player.playerid === selectedPlayerId
  );

  const onDrawCard: BoardContextProps['onDrawCard'] = async (
    playerId,
    card_hidden
  ) => {
    try {
      await gameContext.drawCard(playerId, card_hidden);
    } catch (error) {
      console.error('Error drawing card:', error);
    }
  };

  const onGivePoint: BoardContextProps['onGivePoint'] = async (
    playerId,
    quantity
  ) => {
    try {
      await gameContext.givePoints(playerId, 'Board', quantity);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Gave ${quantity} point(s)`
      );
    } catch (error) {
      console.error('Error giving points:', error);
    }
  };

  const onDrawPoint: BoardContextProps['onDrawPoint'] = async (
    playerId,
    quantity
  ) => {
    try {
      await gameContext.drawPoints(playerId, quantity);
    } catch (error) {
      console.error('Error drawing point:', error);
    }
  };

  const onDiscardCard = async (
    playerId: number,
    sessionCardId: number,
    pileId?: number
  ) => {
    try {
      await gameContext.discardCard(playerId, sessionCardId, pileId);
    } catch (error) {
      console.error('Error discarding card:', error);
    }
  };

  const onShuffle = async () => {
    try {
      await gameContext.shuffleDeck();
    } catch (error) {
      console.error('Error shuffling deck:', error);
    }
  };

  const onReset: BoardContextProps['onReset'] = async () => {
    try {
      if (!gameContext) return;
      await resetGame(gameContext);
    } catch (error) {
      console.error('Error resetting game:', error);
    }
  };

  const onEndTurn: BoardContextProps['onEndTurn'] = async (
    playerId: number
  ) => {
    try {
      await passTurnToNextPlayer(gameContext.sessionid, playerId);
    } catch (error) {
      console.error('Error ending turn:', error);
    }
  };

  return (
    <BoardContext.Provider
      value={{
        deckCount,
        players: sortedPlayers,
        totalPlayers,
        isActionFeedOpen,
        gameContext,
        gamePoints,
        selectedPlayer,
        isHost,
        selectedPlayerId,
        onDrawPoint,
        onDiscardCard,
        onDrawCard,
        onFullScreen: () => toggleFullScreen(boardRef),
        onGivePoint,
        onReset,
        onShuffle,
        onEndTurn,
        toggleActionFeed: () => setIsActionFeedOpen((curr) => !curr),
        onSelectPlayer: setSelectedPlayerId,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
};
