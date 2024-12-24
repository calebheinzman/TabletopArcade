import { useBoardContext } from '../../context/board-context';
import BoardDiscardPile from './board-discard-pile';

const BoardDiscardPiles = () => {
  const { gameContext } = useBoardContext();
  return (
    <div className="flex space-x-4 items-center">
      {gameContext.discardPiles
        .filter((pile) => !pile.is_player)
        .map((pile) => (
          <BoardDiscardPile key={pile.pile_id} pile={pile} variant="board" />
        ))}
    </div>
  );
};

export default BoardDiscardPiles;
