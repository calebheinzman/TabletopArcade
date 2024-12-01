import { NextResponse } from 'next/server'

interface Card {
  id: number
  name: string
  description: string
}

interface PlayerHand {
  userId: string
  playerName: string
  isHost: boolean
  cards: Card[]
  points: number
}

const coupCards: Card[] = [
  { id: 1, name: 'Duke', description: 'Take 3 coins from the treasury. Block foreign aid.' },
  { id: 2, name: 'Assassin', description: 'Pay 3 coins to assassinate another player\'s character.' },
  { id: 3, name: 'Captain', description: 'Steal 2 coins from another player. Block stealing.' },
  { id: 4, name: 'Ambassador', description: 'Draw 2 cards from the Court (deck), choose which (if any) to exchange with your face-down cards.' },
  { id: 5, name: 'Contessa', description: 'Block assassination attempts.' },
]

const mockDatabase: Record<string, PlayerHand> = {
  '1': {
    userId: '1',
    playerName: 'Alice',
    isHost: true,
    cards: [coupCards[0], coupCards[1]],
    points: 2,
  },
  '2': {
    userId: '2',
    playerName: 'Bob',
    isHost: false,
    cards: [coupCards[2], coupCards[3]],
    points: 2,
  },
  '3': {
    userId: '3',
    playerName: 'Charlie',
    isHost: false,
    cards: [coupCards[4], coupCards[0]],
    points: 2,
  },
}

export async function GET(
  request: Request,
  { params }: { params: { player_id: string } }
) {
  const player_id = params.player_id

  if (!player_id) {
    return NextResponse.json({ error: 'Player ID is required' }, { status: 400 })
  }

  const playerHand = mockDatabase[player_id]

  if (!playerHand) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }

  return NextResponse.json(playerHand)
}

