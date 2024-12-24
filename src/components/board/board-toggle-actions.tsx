import { useBoardContext } from '../../providers/board-provider';
import { Button } from '../ui/button';

const BoardToggleActions = () => {
  const { toggleActionFeed, isActionFeedOpen } = useBoardContext();
  return (
    <Button
      size="sm"
      variant="outline"
      className="absolute top-2 right-2 z-10"
      onClick={toggleActionFeed}
    >
      {isActionFeedOpen ? 'Hide Actions' : 'Show Actions'}
    </Button>
  );
};

export default BoardToggleActions;
