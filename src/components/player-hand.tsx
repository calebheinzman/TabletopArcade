'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useGame } from '@/components/GameContext'

interface CardInfo {
  id: number
  name: string
  description: string
  isRevealed?: boolean
}

interface PlayerData {
  userId: string
  playerName: string
  isHost: boolean
  cards: CardInfo[]
  points: number
}

export function PlayerHand({ player_id }: { player_id: string }) {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { setRevealedCard } = useGame()
  const playerNames = ['Alice', 'Bob', 'Charlie', 'David'] // Example player names

  useEffect(() => {
    const fetchPlayerHand = async () => {
      try {
        const response = await fetch(`/api/player-hand/${player_id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch player hand')
        }
        const data = await response.json()
        setPlayerData(data)
      } catch (error) {
        setError('Error fetching player data')
        console.error('Error fetching player hand:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlayerHand()
  }, [player_id])

  const handleReveal = (card: CardInfo, index: number) => {
    setRevealedCard(card)
    if (playerData) {
      const updatedCards = [...playerData.cards]
      updatedCards[index] = { ...card, isRevealed: true }
      setPlayerData({ ...playerData, cards: updatedCards })
    }
  }

  const handleDiscard = (index: number) => {
    if (playerData) {
      const updatedCards = playerData.cards.filter((_, i) => i !== index)
      setPlayerData({ ...playerData, cards: updatedCards })
    }
  }

  const drawCard = () => {
    // In a real implementation, this would call an API to draw a card
    console.log('Drawing a card')
  }

  const drawToken = () => {
    if (playerData) {
      setPlayerData({ ...playerData, points: playerData.points + 1 })
    }
  }

  const giveToken = (target: string) => {
    if (playerData && playerData.points > 0) {
      setPlayerData({ ...playerData, points: playerData.points - 1 })
      console.log(`Token given to ${target}`)
    }
  }

  if (isLoading) {
    return <div>Loading player hand...</div>
  }

  if (error || !playerData) {
    return <div>Error: {error || 'Failed to load player data'}</div>
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">{playerData.playerName}'s Hand</h2>
      <div className="flex flex-wrap gap-4 mb-6">
        {playerData.cards.map((card, index) => (
          <Dialog key={card.id}>
            <DialogTrigger asChild>
              <Card 
                className="w-32 h-48 bg-gray-200 shadow-md cursor-pointer hover:shadow-lg transition-shadow relative"
              >
                <CardContent className="flex items-center justify-center h-full">
                  <span className="text-lg font-semibold">{card.name}</span>
                  {card.isRevealed && (
                    <Badge className="absolute top-2 right-2" variant="secondary">
                      Revealed
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{card.name}</DialogTitle>
                <DialogDescription>{card.description}</DialogDescription>
              </DialogHeader>
              <div className="flex justify-between mt-4">
                <DialogClose asChild>
                  <Button onClick={() => handleReveal(card, index)} disabled={card.isRevealed}>
                    {card.isRevealed ? 'Already Revealed' : 'Reveal on Board'}
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="destructive" onClick={() => handleDiscard(index)}>Discard</Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-xl font-bold">Points: {playerData.points}</div>
        <div className="space-x-2">
          <Button onClick={drawCard}>Draw Card</Button>
          <Button onClick={drawToken}>Draw Token</Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button disabled={playerData.points === 0}>Give Token</Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="grid gap-2">
                {playerNames.map((name, index) => (
                  <Button key={index} onClick={() => giveToken(name)} size="sm">{name}</Button>
                ))}
                <Button onClick={() => giveToken('Board')} size="sm">Board</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}

