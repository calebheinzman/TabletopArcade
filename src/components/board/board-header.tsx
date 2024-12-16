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

interface BoardHeaderProps {
  deckCount: number;
  players: SessionPlayer[];
  onDrawCard: (playerId: number) => void;
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
  const [numPointsToGive, setNumPointsToGive] = useState(1);

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
      </div>
      <div className="space-x-2 self-end">
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
                  onClick={() => onDrawCard(player.playerid)}
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
                    onClick={() => setNumPointsToGive(num)}
                  >
                    {num}
                  </Button>
                ))}
              </div>
              <div className="grid gap-2">
                {players.map((player) => (
                  <Button
                    key={player.playerid}
                    onClick={() => onGivePoint(player.playerid, numPointsToGive)}
                    size="sm"
                  >
                    {player.username}
                  </Button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button 
              size="sm"
              disabled={!gameContext.gameData.can_discard}
            >
              Discard Card
            </Button>
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

        <Button size="sm" onClick={handleShuffle}>
          Shuffle Deck
        </Button>

        {gameContext.gameData.lock_player_discard && (
          <Button 
            size="sm" 
            variant={gameContext.session.locked_player_discard ? "destructive" : "default"}
            onClick={handleTogglePlayerDiscard}
          >
            {gameContext.session.locked_player_discard ? "Unlock Player Discard" : "Lock Player Discard"}
          </Button>
        )}
      </div>

    </div>
  );
};

export default BoardHeader;
