import { useBoardContext } from './board-context';

const BoardGamePoints = () => {
  const { gamePoints } = useBoardContext();

  if (gamePoints <= 0) return null;

  return (
    <div className="absolute top-4 left-4 bg-yellow-400 text-black px-4 py-2 rounded-full text-sm sm:text-base font-bold">
      Points: {gamePoints}
    </div>
  );
};

export default BoardGamePoints;
