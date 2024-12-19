'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GameContextType } from "@/components/GameContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import { updateSessionCards } from "@/lib/supabase/card";
import { pushPlayerAction, claimTurn, passTurnToNextPlayer } from "@/lib/supabase/player";

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
  getPlayerDiscardPiles
}: PlayerHandButtonBarProps) {
  const [numPointsToDraw, setNumPointsToDraw] = useState(1);
  const [customDrawPoints, setCustomDrawPoints] = useState<string>('');
  const [drawPointsPopoverOpen, setDrawPointsPopoverOpen] = useState(false);
  const [numPointsToGive, setNumPointsToGive] = useState(1);
  const [customGivePoints, setCustomGivePoints] = useState<string>('');
  const [givePointsPopoverOpen, setGivePointsPopoverOpen] = useState(false);
  const [showDiscardPileDialog, setShowDiscardPileDialog] = useState(false);
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [tradeFrom, setTradeFrom] = useState<{ playerId: number, cardId: number | null }>({ playerId: -1, cardId: null });
  const [tradeTo, setTradeTo] = useState<{ playerId: number, cardId: null }>({ playerId: -1, cardId: null });
  const [showPeakDialog, setShowPeakDialog] = useState(false);
  const [peakTarget, setPeakTarget] = useState<{ playerId: number, cardId: number | null }>({ playerId: -1, cardId: null });
  const [peakedCard, setPeakedCard] = useState<{ name: string, description: string } | null>(null);

  const handleCustomPointsChange = (value: string, setPoints: (n: number) => void, setCustom: (s: string) => void) => {
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

  const handleEndTurn = async () => {
    try {
      await passTurnToNextPlayer(gameContext.sessionid, playerId);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        "Ended their turn"
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
        "Claimed their turn"
      );
    } catch (error) {
      console.error('Error claiming turn:', error);
    }
  };

  const handlePickUpFromDiscard = async (pileId: number) => {
    try {
      const pileCards = gameContext.sessionCards
        .filter(card => 
          card.pile_id === pileId && 
          card.playerid === playerId
        )
        .sort((a, b) => a.cardPosition - b.cardPosition);

      if (pileCards.length === 0) return;

      const updates = pileCards.map(card => ({
        sessionid: gameContext.sessionid,
        sessioncardid: card.sessioncardid,
        cardPosition: 0,
        playerid: playerId,
        pile_id: null,
        isRevealed: false
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
      const updates = [
        {
          sessionid: gameContext.sessionid,
          sessioncardid: tradeFrom.cardId,
          cardPosition: 0,
          playerid: tradeTo.playerId,
          pile_id: null,
          isRevealed: false,
          card_hidden: false
        },
        {
          sessionid: gameContext.sessionid,
          sessioncardid: tradeTo.cardId,
          cardPosition: 0,
          playerid: tradeFrom.playerId,
          pile_id: null,
          isRevealed: false,
          card_hidden: false
        }
      ];

      await updateSessionCards(updates);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Traded cards between ${
          gameContext.sessionPlayers.find(p => p.playerid === tradeFrom.playerId)?.username
        } and ${
          gameContext.sessionPlayers.find(p => p.playerid === tradeTo.playerId)?.username
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
      const sessionCard = gameContext.sessionCards.find(sc => sc.sessioncardid === peakTarget.cardId);
      if (!sessionCard) return;

      const deck = gameContext.decks.find(d => d.deckid === sessionCard.deckid);
      const cardDetails = deck?.cards.find(c => c.cardid === sessionCard.cardid);
      
      if (cardDetails) {
        setPeakedCard({
          name: cardDetails.name,
          description: cardDetails.description
        });
      }

      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Peaked at a card from ${
          gameContext.sessionPlayers.find(p => p.playerid === peakTarget.playerId)?.username
        }`
      );
    } catch (error) {
      console.error('Error peaking at card:', error);
    }
  };

  const handleToggleHandVisibility = async () => {
    try {
      const updates = playerCards.map(card => ({
        sessionid: gameContext.sessionid,
        sessioncardid: card.id,
        cardPosition: 0,
        playerid: playerId,
        pile_id: null,
        card_hidden: !card.hidden
      }));

      await updateSessionCards(updates);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        "Toggled hand visibility"
      );
    } catch (error) {
      console.error('Error toggling hand visibility:', error);
    }
  };

  const canClaimTurn = gameContext.gameData.claim_turns && 
    !gameContext.sessionPlayers.some(player => player.is_turn) &&
    !currentPlayer.is_turn;

  return (
    <div className="fixed bottom-0 w-full bg-white p-2 border-t border-gray-300">
      <div className="flex flex-wrap gap-2 justify-end">
        {gameContext.gameData.claim_turns && canClaimTurn && (
          <Button
            onClick={handleClaimTurn}
            variant="secondary"
          >
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
          <Popover open={drawPointsPopoverOpen} onOpenChange={setDrawPointsPopoverOpen}>
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
              {/* ... Draw Points Content ... */}
            </PopoverContent>
          </Popover>
        )}

        {/* Pass Points Button */}
        {gameContext.gameData.can_pass_points && (
          <Popover open={givePointsPopoverOpen} onOpenChange={setGivePointsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                disabled={
                  disabled ||
                  currentPlayer.num_points === 0
                }
              >
                Pass Points
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              {/* ... Pass Points Content ... */}
            </PopoverContent>
          </Popover>
        )}

        {/* End Turn Button */}
        {gameContext.gameData.turn_based && (
          <Button 
            onClick={handleEndTurn}
            disabled={!currentPlayer.is_turn}
            variant={gameContext.gameData.lock_turn ? "default" : "outline"}
          >
            End Turn
          </Button>
        )}

        {/* View Discard Button */}
        {gameContext.gameData.lock_player_discard && !gameContext.session.locked_player_discard && (
          <Dialog open={showDiscardPileDialog} onOpenChange={setShowDiscardPileDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                View Discard
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              {/* ... Discard Dialog Content ... */}
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
              {/* ... Trade Dialog Content ... */}
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
                {/* ... Peak Dialog Content ... */}
              </DialogContent>
            </Dialog>

            <Dialog open={peakedCard !== null} onOpenChange={() => setPeakedCard(null)}>
              <DialogContent>
                {/* ... Peaked Card Content ... */}
              </DialogContent>
            </Dialog>
          </>
        )}

        {/* Toggle Hand Visibility Button */}
        {gameContext.session.hand_hidden && (
          <Button
            onClick={handleToggleHandVisibility}
            variant="outline"
          >
            {playerCards.some(card => card.hidden) ? 'Unhide Hand' : 'Hide Hand'}
          </Button>
        )}

        {/* Rules Button (Desktop Only) */}
        <div className="hidden md:block">
          {gameContext.gameData.game_rules && (
            <Dialog open={showRules} onOpenChange={setShowRules}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  Game Rules
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Game Rules</DialogTitle>
                </DialogHeader>
                <div className="prose dark:prose-invert mt-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {gameContext.gameData.game_rules || 'No rules available for this game.'}
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
