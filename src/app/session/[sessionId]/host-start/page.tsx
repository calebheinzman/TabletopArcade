'use client';

import { useGame } from '@/components/GameContext';
import { Button } from '@/components/ui/button';
import { initializeSession } from '@/lib/defaultGameState';
import { supabase } from '@/lib/supabase';
import { setFirstPlayerTurn } from '@/lib/supabase/player';
import { createSession } from '@/lib/supabase/session';
import { SessionPlayer } from '@/types/game-interfaces';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HostStartPage() {
  const router = useRouter();
  const { sessionId } = useParams();
  const gameContext = useGame();
  const [players, setPlayers] = useState<SessionPlayer[]>([]);

  // Monitor changes to gameContext
  useEffect(() => {
    console.log(
      'HostStartPage: gameContext updated',
      gameContext?.sessionPlayers
    );
    if (gameContext?.sessionPlayers) {
      setPlayers(gameContext.sessionPlayers);
    }
  }, [gameContext?.sessionPlayers]);

  const startGame = async () => {
    try {
      const deck = initializeSession(gameContext);

      if (gameContext.gameData.deal_all_cards) {
        // Sort cards by drop_order (highest first)
        deck.sort((a, b) => {
          const cardA = gameContext.cards
            .flat()
            .find((c) => c.cardid === a.cardid);
          const cardB = gameContext.cards
            .flat()
            .find((c) => c.cardid === b.cardid);
          return (cardB?.drop_order || 0) - (cardA?.drop_order || 0);
        });

        // Calculate cards per player (rounded down)
        const cardsPerPlayer = Math.floor(deck.length / players.length);

        deck.forEach((card, index) => {
          if (index < cardsPerPlayer * players.length) {
            const playerIndex = Math.floor(index / cardsPerPlayer);
            card.playerid = players[playerIndex].playerid;
            card.cardPosition = 0;
          } else {
            card.cardPosition = index - cardsPerPlayer * players.length + 1;
            card.playerid = 0;
          }
        });
      } else {
        // Original logic for dealing specific number of cards
        const totalStartingCards =
          gameContext.gameData.starting_num_cards * players.length;
        deck.forEach((card, index) => {
          if (index < totalStartingCards) {
            const player = players[index % players.length];
            card.playerid = player.playerid;
            card.cardPosition = 0;
          } else {
            card.cardPosition = index - totalStartingCards + 1;
            card.playerid = 0;
          }
        });
      }

      // Create session with the generated deck
      await createSession(gameContext.sessionid, deck);

      // Only set first player turn if claim_turn is false
      if (!gameContext.gameData.claim_turns) {
        await setFirstPlayerTurn(parseInt(sessionId as string));
      }

      const { error: updateError } = await supabase
        .from('session')
        .update({ is_live: true })
        .eq('sessionid', sessionId);

      if (updateError) throw updateError;

      router.push(`/session/${sessionId}/board`);
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  if (!gameContext || !gameContext.session) {
    return <div>Loading game state...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
      <Button onClick={() => router.back()} className="absolute top-4 left-4">
        Back
      </Button>
      <h1 className="text-4xl font-bold mb-8">Host Game</h1>
      <div className="bg-white p-8 rounded-lg shadow-md w-96 space-y-6">
        <div>
          <p className="text-sm font-medium text-gray-700">Game Code</p>
          <p className="text-2xl font-bold">{sessionId}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">
            Players Joined ({players.length})
          </p>
          <div className="mt-2 space-y-2">
            {players.map((player) => (
              <div
                key={player.playerid}
                className="text-sm bg-gray-50 p-2 rounded"
              >
                {player.username}
              </div>
            ))}
          </div>
        </div>
        <Button
          onClick={startGame}
          className="w-full"
          disabled={players.length < 2}
        >
          Start Game
        </Button>
      </div>
    </div>
  );
}
