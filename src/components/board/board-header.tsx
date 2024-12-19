// components/board/BoardHeader.tsx

'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { SessionPlayer } from '@/types/game-interfaces';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGame } from '@/components/GameContext';
import { resetGame } from '@/lib/supabase/session';
import { supabase } from '@/lib/supabase';
import { Input } from '../ui/input';
import { updateSessionCards } from '@/lib/supabase/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface BoardHeaderProps {
  deckCount: number;
  players: SessionPlayer[];
  onDrawCard: (playerId: number, card_hidden: boolean) => void;
  onGivePoint: (playerId: number, quantity: number) => void;
  onDiscardCard: (playerId: number) => void;
  onShuffle: () => void;
  onReset: () => void;
}

const BoardHeader: React.FC<BoardHeaderProps> = ({
  deckCount,
  players,
  onDrawCard,
  onGivePoint,
  onDiscardCard,
  onShuffle,
  onReset,
}) => {
  const router = useRouter();
  const gameContext = useGame();
  const [numPointsToGive, setNumPointsToGive] = useState<number>(1);
  const [customPoints, setCustomPoints] = useState<string>('');
  const [drawnCard, setDrawnCard] = useState<{
    playerName: string;
    cardName: string;
    description: string;
  } | null>(null);

  const getPlayerCardCount = (playerId: number) => {
    return gameContext?.sessionCards.filter(card => card.playerid === playerId).length || 0;
  };

  const handleDiscard = async (playerId: number) => {
    const playerCards = gameContext.sessionCards.filter(card => card.playerid === playerId);
    if (playerCards.length === 0) return;

    const boardPiles = gameContext.discardPiles.filter(pile => !pile.is_player);
    if (boardPiles.length > 0) {
      // Discard to first available pile
      await gameContext.discardCard(playerId, playerCards[0].sessioncardid, boardPiles[0].pile_id);
    } else {
      // Discard to deck
      await gameContext.discardCard(playerId, playerCards[0].sessioncardid);
    }
  };

  const isPlayerAtMaxCards = (playerId: number) => {
    const cardCount = getPlayerCardCount(playerId);
    return cardCount >= (gameContext?.gameData.max_cards_per_player || 0);
  };

  const handleShuffle = async () => {
    if (!gameContext) return;

    // Get all cards from deck and discard piles
    const deckCards = gameContext.sessionCards.filter(card => 
      card.playerid === 0 || card.pile_id !== null
    );

    if (deckCards.length === 0) return;

    // Shuffle all cards
    const shuffledCards = [...deckCards].sort(() => Math.random() - 0.5);

    // Update all cards to be in deck (not in any pile)
    const updatedCards = shuffledCards.map((card, index) => ({
      sessioncardid: card.sessioncardid,
      sessionid: gameContext.sessionid,
      cardid: card.cardid,
      cardPosition: index + 1,
      playerid: null,
      deckid: card.deckid,
      isRevealed: false,
      pile_id: null
    }));

    try {
      // Update cards in database
      const { error } = await supabase
        .from('session_cards')
        .upsert(updatedCards);

      if (error) throw error;

      // Call the original onShuffle to update the UI
      onShuffle();
    } catch (error) {
      console.error('Error shuffling deck:', error);
    }
  };

  const handleTogglePlayerDiscard = async () => {
    if (!gameContext) return;

    try {
      const { error } = await supabase
        .from('session')
        .update({ 
          locked_player_discard: !gameContext.session.locked_player_discard 
        })
        .eq('sessionid', gameContext.sessionid);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling player discard:', error);
    }
  };

  const handleCustomPointsChange = (value: string) => {
    // Only allow positive numbers
    if (/^\d*$/.test(value)) {
      setCustomPoints(value);
      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue > 0) {
        setNumPointsToGive(numValue);
      }
    }
  };

  const handleRedealCards = async () => {
    if (!gameContext) return;

    const existingCards = [...gameContext.sessionCards];

    // Sort cards by drop_order if deal_all_cards is true
    if (gameContext.gameData.deal_all_cards) {
      existingCards.sort((a, b) => {
        const cardA = gameContext.cards.flat().find(c => c.cardid === a.cardid);
        const cardB = gameContext.cards.flat().find(c => c.cardid === b.cardid);
        return (cardB?.drop_order || 0) - (cardA?.drop_order || 0);
      });
    }

    // Shuffle the array of existing cards
    for (let i = existingCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [existingCards[i], existingCards[j]] = [existingCards[j], existingCards[i]];
    }

    const updates: {
      sessionid: number;
      sessioncardid: number;
      cardPosition: number;
      playerid: number | null;
      pile_id: null;
      isRevealed: boolean;
    }[] = [];

    let currentCardIndex = 0;

    if (gameContext.gameData.deal_all_cards) {
      // Calculate cards per player (rounded down)
      const cardsPerPlayer = Math.floor(existingCards.length / gameContext.sessionPlayers.length);
      
      // Deal cards to each player
      for (const player of gameContext.sessionPlayers) {
        for (let i = 0; i < cardsPerPlayer; i++) {
          if (currentCardIndex < existingCards.length) {
            updates.push({
              sessionid: gameContext.sessionid,
              sessioncardid: existingCards[currentCardIndex].sessioncardid,
              cardPosition: 0,
              playerid: player.playerid,
              pile_id: null,
              isRevealed: false
            });
            currentCardIndex++;
          }
        }
      }
    } else if (gameContext.gameData.starting_num_cards > 0) {
      // Deal specific number of cards
      for (const player of gameContext.sessionPlayers) {
        for (let i = 0; i < gameContext.gameData.starting_num_cards; i++) {
          if (currentCardIndex < existingCards.length) {
            updates.push({
              sessionid: gameContext.sessionid,
              sessioncardid: existingCards[currentCardIndex].sessioncardid,
              cardPosition: 0,
              playerid: player.playerid,
              pile_id: null,
              isRevealed: false
            });
            currentCardIndex++;
          }
        }
      }
    }

    // Update remaining cards as deck cards
    for (let i = currentCardIndex; i < existingCards.length; i++) {
      updates.push({
        sessionid: gameContext.sessionid,
        sessioncardid: existingCards[i].sessioncardid,
        cardPosition: i - currentCardIndex + 1,
        playerid: null,
        pile_id: null,
        isRevealed: false
      });
    }

    // Update all cards in a single operation
    await gameContext.updateSessionCards(updates);
  };

  const handleToggleHandHidden = async () => {
    if (!gameContext) return;

    try {
      // Update session hand_hidden status
      const { error: sessionError } = await supabase
        .from('session')
        .update({ 
          hand_hidden: !gameContext.session.hand_hidden 
        })
        .eq('sessionid', gameContext.sessionid);

      if (sessionError) throw sessionError;

      // Get all cards assigned to players
      const playerCards = gameContext.sessionCards.filter(card => 
        card.playerid !== null && card.playerid !== 0
      );

      // Update card_hidden for all player cards
      const updates = playerCards.map(card => ({
        sessionid: gameContext.sessionid,
        sessioncardid: card.sessioncardid,
        cardPosition: card.cardPosition,
        playerid: card.playerid,
        pile_id: card.pile_id,
        card_hidden: !gameContext.session.hand_hidden
      }));

      if (updates.length > 0) {
        await updateSessionCards(updates);
      }
    } catch (error) {
      console.error('Error toggling hand hidden:', error);
    }
  };

  const handleRevealAllCards = async () => {
    if (!gameContext) return;

    // Get all player cards
    const playerCards = gameContext.sessionCards.filter(card => card.playerid !== null && card.playerid !== 0);
    
    // Count revealed vs hidden cards to determine minority state
    const revealedCount = playerCards.filter(card => card.isRevealed).length;
    const hiddenCount = playerCards.length - revealedCount;
    
    // Set all cards to the minority state
    const shouldReveal = revealedCount <= hiddenCount;

    // Update all player cards
    const updates = playerCards.map(card => ({
      sessionid: gameContext.sessionid,
      sessioncardid: card.sessioncardid,
      cardPosition: card.cardPosition,
      playerid: card.playerid,
      pile_id: card.pile_id,
      isRevealed: shouldReveal
    }));

    try {
      await updateSessionCards(updates);
    } catch (error) {
      console.error('Error toggling all cards revealed:', error);
    }
  };

  const handleDrawCard = async (playerId: number) => {
    if (!gameContext) return;

    try {
      // Store the current number of cards
      const previousCardCount = getPlayerCardCount(playerId);
      
      // Draw the card, passing in the hand_hidden status
      await gameContext.drawCard(playerId, gameContext.session.hand_hidden);

      // If hands are hidden, wait briefly then check for the new card
      if (gameContext.session.hand_hidden) {
        // Small delay to ensure the card has been added
        setTimeout(() => {
          const currentCards = gameContext.sessionCards.filter(card => card.playerid === playerId);
          if (currentCards.length > previousCardCount) {
            // Get the newest card
            const newCard = currentCards[currentCards.length - 1];
            const deck = gameContext.decks.find(d => d.deckid === newCard.deckid);
            const cardDetails = deck?.cards.find(c => c.cardid === newCard.cardid);
            const player = players.find(p => p.playerid === playerId);

            if (cardDetails && player) {
              setDrawnCard({
                playerName: player.username,
                cardName: cardDetails.name || 'Unknown Card',
                description: cardDetails.description || '',
              });
            }
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error drawing card:', error);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
      <div className="flex gap-2">
        <Button onClick={() => router.back()} size="sm" className="self-start">
          Back
        </Button>
        <Button 
          onClick={onReset} 
          size="sm" 
          variant="destructive" 
          className="self-start"
        >
          Reset Game
        </Button>
        {gameContext.gameData.redeal_cards && (
          <Button
            onClick={handleRedealCards}
            size="sm"
            variant="secondary"
            className="self-start"
          >
            Redeal Cards
          </Button>
        )}
      </div>
      <div className="space-x-2 self-end">
        {gameContext.gameData.can_draw_cards && (
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" disabled={deckCount === 0}>
                Draw Card ({deckCount})
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="grid gap-2">
                {players.map((player) => (
                  <Button
                    key={player.playerid}
                    onClick={() => handleDrawCard(player.playerid)}
                    size="sm"
                    disabled={isPlayerAtMaxCards(player.playerid) || deckCount === 0}
                    className={
                      (isPlayerAtMaxCards(player.playerid) || deckCount === 0) 
                        ? "opacity-50" 
                        : ""
                    }
                  >
                    {player.username} ({getPlayerCardCount(player.playerid)}/{gameContext?.gameData.max_cards_per_player})
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {gameContext.gameData.can_draw_points && (
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm">Give Points</Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="flex flex-col">
                <span className="mb-2">Select Number of Points</span>
                <div className="flex space-x-2 mb-2">
                  {[1, 2, 3].map((num) => (
                    <Button
                      key={num}
                      size="sm"
                      variant={numPointsToGive === num ? 'default' : 'outline'}
                      onClick={() => {
                        setNumPointsToGive(num);
                        setCustomPoints('');
                      }}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
                <div className="flex space-x-2 mb-2">
                  <Input
                    type="text"
                    placeholder="Custom amount"
                    value={customPoints}
                    onChange={(e) => handleCustomPointsChange(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  {players.map((player) => (
                    <Button
                      key={player.playerid}
                      onClick={() => {
                        onGivePoint(player.playerid, numPointsToGive);
                        setCustomPoints('');
                        setNumPointsToGive(1);
                      }}
                      size="sm"
                    >
                      {player.username}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {gameContext.gameData.can_discard && (
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm">Discard Card</Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="grid gap-2">
                {players.map((player) => (
                  <Button
                    key={player.playerid}
                    onClick={() => handleDiscard(player.playerid)}
                    size="sm"
                    disabled={getPlayerCardCount(player.playerid) === 0}
                  >
                    {player.username}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {gameContext.gameData.redeal_cards && (
          <Button size="sm" onClick={handleShuffle}>
            Shuffle Deck
          </Button>
        )}

        {gameContext.gameData.lock_player_discard && (
          <Button 
            size="sm" 
            variant={gameContext.session.locked_player_discard ? "destructive" : "default"}
            onClick={handleTogglePlayerDiscard}
          >
            {gameContext.session.locked_player_discard ? "Unlock Player Discard" : "Lock Player Discard"}
          </Button>
        )}

        {gameContext.gameData.hide_hand && (
          <Button 
            size="sm" 
            variant={gameContext.session.hand_hidden ? "destructive" : "default"}
            onClick={handleToggleHandHidden}
          >
            {gameContext.session.hand_hidden ? "Show Hands" : "Hide Hands"}
          </Button>
        )}

        {gameContext.gameData.reveal_hands && (
          <Button 
            size="sm" 
            onClick={handleRevealAllCards}
          >
            Reveal All Hands
          </Button>
        )}
      </div>

      {/* Drawn Card Dialog */}
      <Dialog open={drawnCard !== null} onOpenChange={() => setDrawnCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{drawnCard?.playerName} Drew a Card</DialogTitle>
            <DialogDescription>
              <div className="mt-4">
                <h3 className="font-bold">{drawnCard?.cardName}</h3>
                <p className="mt-2">{drawnCard?.description}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BoardHeader;
