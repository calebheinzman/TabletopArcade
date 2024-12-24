'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateSessionCards } from '@/lib/supabase/card';
import {
  claimTurn,
  passTurnToNextPlayer,
  pushPlayerAction,
} from '@/lib/supabase/player';
import { GameContextType } from '@/providers/game-provider';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PlayerHandButtonBarProps {
  gameContext: GameContextType;
  playerId: number;
  currentPlayer: any;
  playerCards: any[];
  playerNames: string[];
  disabled: boolean;
  atMaxCards: boolean;
  noDeckCards: boolean;
  deckCount: number;
  showRules: boolean;
  setShowRules: (show: boolean) => void;
  handleDrawCard: (hidden: boolean) => Promise<void>;
  getPlayerDiscardPiles: () => any[];
}

export function PlayerHandButtonBar({
  gameContext,
  playerId,
  currentPlayer,
  playerCards,
  playerNames,
  disabled,
  atMaxCards,
  noDeckCards,
  deckCount,
  showRules,
  setShowRules,
  handleDrawCard,
  getPlayerDiscardPiles,
}: PlayerHandButtonBarProps) {
  const [numPointsToDraw, setNumPointsToDraw] = useState(1);
  const [customDrawPoints, setCustomDrawPoints] = useState<string>('');
  const [drawPointsPopoverOpen, setDrawPointsPopoverOpen] = useState(false);
  const [numPointsToGive, setNumPointsToGive] = useState(1);
  const [customGivePoints, setCustomGivePoints] = useState<string>('');
  const [givePointsPopoverOpen, setGivePointsPopoverOpen] = useState(false);
  const [showDiscardPileDialog, setShowDiscardPileDialog] = useState(false);
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [tradeFrom, setTradeFrom] = useState<{
    playerId: number;
    cardId: number | null;
  }>({ playerId: -1, cardId: null });
  const [tradeTo, setTradeTo] = useState<{
    playerId: number;
    cardId: number | null;
  }>({ playerId: -1, cardId: null });
  const [showPeakDialog, setShowPeakDialog] = useState(false);
  const [peakTarget, setPeakTarget] = useState<{
    playerId: number;
    cardId: number | null;
  }>({ playerId: -1, cardId: null });
  const [peakedCard, setPeakedCard] = useState<{
    name: string;
    description: string;
  } | null>(null);

  const handleCustomPointsChange = (
    value: string,
    setPoints: (n: number) => void,
    setCustom: (s: string) => void
  ) => {
    if (/^\d*$/.test(value)) {
      setCustom(value);
      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue > 0) {
        setPoints(Math.min(numValue, currentPlayer.num_points));
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

  const handlePickUpFromDiscard = async (pileId: number) => {
    try {
      const pileCards = gameContext.sessionCards
        .filter((card) => card.pile_id === pileId && card.playerid === playerId)
        .sort((a, b) => a.cardPosition - b.cardPosition);

      if (pileCards.length === 0) return;

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

  const handleTrade = async () => {
    if (!tradeFrom.cardId || !tradeTo.cardId) return;

    try {
      const fromCard = gameContext.sessionCards.find(
        (c) => c.sessioncardid === tradeFrom.cardId
      );
      const toCard = gameContext.sessionCards.find(
        (c) => c.sessioncardid === tradeTo.cardId
      );

      const updates = [
        {
          sessionid: gameContext.sessionid,
          sessioncardid: tradeFrom.cardId,
          cardPosition: 0,
          playerid: tradeTo.playerId,
          pile_id: null,
          isRevealed: false,
          card_hidden: toCard?.card_hidden ?? false,
        },
        {
          sessionid: gameContext.sessionid,
          sessioncardid: tradeTo.cardId,
          cardPosition: 0,
          playerid: tradeFrom.playerId,
          pile_id: null,
          isRevealed: false,
          card_hidden: fromCard?.card_hidden ?? false,
        },
      ];

      await updateSessionCards(updates);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Traded cards between ${
          gameContext.sessionPlayers.find(
            (p) => p.playerid === tradeFrom.playerId
          )?.username
        } and ${
          gameContext.sessionPlayers.find(
            (p) => p.playerid === tradeTo.playerId
          )?.username
        }`
      );
      setShowTradeDialog(false);
      setTradeFrom({ playerId: -1, cardId: null });
      setTradeTo({ playerId: -1, cardId: null });
    } catch (error) {
      console.error('Error trading cards:', error);
    }
  };

  const handlePeakCard = async () => {
    if (!peakTarget.cardId) return;

    try {
      const sessionCard = gameContext.sessionCards.find(
        (sc) => sc.sessioncardid === peakTarget.cardId
      );
      if (!sessionCard) return;

      const deck = gameContext.decks.find(
        (d) => d.deckid === sessionCard.deckid
      );
      const cardDetails = deck?.cards.find(
        (c) => c.cardid === sessionCard.cardid
      );

      if (cardDetails) {
        setPeakedCard({
          name: cardDetails.name,
          description: cardDetails.description,
        });
      }

      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Peaked at a card from ${
          gameContext.sessionPlayers.find(
            (p) => p.playerid === peakTarget.playerId
          )?.username
        }`
      );
    } catch (error) {
      console.error('Error peaking at card:', error);
    }
  };

  const handleToggleHandVisibility = async () => {
    try {
      const updates = playerCards.map((card) => ({
        sessionid: gameContext.sessionid,
        sessioncardid: card.id,
        cardPosition: 0,
        playerid: playerId,
        pile_id: null,
        card_hidden: !card.hidden,
      }));

      await updateSessionCards(updates);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        'Toggled hand visibility'
      );
    } catch (error) {
      console.error('Error toggling hand visibility:', error);
    }
  };

  const canClaimTurn =
    gameContext.gameData.claim_turns &&
    !gameContext.sessionPlayers.some((player) => player.is_turn) &&
    !currentPlayer.is_turn;

  return (
    <div className="fixed bottom-0 w-full bg-white p-2 border-t border-gray-300">
      <div className="flex flex-wrap gap-2 justify-end">
        {gameContext.gameData.claim_turns && canClaimTurn && (
          <Button onClick={handleClaimTurn} variant="secondary">
            Claim
          </Button>
        )}

        {gameContext.gameData.can_draw_cards && (
          <>
            <Button
              onClick={() => handleDrawCard(false)}
              disabled={disabled || atMaxCards || noDeckCards}
            >
              Draw Card ({deckCount})
            </Button>
            {gameContext.session.hand_hidden && (
              <Button
                onClick={() => handleDrawCard(true)}
                disabled={disabled || atMaxCards || noDeckCards}
              >
                Draw Hidden
              </Button>
            )}
          </>
        )}

        {/* Draw Points Button */}
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
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setNumPointsToDraw(Math.max(1, numPointsToDraw - 1))
                    }
                  >
                    -
                  </Button>
                  <Input
                    type="text"
                    value={customDrawPoints || numPointsToDraw}
                    onChange={(e) =>
                      handleCustomPointsChange(
                        e.target.value,
                        setNumPointsToDraw,
                        setCustomDrawPoints
                      )
                    }
                    className="w-20 text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNumPointsToDraw(numPointsToDraw + 1)}
                  >
                    +
                  </Button>
                </div>
                <Button onClick={handleDrawPoints}>Draw Points</Button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Pass Points Button */}
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
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setNumPointsToGive(Math.max(1, numPointsToGive - 1))
                    }
                  >
                    -
                  </Button>
                  <Input
                    type="text"
                    value={customGivePoints || numPointsToGive}
                    onChange={(e) =>
                      handleCustomPointsChange(
                        e.target.value,
                        setNumPointsToGive,
                        setCustomGivePoints
                      )
                    }
                    className="w-20 text-center"
                    max={currentPlayer.num_points}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setNumPointsToGive(
                        Math.min(numPointsToGive + 1, currentPlayer.num_points)
                      )
                    }
                  >
                    +
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground text-center">
                  Available Points: {currentPlayer.num_points}
                </div>
                <Select onValueChange={handleGivePoints}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {playerNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* End Turn Button */}
        {gameContext.gameData.turn_based && (
          <Button
            onClick={handleEndTurn}
            disabled={!currentPlayer.is_turn}
            variant={gameContext.gameData.lock_turn ? 'default' : 'outline'}
          >
            End Turn
          </Button>
        )}

        {/* View Discard Button */}
        {gameContext.gameData.lock_player_discard &&
          !gameContext.session.locked_player_discard && (
            <Dialog
              open={showDiscardPileDialog}
              onOpenChange={setShowDiscardPileDialog}
            >
              <DialogTrigger asChild>
                <Button variant="outline">View Discard</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Discard Piles</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {gameContext.discardPiles
                    .filter((pile) => pile.is_player)
                    .map((pile) => {
                      const pileCards = gameContext.sessionCards.filter(
                        (card) =>
                          card.pile_id === pile.pile_id &&
                          card.playerid === playerId // Only show cards belonging to current player
                      );

                      // Only render if there are cards belonging to this player
                      if (pileCards.length === 0) return null;

                      return (
                        <div
                          key={pile.pile_id}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold">Your Discard Pile</h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handlePickUpFromDiscard(pile.pile_id)
                              }
                              disabled={pileCards.length === 0}
                            >
                              Pick Up
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {pileCards.map((card) => {
                              const deck = gameContext.decks.find(
                                (d) => d.deckid === card.deckid
                              );
                              const cardDetails = deck?.cards.find(
                                (c) => c.cardid === card.cardid
                              );
                              return (
                                <div
                                  key={card.sessioncardid}
                                  className="text-sm"
                                >
                                  {cardDetails?.name || 'Unknown Card'}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                    .filter(Boolean)}{' '}
                  {/* Remove null entries */}
                </div>
              </DialogContent>
            </Dialog>
          )}

        {/* Trade Cards Button */}
        {gameContext.gameData.trade_cards && (
          <Dialog open={showTradeDialog} onOpenChange={setShowTradeDialog}>
            <DialogTrigger asChild>
              <Button>Trade Cards</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Trade Cards</DialogTitle>
                <DialogDescription>
                  Select two players and their cards to trade
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 mt-4">
                {/* First Player Selection */}
                <div className="space-y-2">
                  <h4>First Player</h4>
                  <Select
                    onValueChange={(value) =>
                      setTradeFrom({ ...tradeFrom, playerId: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select player" />
                    </SelectTrigger>
                    <SelectContent>
                      {gameContext.sessionPlayers.map((player) => (
                        <SelectItem
                          key={player.playerid}
                          value={player.playerid.toString()}
                        >
                          {player.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {tradeFrom.playerId !== -1 && (
                    <Select
                      onValueChange={(value) =>
                        setTradeFrom({ ...tradeFrom, cardId: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select card" />
                      </SelectTrigger>
                      <SelectContent>
                        {gameContext.sessionCards
                          .filter(
                            (card) =>
                              card.playerid === tradeFrom.playerId &&
                              card.pile_id === null
                          )
                          .map((card, index) => {
                            const deck = gameContext.decks.find(
                              (d) => d.deckid === card.deckid
                            );
                            const cardDetails = deck?.cards.find(
                              (c) => c.cardid === card.cardid
                            );
                            return (
                              <SelectItem
                                key={card.sessioncardid}
                                value={card.sessioncardid.toString()}
                              >
                                {gameContext.session.hand_hidden
                                  ? `Card ${index + 1}`
                                  : cardDetails?.name || 'Unknown Card'}
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Second Player Selection */}
                <div className="space-y-2">
                  <h4>Second Player</h4>
                  <Select
                    onValueChange={(value) =>
                      setTradeTo({ ...tradeTo, playerId: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select player" />
                    </SelectTrigger>
                    <SelectContent>
                      {gameContext.sessionPlayers.map((player) => (
                        <SelectItem
                          key={player.playerid}
                          value={player.playerid.toString()}
                        >
                          {player.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {tradeTo.playerId !== -1 && (
                    <Select
                      onValueChange={(value) =>
                        setTradeTo({ ...tradeTo, cardId: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select card" />
                      </SelectTrigger>
                      <SelectContent>
                        {gameContext.sessionCards
                          .filter(
                            (card) =>
                              card.playerid === tradeTo.playerId &&
                              card.pile_id === null
                          )
                          .map((card, index) => {
                            const deck = gameContext.decks.find(
                              (d) => d.deckid === card.deckid
                            );
                            const cardDetails = deck?.cards.find(
                              (c) => c.cardid === card.cardid
                            );
                            return (
                              <SelectItem
                                key={card.sessioncardid}
                                value={card.sessioncardid.toString()}
                              >
                                {gameContext.session.hand_hidden
                                  ? `Card ${index + 1}`
                                  : cardDetails?.name || 'Unknown Card'}
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Button
                  onClick={handleTrade}
                  disabled={!tradeFrom.cardId || !tradeTo.cardId}
                >
                  Trade Cards
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Peak Cards Button */}
        {gameContext.gameData.peak_cards && (
          <>
            <Dialog open={showPeakDialog} onOpenChange={setShowPeakDialog}>
              <DialogTrigger asChild>
                <Button>Peak at Card</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Peak at Card</DialogTitle>
                  <DialogDescription>
                    Select a player and card to peak at
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 mt-4">
                  <Select
                    onValueChange={(value) =>
                      setPeakTarget({
                        ...peakTarget,
                        playerId: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select player" />
                    </SelectTrigger>
                    <SelectContent>
                      {gameContext.sessionPlayers
                        .filter((player) => player.playerid !== playerId)
                        .map((player) => (
                          <SelectItem
                            key={player.playerid}
                            value={player.playerid.toString()}
                          >
                            {player.username}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {peakTarget.playerId !== -1 && (
                    <Select
                      onValueChange={(value) =>
                        setPeakTarget({
                          ...peakTarget,
                          cardId: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select card" />
                      </SelectTrigger>
                      <SelectContent>
                        {gameContext.sessionCards
                          .filter(
                            (card) =>
                              card.playerid === peakTarget.playerId &&
                              card.pile_id === null
                          )
                          .map((card, index) => (
                            <SelectItem
                              key={card.sessioncardid}
                              value={card.sessioncardid.toString()}
                            >
                              Card {index + 1}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Button
                    onClick={handlePeakCard}
                    disabled={!peakTarget.cardId}
                  >
                    Peak at Card
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={peakedCard !== null}
              onOpenChange={() => setPeakedCard(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Peaked Card</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <h3 className="font-bold">{peakedCard?.name}</h3>
                  <p className="mt-2">{peakedCard?.description}</p>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}

        {/* Toggle Hand Visibility Button */}
        {gameContext.session.hand_hidden && (
          <Button onClick={handleToggleHandVisibility} variant="outline">
            {playerCards.some((card) => card.hidden)
              ? 'Unhide Hand'
              : 'Hide Hand'}
          </Button>
        )}

        {/* Rules Button (Desktop Only) */}
        <div className="hidden md:block">
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
      </div>
    </div>
  );
}
