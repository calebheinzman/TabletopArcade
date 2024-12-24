// PlayerHand.tsx

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { discardAndShuffleCard, updateSessionCards } from '@/lib/supabase/card';
import {
  claimTurn,
  passTurnToNextPlayer,
  pushPlayerAction,
  updatePlayerLastAction,
} from '@/lib/supabase/player';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { usePlayer } from '../providers/player-provider';

export function PlayerHand() {
  const { player: currentPlayer, gameContext } = usePlayer();
  const playerId = currentPlayer?.playerid;

  // New state variables for handling point quantity and popover visibility
  const [numPointsToDraw, setNumPointsToDraw] = useState(1);
  const [customDrawPoints, setCustomDrawPoints] = useState<string>('');
  const [drawPointsPopoverOpen, setDrawPointsPopoverOpen] = useState(false);

  const [numPointsToGive, setNumPointsToGive] = useState(1);
  const [customGivePoints, setCustomGivePoints] = useState<string>('');
  const [givePointsPopoverOpen, setGivePointsPopoverOpen] = useState(false);

  // Add new state for rules dialog
  const [showRules, setShowRules] = useState(false);

  const [showDiscardPileDialog, setShowDiscardPileDialog] = useState(false);

  useEffect(() => {
    if (!playerId || !gameContext?.sessionid) return;

    const updateLastActive = () => {
      updatePlayerLastAction(gameContext.sessionid, playerId).catch((error) =>
        console.error('Error updating last active:', error)
      );
    };

    updateLastActive();

    const interval = setInterval(updateLastActive, 30000);

    return () => clearInterval(interval);
  }, [playerId, gameContext?.sessionid]);

  if (!gameContext || !playerId) {
    return <div>Loading game state...</div>;
  }

  const playerCards = gameContext.sessionCards
    .filter(
      (card) => card.playerid === playerId && card.pile_id === null // Only include cards that are not in any pile
    )
    .map((sessionCard) => {
      const deck = gameContext.decks.find(
        (d) => d.deckid === sessionCard.deckid
      );
      const cardDetails = deck?.cards.find(
        (c) => c.cardid === sessionCard.cardid
      );
      return {
        id: sessionCard.sessioncardid,
        name: cardDetails?.name || 'Unknown Card',
        description: cardDetails?.description || '',
        isRevealed: sessionCard.isRevealed || false,
        type: cardDetails?.type || '',
        dropOrder: cardDetails?.drop_order || 0,
      };
    })
    .sort((a, b) => {
      // First sort by type
      if (a.type < b.type) return -1;
      if (a.type > b.type) return 1;

      // If types are equal, sort by drop_order
      return a.dropOrder - b.dropOrder;
    });

  const playerNames =
    gameContext.sessionPlayers
      .map((player) => player.username)
      .filter((name) => name !== currentPlayer.username) || [];

  const handleCustomPointsChange = (
    value: string,
    setPoints: (n: number) => void,
    setCustom: (s: string) => void
  ) => {
    // Only allow positive numbers
    if (/^\d*$/.test(value)) {
      setCustom(value);
      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue > 0) {
        setPoints(numValue);
      }
    }
  };

  const handleDrawPoints = async () => {
    try {
      await gameContext.drawPoints(playerId, numPointsToDraw);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Drew ${numPointsToDraw} point(s)`
      );
    } catch (error) {
      console.error('Error drawing points:', error);
    } finally {
      setDrawPointsPopoverOpen(false);
      setNumPointsToDraw(1);
      setCustomDrawPoints('');
    }
  };

  const handleGivePoints = async (recipient: string) => {
    try {
      await gameContext.givePoints(playerId, recipient, numPointsToGive);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Gave ${numPointsToGive} point(s) to ${recipient}`
      );
    } catch (error) {
      console.error('Error giving points:', error);
    } finally {
      setGivePointsPopoverOpen(false);
      setNumPointsToGive(1);
    }
  };

  const handleDiscard = async (
    playerId: number,
    cardId: number,
    pileId?: number,
    targetPlayerId?: number
  ) => {
    try {
      if (!gameContext.gameData.can_discard) {
        console.log('Discarding is not allowed in this game');
        return;
      }

      // Only check session.locked_player_discard if game setting is enabled
      if (
        gameContext.gameData.lock_player_discard &&
        gameContext.session.locked_player_discard
      ) {
        console.log('Player discarding is currently locked');
        return;
      }

      // Get all cards in the target pile (if it exists)
      const cardsInPile = gameContext.sessionCards.filter((card) => {
        if (pileId === undefined) {
          return false; // Deck discard
        }

        const pile = gameContext.discardPiles.find((p) => p.pile_id === pileId);
        if (!pile) return false;

        if (pile.is_player) {
          // For player piles, match both pile_id and playerid
          return card.pile_id === pileId && card.playerid === targetPlayerId;
        } else {
          // For board piles, just match pile_id
          return card.pile_id === pileId;
        }
      });

      if (pileId !== undefined) {
        const discardPile = gameContext.discardPiles.find(
          (p) => p.pile_id === pileId
        );
        if (!discardPile) throw new Error('Discard pile not found');

        // Determine the playerid value
        const newPlayerId: number | null = discardPile.is_player
          ? (targetPlayerId ?? null)
          : null;

        // Update positions of existing cards in pile
        const updates = cardsInPile.map((card) => ({
          sessionid: gameContext.sessionid,
          sessioncardid: card.sessioncardid,
          cardPosition: card.cardPosition + 1,
          playerid: newPlayerId,
          pile_id: pileId,
          isRevealed: discardPile.is_face_up,
        }));

        // Add the new card at position 1
        updates.push({
          sessionid: gameContext.sessionid,
          sessioncardid: cardId,
          cardPosition: 1,
          playerid: newPlayerId,
          pile_id: pileId,
          isRevealed: discardPile.is_face_up,
        });

        await updateSessionCards(updates);
      } else {
        // Original shuffle behavior for deck
        await discardAndShuffleCard(
          gameContext.sessionid,
          cardId,
          gameContext.sessionCards
        );
      }

      await pushPlayerAction(gameContext.sessionid, playerId, `Discarded card`);
    } catch (error) {
      console.error('Error discarding card:', error);
    }
  };

  const handleReveal = async (playerId: number, cardId: number) => {
    try {
      await gameContext.revealCard(playerId, cardId);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Revealed card ${cardId}`
      );
    } catch (error) {
      console.error('Error revealing card:', error);
    }
  };

  const handleEndTurn = async () => {
    try {
      await passTurnToNextPlayer(gameContext.sessionid, playerId);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        'Ended their turn'
      );
    } catch (error) {
      console.error('Error ending turn:', error);
    }
  };

  const handleDrawCard = async () => {
    try {
      await gameContext.drawCard(playerId, false);
      await pushPlayerAction(gameContext.sessionid, playerId, 'Drew a card');
    } catch (error) {
      console.error('Error drawing card:', error);
    }
  };

  const handleClaimTurn = async () => {
    try {
      await claimTurn(gameContext.sessionid, playerId);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        'Claimed their turn'
      );
    } catch (error) {
      console.error('Error claiming turn:', error);
    }
  };

  console.log('playerCards', playerCards);
  const anyPlayerHasTurn = gameContext.sessionPlayers.some(
    (player) => player.is_turn
  );
  const disabled =
    !currentPlayer.is_turn &&
    gameContext.gameData.lock_turn &&
    anyPlayerHasTurn;
  const atMaxCards =
    playerCards.length >= gameContext.gameData.max_cards_per_player;
  const deckCount = gameContext.sessionCards.filter(
    (card) => card.cardPosition > 0
  ).length;
  const noDeckCards = deckCount === 0;

  const getPlayerDiscardPiles = () => {
    return gameContext.discardPiles.filter(
      (pile) =>
        pile.is_player &&
        gameContext.sessionCards.some(
          (card) => card.pile_id === pile.pile_id && card.playerid === playerId
        )
    );
  };

  const canClaimTurn =
    gameContext.gameData.claim_turns &&
    !gameContext.sessionPlayers.some((player) => player.is_turn) &&
    !currentPlayer.is_turn;

  const handlePickUpFromDiscard = async (pileId: number) => {
    try {
      // Get cards from player's discard pile, sorted by position
      const pileCards = gameContext.sessionCards
        .filter((card) => card.pile_id === pileId && card.playerid === playerId)
        .sort((a, b) => a.cardPosition - b.cardPosition);

      if (pileCards.length === 0) return;

      // Update all cards to be in player's hand
      const updates = pileCards.map((card) => ({
        sessionid: gameContext.sessionid,
        sessioncardid: card.sessioncardid,
        cardPosition: 0,
        playerid: playerId,
        pile_id: null,
        isRevealed: false,
      }));

      await updateSessionCards(updates);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Picked up ${pileCards.length} cards from discard pile`
      );
    } catch (error) {
      console.error('Error picking up from discard:', error);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          {currentPlayer.username}&apos;s Hand
        </h2>

        {gameContext.gameData.game_rules && (
          <Dialog open={showRules} onOpenChange={setShowRules}>
            <DialogTrigger asChild>
              <Button variant="outline">Game Rules</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Game Rules</DialogTitle>
              </DialogHeader>
              <div className="prose dark:prose-invert mt-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {gameContext.gameData.game_rules ||
                    'No rules available for this game.'}
                </ReactMarkdown>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="flex flex-wrap gap-4 mb-6">
        {playerCards.map((card, index) => (
          <Dialog key={`${card.id}-${index}`}>
            <DialogTrigger asChild>
              <Card className="w-32 h-48 bg-gray-200 shadow-md cursor-pointer hover:shadow-lg transition-shadow relative">
                <CardContent className="flex items-center justify-center h-full">
                  <span className="text-lg font-semibold">{card.name}</span>
                  {card.isRevealed && (
                    <Badge
                      className="absolute top-2 right-2"
                      variant="secondary"
                    >
                      Revealed
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{card.name}</DialogTitle>
                <DialogDescription>{card.description}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 mt-4">
                {gameContext.gameData.can_reveal && (
                  <DialogClose asChild>
                    <Button
                      onClick={() => handleReveal(playerId, card.id)}
                      disabled={disabled}
                    >
                      {card.isRevealed ? 'Unreveal Card' : 'Reveal on Board'}
                    </Button>
                  </DialogClose>
                )}

                {gameContext.gameData.can_discard && (
                  <div className="flex flex-col gap-2">
                    {gameContext.discardPiles.length > 0 ? (
                      <>
                        <h4 className="text-sm font-semibold">Discard to:</h4>
                        {gameContext.discardPiles.map((pile) => {
                          if (pile.is_player) {
                            return gameContext.sessionPlayers.map((player) => (
                              <DialogClose
                                key={`${pile.pile_id}-${player.playerid}`}
                                asChild
                              >
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    handleDiscard(
                                      playerId,
                                      card.id,
                                      pile.pile_id,
                                      player.playerid
                                    )
                                  }
                                >
                                  {player.playerid === playerId
                                    ? 'Your Pile'
                                    : `${player.username}'s Pile`}
                                </Button>
                              </DialogClose>
                            ));
                          } else {
                            return (
                              <DialogClose key={pile.pile_id} asChild>
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    handleDiscard(
                                      playerId,
                                      card.id,
                                      pile.pile_id
                                    )
                                  }
                                >
                                  {pile.pile_name ||
                                    `Discard Pile ${pile.pile_id}`}
                                  {pile.is_face_up
                                    ? ' (Face Up)'
                                    : ' (Face Down)'}
                                </Button>
                              </DialogClose>
                            );
                          }
                        })}
                      </>
                    ) : (
                      <DialogClose asChild>
                        <Button
                          variant="outline"
                          onClick={() => handleDiscard(playerId, card.id)}
                        >
                          Discard to Deck
                        </Button>
                      </DialogClose>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-xl font-bold">
          Points: {currentPlayer.num_points || 0}
        </div>
        <div className="space-x-2">
          {gameContext.gameData.claim_turns && canClaimTurn && (
            <Button onClick={handleClaimTurn} variant="secondary">
              Claim
            </Button>
          )}

          {gameContext.gameData.can_draw_cards && (
            <Button
              onClick={handleDrawCard}
              disabled={disabled || atMaxCards || noDeckCards}
            >
              Draw Card ({deckCount})
            </Button>
          )}

          {gameContext.gameData.can_draw_points && (
            <Popover
              open={drawPointsPopoverOpen}
              onOpenChange={setDrawPointsPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  disabled={
                    disabled ||
                    !gameContext.session.num_points ||
                    gameContext.session.num_points <= 0
                  }
                >
                  Draw Points
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="flex flex-col items-center">
                  <span className="mb-2">Select Number of Points to Draw</span>
                  <div className="flex space-x-2 mb-2">
                    {[1, 2, 3].map((num) => (
                      <Button
                        key={num}
                        disabled={gameContext.session.num_points < num}
                        onClick={async () => {
                          // First set the number
                          setNumPointsToDraw(num);
                          // Use the number directly in the gameContext call
                          try {
                            await gameContext.drawPoints(playerId, num);
                            await pushPlayerAction(
                              gameContext.sessionid,
                              playerId,
                              `Drew ${num} point(s)`
                            );
                          } catch (error) {
                            console.error('Error drawing points:', error);
                          } finally {
                            setDrawPointsPopoverOpen(false);
                            setNumPointsToDraw(1);
                            setCustomDrawPoints('');
                          }
                        }}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                  <div className="w-full">
                    <div className="flex space-x-2">
                      <Input
                        type="text"
                        placeholder="Custom amount"
                        value={customDrawPoints}
                        onChange={(e) =>
                          handleCustomPointsChange(
                            e.target.value,
                            setNumPointsToDraw,
                            setCustomDrawPoints
                          )
                        }
                        className="w-full"
                      />
                      <Button
                        onClick={async () => {
                          const amount = numPointsToDraw;
                          try {
                            await gameContext.drawPoints(playerId, amount);
                            await pushPlayerAction(
                              gameContext.sessionid,
                              playerId,
                              `Drew ${amount} point(s)`
                            );
                          } catch (error) {
                            console.error('Error drawing points:', error);
                          } finally {
                            setDrawPointsPopoverOpen(false);
                            setNumPointsToDraw(1);
                            setCustomDrawPoints('');
                          }
                        }}
                        disabled={
                          !numPointsToDraw ||
                          !gameContext.session.num_points ||
                          gameContext.session.num_points < numPointsToDraw
                        }
                      >
                        Draw
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {gameContext.gameData.can_pass_points && (
            <Popover
              open={givePointsPopoverOpen}
              onOpenChange={setGivePointsPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button disabled={disabled || currentPlayer.num_points === 0}>
                  Pass Points
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="flex flex-col">
                  <span className="mb-2">Select Number of Points to Pass</span>
                  <div className="flex space-x-2 mb-2">
                    {[1, 2, 3].map((num) => (
                      <Button
                        key={num}
                        disabled={currentPlayer.num_points < num}
                        onClick={() => {
                          setNumPointsToGive(num);
                          setCustomGivePoints('');
                        }}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                  <div className="w-full mb-2">
                    <div className="flex space-x-2">
                      <Input
                        type="text"
                        placeholder="Custom amount"
                        value={customGivePoints}
                        onChange={(e) =>
                          handleCustomPointsChange(
                            e.target.value,
                            setNumPointsToGive,
                            setCustomGivePoints
                          )
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    {playerNames.map((name, index) => (
                      <Button
                        key={index}
                        onClick={() => {
                          handleGivePoints(name);
                          setCustomGivePoints('');
                          setGivePointsPopoverOpen(false);
                        }}
                        size="sm"
                        disabled={currentPlayer.num_points < numPointsToGive}
                      >
                        {name}
                      </Button>
                    ))}
                    <Button
                      onClick={() => {
                        handleGivePoints('Board');
                        setCustomGivePoints('');
                        setGivePointsPopoverOpen(false);
                      }}
                      size="sm"
                      disabled={currentPlayer.num_points < numPointsToGive}
                    >
                      Board
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {gameContext.gameData.turn_based && (
            <Button
              onClick={handleEndTurn}
              disabled={!currentPlayer.is_turn}
              variant={gameContext.gameData.lock_turn ? 'default' : 'outline'}
            >
              End Turn
            </Button>
          )}

          {gameContext.gameData.lock_player_discard &&
            !gameContext.session.locked_player_discard && (
              <>
                <Dialog
                  open={showDiscardPileDialog}
                  onOpenChange={setShowDiscardPileDialog}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">View My Discard Piles</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Your Discard Piles</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {getPlayerDiscardPiles().map((pile) => {
                        const pileCards = gameContext.sessionCards
                          .filter(
                            (card) =>
                              card.pile_id === pile.pile_id &&
                              card.playerid === playerId
                          )
                          .sort((a, b) => a.cardPosition - b.cardPosition);

                        return (
                          <div
                            key={pile.pile_id}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-medium">
                                {pile.pile_name ||
                                  `Discard Pile ${pile.pile_id}`}
                                ({pileCards.length} cards)
                              </h3>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handlePickUpFromDiscard(pile.pile_id)
                                }
                                disabled={pileCards.length === 0 || disabled}
                              >
                                Pick Up All
                              </Button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {pileCards.map((card, index) => {
                                const deck = gameContext.decks.find(
                                  (d) => d.deckid === card.deckid
                                );
                                const cardDetails = deck?.cards.find(
                                  (c) => c.cardid === card.cardid
                                );

                                return (
                                  <div
                                    key={card.sessioncardid}
                                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                  >
                                    <span className="text-sm">
                                      {cardDetails?.name || 'Unknown Card'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Position: {index + 1}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      {getPlayerDiscardPiles().length === 0 && (
                        <div className="text-center text-gray-500">
                          No discard piles available
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
        </div>
      </div>
    </div>
  );
}
