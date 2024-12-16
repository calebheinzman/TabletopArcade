'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { createCustomGame } from '@/lib/supabase/session';
import { CardData, DeckData, DiscardPile } from '@/types/game-interfaces';
import { X } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useState, KeyboardEvent, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fetchAllDecks } from '@/lib/supabase/card';
import DeckBuilder from '../../components/create-game/deck-builder';
import DiscardPileBuilder from '../../components/create-game/discard-pile-builder';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);

interface CustomCard {
  name: string;
  count: number;
  description: string;
  deckName: string;
  type: string;
  drop_order: number;
}

interface Deck {
  name: string;
}

interface CardSettings {
  row: number;
  col: number;
  is_face_up: boolean;
  hide_values: boolean;
}

export default function CreateCustomGamePage() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<CustomCard[]>([]);
  const [name, setName] = useState('Custom Game');
  const [points, setPoints] = useState(0);
  const [dice, setDice] = useState(0);
  const [players, setPlayers] = useState(2);
  const [startingCards, setStartingCards] = useState(2);
  const [canDiscardCard, setCanDiscardCard] = useState(false);
  const [canRevealCard, setCanRevealCard] = useState(false);
  const [canDrawCard, setCanDrawCard] = useState(false);
  const [canDrawPoint, setCanDrawPoint] = useState(false);
  const [redealCards, setRedealCards] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tagList, setTagList] = useState<string[]>([]);
  const [passCards, setPassCards] = useState(false);
  const [claimTurns, setClaimTurns] = useState(false);
  const [gameRules, setGameRules] = useState('# Game Rules\n\nWrite your rules here...');
  const [existingDecks, setExistingDecks] = useState<DeckData[]>([]);
  const [deckSearch, setDeckSearch] = useState('');
  const [discardPiles, setDiscardPiles] = useState<DiscardPile[]>([]);
  const [currentView, setCurrentView] = useState<'main' | 'deck' | 'discard'>('main');
  const [selectedDeckForEdit, setSelectedDeckForEdit] = useState<string | null>(null);
  const [dealAllCards, setDealAllCards] = useState(false);
  const [maxCardsPerPlayer, setMaxCardsPerPlayer] = useState(52);
  const [maxPoints, setMaxPoints] = useState(0);
  const [startingPoints, setStartingPoints] = useState(0);
  const [lockPlayerDiscard, setLockPlayerDiscard] = useState(false);
  const navigateToDeckBuilder = (deckName?: string) => {
    setSelectedDeckForEdit(deckName || null);
    setCurrentView('deck');
  };

  const navigateToDiscardPileBuilder = () => {
    setCurrentView('discard');
  };

  const handleDeckBuilderComplete = (newDeck: Deck, newCards: CardData[]) => {
    if (selectedDeckForEdit) {
      setDecks(prevDecks => 
        prevDecks.map(d => d.name === selectedDeckForEdit ? newDeck : d)
      );
      setCards(prevCards => [
        ...prevCards.filter(c => c.deckName !== selectedDeckForEdit),
        ...newCards
      ]);
    } else {
      setDecks(prevDecks => [...prevDecks, newDeck]);
      setCards(prevCards => [...prevCards, ...newCards]);
    }
    setCurrentView('main');
    setSelectedDeckForEdit(null);
  };

  const handleDiscardPileComplete = (boardPiles: DiscardPile[], playerPiles: DiscardPile[]) => {
    setDiscardPiles([...boardPiles, ...playerPiles]);
    setCurrentView('main');
  };

  const viewDeckDetails = (deckName: string) => {
    router.push(`/create-custom-game/deck-builder?view=true&deck=${encodeURIComponent(deckName)}`);
  };

  const handleTagInput = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tagList.includes(tagInput.trim())) {
        setTagList([...tagList, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTagList(tagList.filter(tag => tag !== tagToRemove));
  };

  const createGame = async () => {
    const gameData = {
      name,
      num_points: maxPoints,
      starting_num_points: startingPoints,
      num_dice: dice,
      num_players: players,
      starting_num_cards: startingCards,
      can_discard: canDiscardCard,
      can_reveal: canRevealCard,
      can_draw_cards: canDrawCard,
      can_draw_points: canDrawPoint,
      turn_based: false,
      lock_turn: false,
      max_cards_per_player: maxCardsPerPlayer,
      game_rules: gameRules,
      redeal_cards: redealCards,
      tags: tagList.join(','),
      pass_cards: passCards,
      claim_turns: claimTurns,
      deal_all_cards: dealAllCards,
      lock_player_discard: lockPlayerDiscard
    };

    const deckData: DeckData[] = decks.map((deck) => ({
      deckname: deck.name,
      num_cards: cards
        .filter((card) => card.deckName === deck.name)
        .reduce((sum, card) => sum + card.count, 0),
      gameid: 0,
      deckid: 0,
      cards: [],
    }));

    const cardData: CardData[][] = decks.map((deck) =>
      cards
        .filter((card) => card.deckName === deck.name)
        .map((card) => ({
          name: card.name,
          count: card.count,
          description: card.description,
          deckName: deck.name,
          type: card.type,
          front_img_url: '',
          back_img_url: ''
        } as CardData))
    );

    try {
      const result = await createCustomGame(
        gameData,
        deckData,
        cardData,
        discardPiles
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

  const deleteDeck = (deckName: string) => {
    const updatedDecks = decks.filter(d => d.name !== deckName);
    const updatedCards = cards.filter(c => c.deckName !== deckName);
    setDecks(updatedDecks);
    setCards(updatedCards);
  };

  const loadExistingDecks = async () => {
    const decks = await fetchAllDecks();
    setExistingDecks(decks);
  };

  const handleDeckSelect = (selectedDeck: DeckData) => {
    const timestamp = Date.now();
    const newDeckName = `${selectedDeck.deckname} Copy ${timestamp}`;
    const newDeck: Deck = { name: newDeckName };

    const newCards: CardData[] = selectedDeck.cards.map((card, index) => ({
      name: card.name,
      count: card.count,
      description: card.description,
      deckName: newDeckName,
      type: card.type || '',
      front_img_url: '',
      back_img_url: '',
      drop_order: card.drop_order || index,
    } as CardData));

    setDecks([...decks, newDeck]);
    setCards([...cards, ...newCards]);
  };

  const filteredDecks = existingDecks.filter(deck => 
    deck.deckname.toLowerCase().includes(deckSearch.toLowerCase())
  );


  if (currentView === 'deck') {
    return (
      <DeckBuilder
        initialDeckName={selectedDeckForEdit || `Deck ${decks.length + 1}`}
        initialCards={cards.filter(c => c.deckName === selectedDeckForEdit).map(c => ({
          ...c,
          deckid: 0,
          cardid: 0,
          front_img_url: '',
          back_img_url: '',
          drop_order: c.drop_order || 0
        }))}
        onComplete={handleDeckBuilderComplete}
        onCancel={() => setCurrentView('main')}
      />
    );
  }

  if (currentView === 'discard') {
    return (
      <DiscardPileBuilder
        initialBoardPiles={discardPiles.filter(p => !p.is_player)}
        initialPlayerPiles={discardPiles.filter(p => p.is_player)}
        onComplete={handleDiscardPileComplete}
        onCancel={() => setCurrentView('main')}
      />
    );
  }

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
            <CardTitle>Game Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4" data-color-mode="light">
              {typeof window !== 'undefined' && (
                <MDEditor
                  value={gameRules}
                  onChange={(val) => setGameRules(val || '')}
                  preview="edit"
                />
              )}
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInput}
                placeholder="Type a tag and press Enter"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {tagList.map((tag, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deck Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {decks.length > 0 ? (
                <>
                  <div className="text-sm text-gray-600">
                    {decks.length} deck(s) created with {cards.length} total cards
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {decks.map((deck) => (
                      <Card key={deck.name}>
                        <CardContent className="p-4 relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => deleteDeck(deck.name)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <h3 className="font-bold">{deck.name}</h3>
                          <p className="text-sm text-gray-600">
                            {cards.filter(card => card.deckName === deck.name).length} cards
                          </p>
                          <div className="flex space-x-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigateToDeckBuilder(deck.name)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewDeckDetails(deck.name)}
                            >
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={() => navigateToDeckBuilder()}>
                      Create New Deck
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={loadExistingDecks}>
                          Choose Existing Deck
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Choose a Deck</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Search decks..."
                            value={deckSearch}
                            onChange={(e) => setDeckSearch(e.target.value)}
                            className="mb-4"
                          />
                          <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                            {filteredDecks.map((deck) => (
                              <Card 
                                key={deck.deckid} 
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => handleDeckSelect(deck)}
                              >
                                <CardContent className="p-4">
                                  <h3 className="font-bold">{deck.deckname}</h3>
                                  <p className="text-sm text-gray-600">
                                    {deck.cards?.length || 0} cards
                                  </p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">No decks created yet</p>
                  <div className="flex space-x-2">
                    <Button onClick={() => navigateToDeckBuilder()}>Create First Deck</Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" onClick={loadExistingDecks}>
                          Choose Existing Deck
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Choose a Deck</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          {existingDecks.map((deck) => (
                            <Card 
                              key={deck.deckid} 
                              className="cursor-pointer hover:bg-accent"
                              onClick={() => handleDeckSelect(deck)}
                            >
                              <CardContent className="p-4">
                                <h3 className="font-bold">{deck.deckname}</h3>
                                <p className="text-sm text-gray-600">
                                  {deck.cards?.length || 0} cards
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Game Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Button 
                onClick={navigateToDiscardPileBuilder}
                className="w-full"
              >
                Configure Discard Piles
              </Button>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="maxPoints">Maximum Points</Label>
                  <Input
                    id="maxPoints"
                    type="number"
                    value={maxPoints}
                    onChange={(e) => setMaxPoints(parseInt(e.target.value))}
                    min={0}
                  />
                </div>
                <div>
                  <Label htmlFor="startingPoints">Starting Points</Label>
                  <Input
                    id="startingPoints"
                    type="number"
                    value={startingPoints}
                    onChange={(e) => setStartingPoints(parseInt(e.target.value))}
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="redealCards"
                    checked={redealCards}
                    onCheckedChange={setRedealCards}
                  />
                  <Label htmlFor="redealCards">Redeal Cards</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="dealAllCards"
                    checked={dealAllCards}
                    onCheckedChange={(checked) => {
                      setDealAllCards(checked);
                      if (checked) {
                        setStartingCards(0);
                      }
                    }}
                  />
                  <Label htmlFor="dealAllCards">Deal All Cards</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Player Hand Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label htmlFor="startingCards">Starting Number of Cards</Label>
                <Input
                  id="startingCards"
                  type="number"
                  value={dealAllCards ? -1 : startingCards}
                  onChange={(e) => setStartingCards(parseInt(e.target.value))}
                  min={1}
                  disabled={dealAllCards}
                  className={dealAllCards ? "opacity-50 cursor-not-allowed" : ""}
                />
              </div>

              <div>
                <Label htmlFor="maxCardsPerPlayer">Maximum Cards Per Player</Label>
                <Input
                  id="maxCardsPerPlayer"
                  type="number"
                  value={maxCardsPerPlayer}
                  onChange={(e) => setMaxCardsPerPlayer(parseInt(e.target.value))}
                  min={1}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    id="passCards"
                    checked={passCards}
                    onCheckedChange={setPassCards}
                  />
                  <Label htmlFor="passCards">Pass Cards</Label>
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
                    id="canDrawPoint"
                    checked={canDrawPoint}
                    onCheckedChange={setCanDrawPoint}
                  />
                  <Label htmlFor="canDrawPoint">Can Draw Point</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="claimTurns"
                    checked={claimTurns}
                    onCheckedChange={setClaimTurns}
                  />
                  <Label htmlFor="claimTurns">Claim Turns</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="lockPlayerDiscard"
                    checked={lockPlayerDiscard}
                    onCheckedChange={setLockPlayerDiscard}
                  />
                  <Label htmlFor="lockPlayerDiscard">Lock Player Discard</Label>
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