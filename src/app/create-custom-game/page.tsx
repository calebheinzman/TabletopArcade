'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { CardData, DeckData, gameActions } from '@/lib/supabase';
import { X } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface CustomCard {
  name: string;
  count: number;
  description: string;
  deckName: string;
}

interface Deck {
  name: string;
}

export default function CreateCustomGamePage() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([{ name: 'Default Deck' }]);
  const [newDeck, setNewDeck] = useState('');
  const [cards, setCards] = useState<CustomCard[]>([]);
  const [newCard, setNewCard] = useState<CustomCard>({
    name: '',
    count: 1,
    description: '',
    deckName: 'Default Deck',
  });
  const [name, setName] = useState('Custom Game');
  const [tokens, setTokens] = useState(0);
  const [dice, setDice] = useState(0);
  const [players, setPlayers] = useState(2);
  const [startingCards, setStartingCards] = useState(2);
  const [canDiscardCard, setCanDiscardCard] = useState(false);
  const [canRevealCard, setCanRevealCard] = useState(false);
  const [canGiveToken, setCanGiveToken] = useState(false);
  const [canGiveCard, setCanGiveCard] = useState(false);
  const [canDrawCard, setCanDrawCard] = useState(false);
  const [canDrawToken, setCanDrawToken] = useState(false);
  const [faceUpBoardDiscardPiles, setFaceUpBoardDiscardPiles] = useState({
    rows: 1,
    columns: 1,
  });
  const [faceDownBoardDiscardPiles, setFaceDownBoardDiscardPiles] = useState({
    rows: 1,
    columns: 1,
  });
  const [faceUpPlayerDiscardPiles, setFaceUpPlayerDiscardPiles] = useState({
    rows: 1,
    columns: 1,
  });
  const [faceDownPlayerDiscardPiles, setFaceDownPlayerDiscardPiles] = useState({
    rows: 1,
    columns: 1,
  });

  const addDeck = () => {
    if (newDeck.trim()) {
      setDecks([...decks, { name: newDeck.trim() }]);
      setNewDeck('');
    }
  };

  const deleteDeck = (deckName: string) => {
    setDecks(decks.filter((deck) => deckName !== deck.name));
    setCards(cards.filter((card) => card.deckName !== deckName));
  };

  const addCard = () => {
    if (newCard.name && newCard.count > 0) {
      setCards([...cards, newCard]);
      setNewCard({
        name: '',
        count: 1,
        description: '',
        deckName: newCard.deckName,
      });
    }
  };

  const deleteCard = (index: number) => {
    setCards(cards.filter((_, i) => i !== index));
  };

  const createGame = async () => {
    const gameData = {
      name,
      num_tokens: tokens,
      num_dice: dice,
      num_players: players,
      starting_num_cards: startingCards,
      can_discard: canDiscardCard,
      can_reveal: canRevealCard,
      can_give_tokens: canGiveToken,
      can_give_cards: canGiveCard,
      can_draw_cards: canDrawCard,
      can_draw_tokens: canDrawToken,
      face_up_board_discard_piles_row: faceUpBoardDiscardPiles.rows,
      face_up_board_discard_piles_columbs: faceUpBoardDiscardPiles.columns,
      face_down_board_discard_piles_row: faceDownBoardDiscardPiles.rows,
      face_down_board_discard_piles_columbs: faceDownBoardDiscardPiles.columns,
      face_up_player_discard_piles_row: faceUpPlayerDiscardPiles.rows,
      face_up_player_discard_piles_columbs: faceUpPlayerDiscardPiles.columns,
      face_down_player_discard_piles_row: faceDownPlayerDiscardPiles.rows,
      face_down_player_discard_piles_columbs:
        faceDownPlayerDiscardPiles.columns,
    };

    const deckData: DeckData[] = decks.map((deck) => ({
      deckname: deck.name,
      num_cards: cards
        .filter((card) => card.deckName === deck.name)
        .reduce((sum, card) => sum + card.count, 0),
      gameid: 0,
    }));

    const cardData: CardData[][] = decks.map((deck) =>
      cards
        .filter((card) => card.deckName === deck.name)
        .map((card) => ({
          name: card.name,
          count: card.count,
          description: card.description,
          deckName: deck.name,
        }))
    );

    try {
      const result = await gameActions.createCustomGame(
        gameData,
        deckData,
        cardData
      );
      if (result.success) {
        console.log('Game created successfully:', result.gameId);
        router.push('/game-select');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-4">
      <Button onClick={() => router.back()} className="absolute top-4 left-4">
        Back
      </Button>
      <h1 className="text-4xl font-bold mb-8">Create Custom Game</h1>

      <div className="w-full max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Game Name</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter game name"
              className="mb-4"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Decks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 mb-4">
              <Input
                value={newDeck}
                onChange={(e) => setNewDeck(e.target.value)}
                placeholder="Enter deck name"
              />
              <Button onClick={addDeck}>Add Deck</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {decks.map((deck) => (
                <Card key={deck.name}>
                  <CardContent className="p-4 relative">
                    {deck.name !== 'Default Deck' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => deleteDeck(deck.name)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <h3 className="font-bold">{deck.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cardName">Card Name</Label>
                <Input
                  id="cardName"
                  value={newCard.name}
                  onChange={(e) =>
                    setNewCard({ ...newCard, name: e.target.value })
                  }
                  placeholder="Enter card name"
                />
              </div>
              <div>
                <Label htmlFor="cardCount">Number of Cards</Label>
                <Input
                  id="cardCount"
                  type="number"
                  value={newCard.count}
                  onChange={(e) =>
                    setNewCard({ ...newCard, count: parseInt(e.target.value) })
                  }
                  min={1}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="cardDescription">Card Description</Label>
                <Textarea
                  id="cardDescription"
                  value={newCard.description}
                  onChange={(e) =>
                    setNewCard({ ...newCard, description: e.target.value })
                  }
                  placeholder="Enter card description"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="cardDeck">Deck</Label>
                <Select
                  value={newCard.deckName}
                  onValueChange={(value) =>
                    setNewCard({ ...newCard, deckName: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a deck" />
                  </SelectTrigger>
                  <SelectContent>
                    {decks.map((deck) => (
                      <SelectItem key={deck.name} value={deck.name}>
                        {deck.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={addCard} className="mt-4">
              Add Card
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Created Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((card, index) => (
                <Card key={index}>
                  <CardContent className="p-4 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => deleteCard(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <h3 className="font-bold">{card.name}</h3>
                    <p>Count: {card.count}</p>
                    <p className="text-sm text-gray-600">{card.description}</p>
                    <p className="text-sm text-gray-400">
                      Deck: {card.deckName}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Game Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tokens">Number of Tokens</Label>
                <Input
                  id="tokens"
                  type="number"
                  value={tokens}
                  onChange={(e) => setTokens(parseInt(e.target.value))}
                  min={0}
                />
              </div>
              <div>
                <Label htmlFor="dice">Number of Dice</Label>
                <Input
                  id="dice"
                  type="number"
                  value={dice}
                  onChange={(e) => setDice(parseInt(e.target.value))}
                  min={0}
                />
              </div>
              <div>
                <Label htmlFor="players">Number of Players</Label>
                <Input
                  id="players"
                  type="number"
                  value={players}
                  onChange={(e) => setPlayers(parseInt(e.target.value))}
                  min={2}
                />
              </div>
              <div>
                <Label htmlFor="startingCards">Starting Number of Cards</Label>
                <Input
                  id="startingCards"
                  type="number"
                  value={startingCards}
                  onChange={(e) => setStartingCards(parseInt(e.target.value))}
                  min={1}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="canDiscardCard"
                  checked={canDiscardCard}
                  onCheckedChange={setCanDiscardCard}
                />
                <Label htmlFor="canDiscardCard">Can Discard Card</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="canRevealCard"
                  checked={canRevealCard}
                  onCheckedChange={setCanRevealCard}
                />
                <Label htmlFor="canRevealCard">Can Reveal Card in Hand</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="canGiveToken"
                  checked={canGiveToken}
                  onCheckedChange={setCanGiveToken}
                />
                <Label htmlFor="canGiveToken">Can Give Token</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="canGiveCard"
                  checked={canGiveCard}
                  onCheckedChange={setCanGiveCard}
                />
                <Label htmlFor="canGiveCard">Can Give Card</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="canDrawCard"
                  checked={canDrawCard}
                  onCheckedChange={setCanDrawCard}
                />
                <Label htmlFor="canDrawCard">Can Draw Card</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="canDrawToken"
                  checked={canDrawToken}
                  onCheckedChange={setCanDrawToken}
                />
                <Label htmlFor="canDrawToken">Can Draw Token</Label>
              </div>
              <div>
                <Label htmlFor="faceUpBoardDiscardPiles">
                  Face-up Board Discard Piles (rows x columns)
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="faceUpBoardDiscardPilesRows"
                    type="number"
                    value={faceUpBoardDiscardPiles.rows}
                    onChange={(e) =>
                      setFaceUpBoardDiscardPiles({
                        ...faceUpBoardDiscardPiles,
                        rows: parseInt(e.target.value),
                      })
                    }
                    min={1}
                  />
                  <Input
                    id="faceUpBoardDiscardPilesColumns"
                    type="number"
                    value={faceUpBoardDiscardPiles.columns}
                    onChange={(e) =>
                      setFaceUpBoardDiscardPiles({
                        ...faceUpBoardDiscardPiles,
                        columns: parseInt(e.target.value),
                      })
                    }
                    min={1}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="faceDownBoardDiscardPiles">
                  Face-down Board Discard Piles (rows x columns)
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="faceDownBoardDiscardPilesRows"
                    type="number"
                    value={faceDownBoardDiscardPiles.rows}
                    onChange={(e) =>
                      setFaceDownBoardDiscardPiles({
                        ...faceDownBoardDiscardPiles,
                        rows: parseInt(e.target.value),
                      })
                    }
                    min={1}
                  />
                  <Input
                    id="faceDownBoardDiscardPilesColumns"
                    type="number"
                    value={faceDownBoardDiscardPiles.columns}
                    onChange={(e) =>
                      setFaceDownBoardDiscardPiles({
                        ...faceDownBoardDiscardPiles,
                        columns: parseInt(e.target.value),
                      })
                    }
                    min={1}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="faceUpPlayerDiscardPiles">
                  Face-up Player Discard Piles (rows x columns)
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="faceUpPlayerDiscardPilesRows"
                    type="number"
                    value={faceUpPlayerDiscardPiles.rows}
                    onChange={(e) =>
                      setFaceUpPlayerDiscardPiles({
                        ...faceUpPlayerDiscardPiles,
                        rows: parseInt(e.target.value),
                      })
                    }
                    min={1}
                  />
                  <Input
                    id="faceUpPlayerDiscardPilesColumns"
                    type="number"
                    value={faceUpPlayerDiscardPiles.columns}
                    onChange={(e) =>
                      setFaceUpPlayerDiscardPiles({
                        ...faceUpPlayerDiscardPiles,
                        columns: parseInt(e.target.value),
                      })
                    }
                    min={1}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="faceDownPlayerDiscardPiles">
                  Face-down Player Discard Piles (rows x columns)
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="faceDownPlayerDiscardPilesRows"
                    type="number"
                    value={faceDownPlayerDiscardPiles.rows}
                    onChange={(e) =>
                      setFaceDownPlayerDiscardPiles({
                        ...faceDownPlayerDiscardPiles,
                        rows: parseInt(e.target.value),
                      })
                    }
                    min={1}
                  />
                  <Input
                    id="faceDownPlayerDiscardPilesColumns"
                    type="number"
                    value={faceDownPlayerDiscardPiles.columns}
                    onChange={(e) =>
                      setFaceDownPlayerDiscardPiles({
                        ...faceDownPlayerDiscardPiles,
                        columns: parseInt(e.target.value),
                      })
                    }
                    min={1}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={createGame} className="w-full">
          Create Game
        </Button>
      </div>
    </div>
  );
}
