'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

import { useState } from 'react';
import { addPlayer } from '@/lib/supabase';

interface PlayerInfo {
  playerId: number;
  userName: string;
  gameCode: number;
}

export default function JoinGamePage() {
  const [gameCode, setGameCode] = useState('');
  const [userName, setUserName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const joinGame = async () => {
    const numericGameCode = parseInt(gameCode);
    if (!numericGameCode || !userName) {
      alert('Please enter both game code and user name');
      return;
    }

    setIsJoining(true);

    try {
      // Add player to the game
      const { playerId, error } = await addPlayer(numericGameCode, userName);
      
      if (error) {
        alert(error);
        return;
      }

      if (!playerId) {
        alert('Failed to join game');
        return;
      }

      // Store player info in localStorage
      const playerInfo: PlayerInfo = {
        playerId: playerId,
        userName,
        gameCode: numericGameCode,
      };
      localStorage.setItem('playerInfo', JSON.stringify(playerInfo));

      // Navigate to waiting room
      router.push(
        `session/${numericGameCode}/waiting-room/?playerId=${playerId}&userName=${encodeURIComponent(userName)}`
      );
    } catch (error) {
      console.error('Error joining game:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await joinGame();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
      <Button onClick={() => router.back()} className="absolute top-4 left-4">
        Back
      </Button>
      <h1 className="text-4xl font-bold mb-8">Join Game</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Game Code
          </label>
          <Input
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value)}
            className="mt-1"
            placeholder="Enter game code"
            disabled={isJoining}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            User Name
          </label>
          <Input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="mt-1"
            placeholder="Enter your name"
            disabled={isJoining}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isJoining}>
          {isJoining ? 'Joining...' : 'Join Game'}
        </Button>
      </form>
    </div>
  );
}
