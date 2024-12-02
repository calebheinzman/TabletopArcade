import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function StartingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Welcome to Game Lobby</h1>
      <div className="flex flex-col space-y-4">
        <Link href="/join-game">
          <Button className="w-48">Join Game</Button>
        </Link>
        <Link href="/game-select">
          <Button className="w-48">Start Game</Button>
        </Link>
      </div>
    </div>
  );
}
