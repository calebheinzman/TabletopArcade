import { Button } from '../ui/button';
import { useBoardContext } from './board-context';

type Props = {};

const BoardToggleActions = (props: Props) => {
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
