// components/board/BoardHeader.tsx

'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { SessionPlayer } from '@/lib/supabase';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface BoardHeaderProps {
  deckCount: number;
  players: SessionPlayer[];
  onDrawCard: (playerId: number) => void;
  onGiveToken: (playerId: number) => void;
  onDiscardCard: (playerId: number) => void;
  onShuffle: () => void;
}

const BoardHeader: React.FC<BoardHeaderProps> = ({
  deckCount,
  players,
  onDrawCard,
  onGiveToken,
  onDiscardCard,
  onShuffle,
}) => {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
      <Button onClick={() => router.back()} size="sm" className="self-start">
        Back
      </Button>
      <div className="space-x-2 self-end">
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm">Draw Card ({deckCount})</Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="grid gap-2">
              {players.map((player) => (
                <Button
                  key={player.playerid}
                  onClick={() => onDrawCard(player.playerid)}
                  size="sm"
                >
                  {player.username}
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
            <div className="grid gap-2">
              {players.map((player) => (
                <Button
                  key={player.playerid}
                  onClick={() => onGiveToken(player.playerid)}
                  size="sm"
                >
                  {player.username}
                </Button>
              ))}
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
