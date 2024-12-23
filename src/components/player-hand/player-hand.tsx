'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { discardAndShuffleCard, updateSessionCards } from '@/lib/supabase/card';
import {
  claimTurn,
  passTurnToNextPlayer,
  pushPlayerAction,
  updatePlayerLastAction,
} from '@/lib/supabase/player';
import { CardData, SessionCard } from '@/types/game-interfaces';
import { useEffect, useState } from 'react';
import { usePlayer } from '../player/player-context';
import { PlayerHandButtonBar } from './player-hand-button-bar';
import { PlayerHandCards } from './player-hand-cards';
import { PlayerHandHeader } from './player-hand-header';

interface TradeCardSelection {
  playerId: number;
  cardId: number | null;
}

export function PlayerHand() {
  const { player: currentPlayer, gameContext } = usePlayer();
  const playerId = currentPlayer?.playerid;
  console.log('PLAYER ID', playerId);
  const [numPointsToDraw, setNumPointsToDraw] = useState(1);
  const [customDrawPoints, setCustomDrawPoints] = useState<string>('');
  const [drawPointsPopoverOpen, setDrawPointsPopoverOpen] = useState(false);

  const [numPointsToGive, setNumPointsToGive] = useState(1);
  const [customGivePoints, setCustomGivePoints] = useState<string>('');
  const [givePointsPopoverOpen, setGivePointsPopoverOpen] = useState(false);

  const [showRules, setShowRules] = useState(false);
  const [showDiscardPileDialog, setShowDiscardPileDialog] = useState(false);
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [tradeFrom, setTradeFrom] = useState<TradeCardSelection>({
    playerId: -1,
    cardId: null,
  });
  const [tradeTo, setTradeTo] = useState<TradeCardSelection>({
    playerId: -1,
    cardId: null,
  });

  const [drawnCard, setDrawnCard] = useState<{
    name: string;
    description: string;
  } | null>(null);
  const [showPeakDialog, setShowPeakDialog] = useState(false);
  const [peakTarget, setPeakTarget] = useState<{
    playerId: number;
    cardId: number | null;
  }>({ playerId: -1, cardId: null });
  const [peakedCard, setPeakedCard] = useState<{
    name: string;
    description: string;
  } | null>(null);

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

  useEffect(() => {
    const checkContentHeight = () => {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        const isContentTooTall = mainContent.scrollHeight > window.innerHeight;
        mainContent.classList.toggle('content-too-tall', isContentTooTall);
      }
    };

    checkContentHeight();
    window.addEventListener('resize', checkContentHeight);
    return () => window.removeEventListener('resize', checkContentHeight);
  }, []);

  if (!gameContext || !playerId) {
    return <div>Loading game state...</div>;
  }

  const playerCards = gameContext.sessionCards
    .filter((card) => card.playerid === playerId && card.pile_id === null)
    .map((sessionCard, index) => {
      const deck = gameContext.decks.find(
        (d) => d.deckid === sessionCard.deckid
      );
      const cardDetails = deck?.cards.find(
        (c) => c.cardid === sessionCard.cardid
      );
      return {
        ...sessionCard,
        ...cardDetails,
        name: cardDetails?.name || 'Unknown Card',
        index,
      } as SessionCard & CardData;
    })
    .sort((a, b) => {
      if (a.type < b.type) return -1;
      if (a.type > b.type) return 1;
      return a.drop_order - b.drop_order;
    });

  console.log('PLAYER CARDS', playerCards);
  const playerNames =
    gameContext.sessionPlayers
      .map((player) => player.username)
      .filter((name) => name !== currentPlayer.username) || [];

  const handleCustomPointsChange = (
    value: string,
    setPoints: (n: number) => void,
    setCustom: (s: string) => void
  ) => {
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
      if (!gameContext.gameData.can_discard) return;

      if (
        gameContext.gameData.lock_player_discard &&
        gameContext.session.locked_player_discard
      ) {
        console.log('Player discarding is currently locked');
        return;
      }

      const cardsInPile = gameContext.sessionCards.filter((card) => {
        if (pileId === undefined) return false;
        const pile = gameContext.discardPiles.find((p) => p.pile_id === pileId);
        if (!pile) return false;

        if (pile.is_player) {
          return card.pile_id === pileId && card.playerid === targetPlayerId;
        } else {
          return card.pile_id === pileId;
        }
      });

      if (pileId !== undefined) {
        const discardPile = gameContext.discardPiles.find(
          (p) => p.pile_id === pileId
        );
        if (!discardPile) throw new Error('Discard pile not found');

        const newPlayerId: number | null = discardPile.is_player
          ? (targetPlayerId ?? null)
          : null;

        const updates = cardsInPile.map((card) => ({
          sessionid: gameContext.sessionid,
          sessioncardid: card.sessioncardid,
          cardPosition: card.cardPosition + 1,
          playerid: newPlayerId,
          pile_id: pileId,
          isRevealed: discardPile.is_face_up,
        }));

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

  const handleDrawCard = async (card_hidden: boolean = false) => {
    try {
      await gameContext.drawCard(playerId, card_hidden);

      // Only show card dialog for normal draws in hidden hand games
      if (!card_hidden && gameContext.session.hand_hidden) {
        const drawnCard = gameContext.sessionCards
          .filter((card) => card.playerid === playerId && card.pile_id === null)
          .sort((a, b) => b.sessioncardid - a.sessioncardid)[0];

        if (drawnCard) {
          const deck = gameContext.decks.find(
            (d) => d.deckid === drawnCard.deckid
          );
          const cardDetails = deck?.cards.find(
            (c) => c.cardid === drawnCard.cardid
          );
          if (cardDetails) {
            setDrawnCard({
              name: cardDetails.name || 'Unknown Card',
              description: cardDetails.description || '',
            });
          }
        }
      }

      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        card_hidden ? 'Drew a hidden card' : 'Drew a card'
      );
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

  const anyPlayerHasTurn = gameContext.sessionPlayers.some(
    (player) => player.is_turn
  );
  const disabled = gameContext.gameData.turn_based
    ? gameContext.gameData.lock_turn &&
      !currentPlayer.is_turn &&
      anyPlayerHasTurn
    : false;
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

  const handlePassCard = async (
    playerId: number,
    cardId: number,
    targetPlayerId: number
  ) => {
    try {
      const updates = [
        {
          sessionid: gameContext.sessionid,
          sessioncardid: cardId,
          cardPosition: 0,
          playerid: targetPlayerId,
          pile_id: null,
          isRevealed: false,
          card_hidden: false,
        },
      ];

      await updateSessionCards(updates);
      await pushPlayerAction(
        gameContext.sessionid,
        playerId,
        `Passed a card to ${gameContext.sessionPlayers.find((p) => p.playerid === targetPlayerId)?.username}`
      );
    } catch (error) {
      console.error('Error passing card:', error);
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
          card_hidden: false,
        },
        {
          sessionid: gameContext.sessionid,
          sessioncardid: tradeTo.cardId,
          cardPosition: 0,
          playerid: tradeFrom.playerId,
          pile_id: null,
          isRevealed: false,
          card_hidden: false,
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
      const playerCards = gameContext.sessionCards.filter(
        (card) => card.playerid === playerId && card.pile_id === null
      );

      const updates = playerCards.map((card) => ({
        sessionid: gameContext.sessionid,
        sessioncardid: card.sessioncardid,
        cardPosition: card.cardPosition,
        playerid: playerId,
        pile_id: null,
        card_hidden: !card.card_hidden,
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

  return (
    <div className="w-full h-full flex flex-col landscape:h-full bg-gray-100">
      <PlayerHandHeader
        currentPlayer={currentPlayer}
        gameRules={gameContext.gameData.game_rules}
        showRules={showRules}
        setShowRules={setShowRules}
      />

      <PlayerHandCards
        playerId={playerId}
        playerCards={playerCards}
        disabled={disabled}
      />

      <PlayerHandButtonBar
        gameContext={gameContext}
        playerId={playerId}
        currentPlayer={currentPlayer}
        playerCards={playerCards}
        playerNames={playerNames}
        disabled={disabled}
        atMaxCards={atMaxCards}
        noDeckCards={noDeckCards}
        deckCount={deckCount}
        showRules={showRules}
        setShowRules={setShowRules}
        handleDrawCard={handleDrawCard}
        getPlayerDiscardPiles={getPlayerDiscardPiles}
      />

      <Dialog open={drawnCard !== null} onOpenChange={() => setDrawnCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Card Drawn</DialogTitle>
            <DialogDescription>
              <div className="mt-4">
                <h3 className="font-bold">{drawnCard?.name}</h3>
                <p className="mt-2">{drawnCard?.description}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
