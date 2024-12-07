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
import { SessionPlayer } from '@/lib/supabase';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGame } from '@/components/GameContext';
import { resetGame } from '@/lib/supabase';

interface BoardHeaderProps {
  deckCount: number;
  players: SessionPlayer[];
  onDrawCard: (playerId: number) => void;
  onGiveToken: (playerId: number, quantity: number) => void;
  onDiscardCard: (playerId: number) => void;
  onShuffle: () => void;
  onReset: () => void;
}

const BoardHeader: React.FC<BoardHeaderProps> = ({
  deckCount,
  players,
  onDrawCard,
  onGiveToken,
  onDiscardCard,
  onShuffle,
  onReset,
}) => {
  const router = useRouter();
  const gameContext = useGame();
  const [numTokensToGive, setNumTokensToGive] = useState(1);

  const getPlayerCardCount = (playerId: number) => {
    return gameContext?.sessionCards.filter(card => card.playerid === playerId).length || 0;
  };

  const isPlayerAtMaxCards = (playerId: number) => {
    const cardCount = getPlayerCardCount(playerId);
    return cardCount >= (gameContext?.gameData.max_cards_per_player || 0);
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
            <Button size="sm">Give Token</Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="flex flex-col">
              <span className="mb-2">Select Number of Tokens</span>
              <div className="flex space-x-2 mb-2">
                {[1, 2, 3].map((num) => (
                  <Button
                    key={num}
                    size="sm"
                    variant={numTokensToGive === num ? 'default' : 'outline'}
                    onClick={() => setNumTokensToGive(num)}
                  >
                    {num}
                  </Button>
                ))}
              </div>
              <div className="grid gap-2">
                {players.map((player) => (
                  <Button
                    key={player.playerid}
                    onClick={() => onGiveToken(player.playerid, numTokensToGive)}
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
            <Button size="sm">Discard Card</Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="grid gap-2">
              {players.map((player) => (
                <Button
                  key={player.playerid}
                  onClick={() => onDiscardCard(player.playerid)}
                  size="sm"
                >
                  {player.username}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button size="sm" onClick={onShuffle}>
          Shuffle
        </Button>
      </div>
    </div>
  );
};

export default BoardHeader;
