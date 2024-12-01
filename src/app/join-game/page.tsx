'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PlayerInfo {
  playerId: string;
  userName: string;
  gameCode: string;
}

export default function JoinGamePage() {
  const [gameCode, setGameCode] = useState('')
  const [userName, setUserName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const router = useRouter()

  const joinGame = async () => {
    if (!gameCode || !userName) {
      alert('Please enter both game code and user name')
      return
    }

    setIsJoining(true)

    try {
      const response = await fetch(`/api/games/${gameCode}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName }),
      })

      if (!response.ok) {
        throw new Error('Failed to join game')
      }

      const data = await response.json()
      
      // Store player info in localStorage
      const playerInfo: PlayerInfo = {
        playerId: data.playerId,
        userName,
        gameCode
      }
      localStorage.setItem('playerInfo', JSON.stringify(playerInfo))

      // Pass info through URL params as well
      router.push(`/waiting-room/${gameCode}?playerId=${data.playerId}&userName=${encodeURIComponent(userName)}`)
    } catch (error) {
      console.error('Error joining game:', error)
      alert('Failed to join game. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
      <Button onClick={() => router.back()} className="absolute top-4 left-4">Back</Button>
      <h1 className="text-4xl font-bold mb-8">Join Game</h1>
      <div className="bg-white p-8 rounded-lg shadow-md w-96 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Game Code</label>
          <Input 
            value={gameCode} 
            onChange={(e) => setGameCode(e.target.value)} 
            className="mt-1"
            placeholder="Enter game code"
            disabled={isJoining}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">User Name</label>
          <Input 
            value={userName} 
            onChange={(e) => setUserName(e.target.value)} 
            className="mt-1"
            placeholder="Enter your name"
            disabled={isJoining}
          />
        </div>
        <Button 
          onClick={joinGame} 
          className="w-full"
          disabled={isJoining}
        >
          {isJoining ? 'Joining...' : 'Join Game'}
        </Button>
      </div>
    </div>
  )
}

