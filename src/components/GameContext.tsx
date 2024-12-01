'use client'

import React, { createContext, useState, useContext, useEffect } from 'react'

interface CardInfo {
  name: string
  description: string
}

interface Player {
  username: string
  cards: number
  score: number
  isActive: boolean
  id: string
}

interface GameState {
  players: Player[]
  tokens: number
  currentTurn: string
  deck: number
}

interface GameContextType {
  revealedCard: CardInfo | null
  setRevealedCard: (card: CardInfo | null) => void
  gameState: GameState | null
  gameId: string | null
  subscribeToGame: (gameId: string) => void
  unsubscribeFromGame: () => void
}

const initialGameState: GameState = {
  players: [],
  tokens: 50,
  currentTurn: '',
  deck: 52
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [revealedCard, setRevealedCard] = useState<CardInfo | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [gameId, setGameId] = useState<string | null>(null)

  const subscribeToGame = (newGameId: string) => {
    setGameId(newGameId)
    setGameState(initialGameState) // Reset game state when subscribing to new game
  }

  const unsubscribeFromGame = () => {
    setGameId(null)
    setGameState(null)
  }

  // Simulate websocket connection and game state updates
  useEffect(() => {
    if (!gameId) return

    console.log(`Connecting to game ${gameId}...`)

    // Simulate initial game state
    setGameState({
      players: [
        { username: 'Alice', cards: 2, score: 0, isActive: true, id: "1" },
        { username: 'Bob', cards: 2, score: 3, isActive: true, id: "2" },
        { username: 'Charlie', cards: 2, score: 1, isActive: true, id: "3" },
        { username: 'David', cards: 2, score: 2, isActive: false, id: "4" },
        { username: 'Eve', cards: 2, score: 1, isActive: true, id: "5" }
      ],
      tokens: 50,
      currentTurn: 'Alice',
      deck: 52
    })

    // Simulate periodic game state updates
    const interval = setInterval(() => {
      setGameState(prev => {
        if (!prev) return prev
        return {
          ...prev,
          tokens: Math.max(0, prev.tokens - 1),
          players: prev.players.map(player => ({
            ...player,
            score: player.isActive ? player.score + Math.floor(Math.random() * 2) : player.score
          }))
        }
      })
    }, 5000)

    return () => {
      clearInterval(interval)
      console.log('Disconnecting from game...')
    }
  }, [gameId])

  return (
    <GameContext.Provider value={{ 
      revealedCard, 
      setRevealedCard, 
      gameState, 
      gameId,
      subscribeToGame,
      unsubscribeFromGame
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

