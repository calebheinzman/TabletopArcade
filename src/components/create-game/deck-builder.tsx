'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CardData } from '@/types/game-interfaces';

interface Deck {
  name: string;
}

interface DeckBuilderProps {
  initialDeckName: string;
  initialCards: CardData[];
  onComplete: (deck: Deck, cards: CardData[]) => void;
  onCancel: () => void;
}

export default function DeckBuilder({ 
  initialDeckName, 
  initialCards, 
  onComplete, 
  onCancel 
}: DeckBuilderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isViewOnly = searchParams.get('view') === 'true';
  
  const [deck, setDeck] = useState<Deck>({ name: initialDeckName });
  const [cards, setCards] = useState<CardData[]>(initialCards);
  const [newCard, setNewCard] = useState<CardData>({
    deckid: 0,
    cardid: 0,
    name: '',
    count: 1,
    description: '',
    deckName: initialDeckName,
    type: '',
    front_img_url: '',
    back_img_url: '',
    drop_order: 0,
  });

  useEffect(() => {
    const savedDecksStr = localStorage.getItem('customGameDecks');
    const savedCardsStr = localStorage.getItem('customGameCards');
    
    if (savedDecksStr && savedCardsStr) {
      const savedDecks: Deck[] = JSON.parse(savedDecksStr);
      const savedCards: CardData[] = JSON.parse(savedCardsStr);
      
      const currentDeck = savedDecks.find(d => d.name === initialDeckName);
      if (currentDeck) {
        setDeck(currentDeck);
        const deckCards = savedCards.filter(card => card.deckName === initialDeckName).map(card => ({
          ...card,
          name: card.name || '',
          count: card.count || 1,
          description: card.description || '',
          type: card.type || '',
          deckName: card.deckName || initialDeckName,
        }));
        setCards(deckCards);
      }
    }
  }, [initialDeckName]);

  const handleDeckNameChange = (newName: string) => {
    setDeck({ name: newName || '' });
    setCards(cards.map(card => ({
      ...card,
      deckName: newName || ''
    })));
    setNewCard(prev => ({
      ...prev,
      deckName: newName || ''
    }));
  };

  const addCard = () => {
    if (newCard.name && newCard.count > 0) {
      setCards([...cards, { 
        ...newCard, 
        deckName: deck.name,
        drop_order: newCard.drop_order
      }]);
      setNewCard({
        deckid: 0,
        cardid: 0,
        name: '',
        count: 1,
        description: '',
        deckName: deck.name,
        type: '',
        front_img_url: '',
        back_img_url: '',
        drop_order: 0,
      });
    }
  };

  const deleteCard = (index: number) => {
    setCards(cards.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onComplete(deck, cards);
  };

  const handleBack = () => {
    onCancel();
  };

  const updateCard = (index: number, field: keyof CardData, value: string | number) => {
    setCards(cards.map((card, i) => {
      if (i === index) {
        return {
          ...card,
          [field]: field === 'count' ? Math.max(1, Number(value) || 1) : value || ''
        };
      }
      return card;
    }));
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        console.log('Headers:', headers);
        
        const newCards: CardData[] = lines.slice(1)
          .filter(line => line.trim())
          .map((line) => {
            const values = line.split(',').map(value => value.trim());
            console.log('Values:', values);
            
            const dropOrderIndex = headers.indexOf('drop order');
            const dropOrderValue = dropOrderIndex !== -1 ? 
              parseInt(values[dropOrderIndex]) : 0;

            const cardData: CardData = {
              deckid: 0,
              cardid: 0,
              name: values[headers.indexOf('name')] || '',
              count: parseInt(values[headers.indexOf('count')]) || 1,
              type: values[headers.indexOf('type')] || '',
              description: values[headers.indexOf('description')] || '',
              deckName: deck.name,
              front_img_url: '',
              back_img_url: '',
              drop_order: isNaN(dropOrderValue) ? 0 : dropOrderValue,
            };

            console.log('Card Data:', cardData);
            return cardData;
          });

        setCards([...cards, ...newCards]);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-8 p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button onClick={handleBack}>Back</Button>
          {isViewOnly ? (
            <h1 className="text-2xl font-bold">{deck.name}</h1>
          ) : (
            <Input
              value={deck.name || ''}
              onChange={(e) => handleDeckNameChange(e.target.value)}
              className="w-64 text-xl"
              placeholder="Enter deck name"
            />
          )}
        </div>
        {!isViewOnly && <Button onClick={handleSave}>Save & Return</Button>}
      </div>

      {!isViewOnly ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Import Cards via CSV</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  id="csvUpload"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCsvUpload}
                />
                <p className="text-sm text-gray-500">
                  Format: Name, Count, Type, Description, Drop Order (comma-separated)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Cards to {deck.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cardName">Name</Label>
                  <Input
                    id="cardName"
                    value={newCard.name}
                    onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                    placeholder="Enter card name"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="cardCount">Count</Label>
                    <Input
                      id="cardCount"
                      type="number"
                      value={newCard.count}
                      onChange={(e) => setNewCard({ ...newCard, count: parseInt(e.target.value) })}
                      min={1}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardType">Type</Label>
                    <Input
                      id="cardType"
                      value={newCard.type}
                      onChange={(e) => setNewCard({ ...newCard, type: e.target.value })}
                      placeholder="Card type"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dropOrder">Drop Order</Label>
                    <Input
                      id="dropOrder"
                      type="number"
                      value={newCard.drop_order}
                      onChange={(e) => setNewCard({ ...newCard, drop_order: parseInt(e.target.value) || 0 })}
                      min={0}
                      placeholder="Drop order"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="cardDescription">Description</Label>
                  <Textarea
                    id="cardDescription"
                    value={newCard.description}
                    onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
                    placeholder="Enter card description"
                  />
                </div>
              </div>
              <Button onClick={addCard} className="mt-4">
                Add Card
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cards in {deck.name}</CardTitle>
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
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`card-name-${index}`}>Name</Label>
                          <Input
                            id={`card-name-${index}`}
                            value={card.name || ''}
                            onChange={(e) => updateCard(index, 'name', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label htmlFor={`card-count-${index}`}>Count</Label>
                            <Input
                              id={`card-count-${index}`}
                              type="number"
                              value={card.count || 1}
                              onChange={(e) => updateCard(index, 'count', e.target.value)}
                              min={1}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`card-type-${index}`}>Type</Label>
                            <Input
                              id={`card-type-${index}`}
                              value={card.type || ''}
                              onChange={(e) => updateCard(index, 'type', e.target.value)}
                              className="mt-1"
                              placeholder="Card type"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`card-drop-order-${index}`}>Drop Order</Label>
                            <Input
                              id={`card-drop-order-${index}`}
                              type="number"
                              value={card.drop_order || 0}
                              onChange={(e) => updateCard(index, 'drop_order', e.target.value)}
                              min={0}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor={`card-description-${index}`}>Description</Label>
                          <Textarea
                            id={`card-description-${index}`}
                            value={card.description || ''}
                            onChange={(e) => updateCard(index, 'description', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{deck.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((card, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <h3 className="font-bold">{card.name}</h3>
                    <p>Count: {card.count}</p>
                    {card.type && <p>Type: {card.type}</p>}
                    <p className="text-sm text-gray-600">{card.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}