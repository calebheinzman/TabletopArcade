'use client';
import RouterBackButton from '../router/router-back-button';
import { usePlayer } from './player-context';

const PlayerHeader = () => {
  const { player } = usePlayer();

  return (
    <header className="bg-white shadow-sm p-2 hidden md:block h-[10vh]">
      <div className="flex justify-between items-center w-full">
        <RouterBackButton />
        <h1 className="text-xl sm:text-2xl font-bold">
          {player?.username}&apos;s Hand
        </h1>
        <div className="w-[73px]"></div>
      </div>
    </header>
  );
};

export default PlayerHeader;
