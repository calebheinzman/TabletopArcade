'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchGameTemplate } from '@/lib/supabase/session';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { createSessionFromGameTemplateId } from '@/lib/supabase/session';
import { ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { CardData, DeckData, DiscardPile } from '@/types/game-interfaces';

const MDPreview = dynamic(
  () => import('@uiw/react-markdown-preview'),
  { ssr: false }
);

interface Deck {
  name: string;
}

export default function GameReviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GameReviewContent />
    </Suspense>
  );
}

function GameReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [gameData, setGameData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const gameId = searchParams.get('gameId');
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<CardData[]>([]);
  const [isDecksExpanded, setIsDecksExpanded] = useState(false);
  const [isDiscardPilesExpanded, setIsDiscardPilesExpanded] = useState(false);

  useEffect(() => {
    const loadGameData = async () => {
      if (!gameId) {
        setError('No game ID provided');
        return;
      }

      const data = await fetchGameTemplate(parseInt(gameId));
      if (!data) {
        setError('Failed to load game data');
        return;
      }

      setGameData(data);
    };

    loadGameData();
  }, [gameId]);

  const handleStartGame = async () => {
    if (!gameId) return;
    
    const { error, sessionId } = await createSessionFromGameTemplateId(parseInt(gameId));

    if (error || !sessionId) {
      setError(error ?? 'Failed to create game session');
      return;
    }

    router.push(`/session/${sessionId}/host-start`);
  };

  const handleDeckSelect = (selectedDeck: DeckData) => {
    const timestamp = Date.now();
    const newDeckName = `${selectedDeck.deckname} Copy ${timestamp}`;
    const newDeck: Deck = { name: newDeckName };

    const newCards: CardData[] = selectedDeck.cards.map((card: CardData, index: number) => ({
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

  const handleCloneGame = () => {
    if (!gameData) return;
    
    // Store game data in sessionStorage instead of URL params
    const gameDataToStore = {
      name: `${gameData.name} (Clone)`,
      rules: gameData.game_rules || '',
      tags: gameData.tags || '',
      maxPoints: gameData.num_points || 0,
      startingPoints: gameData.starting_num_points || 0,
      dice: gameData.num_dice || 0,
      startingCards: gameData.starting_num_cards || 0,
      maxCardsPerPlayer: gameData.max_cards_per_player || 52,
      turnBased: gameData.turn_based || false,
      lockTurn: gameData.lock_turn || false,
      dealAllCards: gameData.deal_all_cards || false,
      redealCards: gameData.redeal_cards || false,
      passCards: gameData.pass_cards || false,
      claimTurns: gameData.claim_turns || false,
      canDiscard: gameData.can_discard || false,
      canReveal: gameData.can_reveal || false,
      canDrawCards: gameData.can_draw_cards || false,
      canDrawPoints: gameData.can_draw_points || false,
      canPassPoints: gameData.can_pass_points || false,
      lockPlayerDiscard: gameData.lock_player_discard || false,
      hideHand: gameData.hide_hand || false,
      creator_name: gameData.creator_name || '',
      tradeCards: gameData.trade_cards || false,
      peakCards: gameData.peak_cards || false,
      decks: gameData.decks || [],
      discardPiles: gameData.discard_piles || [],
    };

    // Store the data in sessionStorage
    sessionStorage.setItem('cloneGameData', JSON.stringify(gameDataToStore));

    // Navigate with minimal query params
    router.push('/create-custom-game?clone=true');
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading game details...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-4 pt-8">
      <div className="w-full max-w-4xl grid grid-cols-3 items-center mb-8 relative">
        <div className="flex">
          <Button onClick={() => router.back()}>
            Back
          </Button>
        </div>
        <h1 className="text-4xl font-bold text-center">Game Review</h1>
        <div className="flex justify-end gap-2">
          <Button onClick={handleCloneGame} variant="outline" className="flex gap-2">
            <Copy className="h-4 w-4" />
            Clone
          </Button>
          <Button onClick={handleStartGame}>
            Start Game
          </Button>
        </div>
      </div>

      <div className="w-full max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Game Name</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{gameData.name}</p>
            {gameData.tags && (
              <div className="mt-2">
                <div className="flex flex-wrap gap-2">
                  {gameData.tags.split(',').map((tag: string, index: number) => (
                    <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {gameData.creator_name && (
              <div className="mt-2 text-sm text-gray-600">
                Created by: {gameData.creator_name}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader 
            className="cursor-pointer"
            onClick={() => setIsRulesExpanded(!isRulesExpanded)}
          >
            <div className="flex justify-between items-center">
              <CardTitle>Game Rules</CardTitle>
              {isRulesExpanded ? <ChevronUp /> : <ChevronDown />}
            </div>
          </CardHeader>
          {isRulesExpanded && (
            <CardContent>
              <div data-color-mode="light">
                <MDPreview source={gameData?.rules || gameData?.game_rules || 'No rules available.'} />
              </div>
              {gameData?.tags && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {gameData.tags.split(',').map((tag: string, index: number) => (
                      <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader 
            className="cursor-pointer"
            onClick={() => setIsDecksExpanded(!isDecksExpanded)}
          >
            <div className="flex justify-between items-center">
              <CardTitle>Decks</CardTitle>
              {isDecksExpanded ? <ChevronUp /> : <ChevronDown />}
            </div>
          </CardHeader>
          {isDecksExpanded && gameData?.decks && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gameData.decks.map((deck: DeckData, index: number) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <h3 className="font-bold">{deck.deckname}</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {deck.cards?.length || 0} cards
                      </p>
                      <div className="space-y-2">
                        {deck.cards?.map((card: CardData, cardIndex: number) => (
                          <div 
                            key={cardIndex}
                            className="p-2 bg-gray-50 rounded-md"
                          >
                            <div className="flex justify-between">
                              <span className="font-medium">{card.name}</span>
                              <span className="text-gray-600">×{card.count}</span>
                            </div>
                            {card.type && (
                              <span className="text-sm text-gray-500 block">
                                Type: {card.type}
                              </span>
                            )}
                            {card.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {card.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader 
            className="cursor-pointer"
            onClick={() => setIsDiscardPilesExpanded(!isDiscardPilesExpanded)}
          >
            <div className="flex justify-between items-center">
              <CardTitle>Discard Piles</CardTitle>
              {isDiscardPilesExpanded ? <ChevronUp /> : <ChevronDown />}
            </div>
          </CardHeader>
          {isDiscardPilesExpanded && gameData?.discard_piles && (
            <CardContent>
              <div className="space-y-6">
                {/* Board Piles */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Board Piles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gameData.discard_piles
                      .filter((pile: DiscardPile) => !pile.is_player)
                      .map((pile: DiscardPile, index: number) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <h4 className="font-medium">{pile.pile_name}</h4>
                            <div className="mt-2 space-y-1 text-sm">
                              <p>Position: ({pile.x_pos}, {pile.y_pos})</p>
                              <p>Face Up: {pile.is_face_up ? 'Yes' : 'No'}</p>
                              <p>Values Hidden: {pile.hide_values ? 'Yes' : 'No'}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>

                {/* Player Piles */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Player Piles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gameData.discard_piles
                      .filter((pile: DiscardPile) => pile.is_player)
                      .map((pile: DiscardPile, index: number) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <h4 className="font-medium">{pile.pile_name}</h4>
                            <div className="mt-2 space-y-1 text-sm">
                              <p>Position: ({pile.x_pos}, {pile.y_pos})</p>
                              <p>Face Up: {pile.is_face_up ? 'Yes' : 'No'}</p>
                              <p>Values Hidden: {pile.hide_values ? 'Yes' : 'No'}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Game Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Points</h3>
                <p>Maximum: {gameData.num_points}</p>
                <p>Starting: {gameData.starting_num_points}</p>
              </div>
              <div>
                <h3 className="font-semibold">Cards</h3>
                <p>Starting Cards: {gameData.starting_num_cards}</p>
                <p>Max Cards per Player: {gameData.max_cards_per_player}</p>
              </div>
              <div>
                <h3 className="font-semibold">Game Features</h3>
                <ul className="list-disc list-inside space-y-1">
                  {gameData.turn_based && <li>Turn Based</li>}
                  {gameData.lock_turn && <li>Lock Turn</li>}
                  {gameData.deal_all_cards && <li>Deal All Cards</li>}
                  {gameData.redeal_cards && <li>Redeal Cards</li>}
                  {gameData.pass_cards && <li>Pass Cards</li>}
                  {gameData.claim_turns && <li>Claim Turns</li>}
                  {gameData.can_discard && <li>Can Discard Cards</li>}
                  {gameData.can_reveal && <li>Can Reveal Cards</li>}
                  {gameData.can_draw_cards && <li>Can Draw Cards</li>}
                  {gameData.can_draw_points && <li>Can Draw Points</li>}
                  {gameData.can_pass_points && <li>Can Pass Points</li>}
                  {gameData.lock_player_discard && <li>Lock Player Discard</li>}
                  {gameData.hide_hand && <li>Hide Hand from Host</li>}
                  {gameData.trade_cards && <li>Trade Cards Between Players</li>}
                  {gameData.peak_cards && <li>Peak at Other Players' Cards</li>}
                </ul>
              </div>
              {gameData.num_dice > 0 && (
                <div>
                  <h3 className="font-semibold">Dice</h3>
                  <p>Number of Dice: {gameData.num_dice}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
