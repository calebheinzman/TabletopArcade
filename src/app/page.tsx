import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FaMobileAlt } from 'react-icons/fa';

export default function StartingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">
        <span className="hidden sm:inline">Welcome to </span>
        Game Lobby
      </h1>
      <div className="flex flex-col space-y-4">
        <Link href="/join-game">
          <Button className="w-48 relative">
            Join Game
            <FaMobileAlt className="absolute right-8 top-1/2 transform -translate-y-1/2" />
          </Button>
        </Link>
        <Link href="/game-select">
          <Button className="w-48 ">Start Game</Button>
        </Link>
      </div>
    </div>
  );
}
