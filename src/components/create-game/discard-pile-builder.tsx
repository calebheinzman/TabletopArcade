'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DiscardPile } from '@/types/game-interfaces';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CardSettings {
  row: number;
  col: number;
  is_face_up: boolean;
  hide_values: boolean;
}

interface DiscardPileGridSelectorProps {
  title: string;
  initialRows: number;
  initialColumns: number;
  initialCardSettings: CardSettings[];
  onSelectionChange: (rows: number, columns: number, cardSettings: CardSettings[]) => void;
  maxRows?: number;
  maxColumns?: number;
  cardBackImage?: string;
}

const InfoTooltip = ({ content }: { content: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <Info className="h-4 w-4 ml-2 text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs">{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const CardSettingsDialog: React.FC<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  settings: CardSettings;
  onSave: (settings: CardSettings) => void;
}> = ({ isOpen, onOpenChange, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleFaceUpChange = (checked: boolean) => {
    setLocalSettings({
      ...localSettings,
      is_face_up: checked,
      hide_values: checked ? localSettings.hide_values : true
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Card Settings</DialogTitle>
          <DialogDescription>
            Configure the card at position ({settings.row}, {settings.col})
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="is_face_up" className="flex items-center">
              Face Up
              <InfoTooltip content="Card faces are visible." />
            </Label>
            <Switch
              id="is_face_up"
              checked={localSettings.is_face_up}
              onCheckedChange={handleFaceUpChange}
            />
          </div>
          <div className="flex items-center justify-between mb-2">
            <Label 
              htmlFor="hide_values" 
              className={`flex items-center ${!localSettings.is_face_up ? 'text-gray-400' : ''}`}
            >
              Hide Values
              <InfoTooltip content="When enabled, all players cannot see the cards in this pile. When disabled, all cards are visible." />
            </Label>
            <Switch
              id="hide_values"
              checked={localSettings.hide_values}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, hide_values: checked })
              }
              disabled={!localSettings.is_face_up}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => {
              onSave(localSettings);
              onOpenChange(false);
            }}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DiscardPileGridSelector: React.FC<DiscardPileGridSelectorProps> = ({
  title,
  initialRows,
  initialColumns,
  initialCardSettings,
  onSelectionChange,
  maxRows = 10,
  maxColumns = 10,
  cardBackImage = '/path/to/card-back.png'
}) => {
  const [hoveredRows, setHoveredRows] = useState(initialRows);
  const [hoveredCols, setHoveredCols] = useState(initialColumns);
  const [finalRows, setFinalRows] = useState(initialRows);
  const [finalCols, setFinalCols] = useState(initialColumns);
  const [locked, setLocked] = useState(initialCardSettings.length > 0);
  const [selectedCard, setSelectedCard] = useState<CardSettings | null>(null);
  const [cardSettings, setCardSettings] = useState<CardSettings[]>(initialCardSettings);

  let displayedRows = hoveredRows < maxRows ? hoveredRows + 1 : hoveredRows;
  let displayedCols = hoveredCols < maxColumns ? hoveredCols + 1 : hoveredCols;

  if (locked) {
    displayedRows = finalRows;
    displayedCols = finalCols;
  }

  const handleMouseEnter = (r: number, c: number) => {
    if (locked) return;

    // Adjust hoveredRows
    if (r <= hoveredRows) {
      setHoveredRows((prev) => Math.max(r, 1));
    } else if (r === hoveredRows + 1 && hoveredRows < maxRows) {
      setHoveredRows(r);
    }

    // Adjust hoveredCols
    if (c <= hoveredCols) {
      setHoveredCols((prev) => Math.max(c, 1));
    } else if (c === hoveredCols + 1 && hoveredCols < maxColumns) {
      setHoveredCols(c);
    }
  };

  const handleClickToLock = (r: number, c: number) => {
    // Update final selection and lock it in
    setFinalRows(r);
    setFinalCols(c);
    setLocked(true);
    
    // Create default settings for all cells in the grid if none exist
    const defaultSettings: CardSettings[] = [];
    for (let row = 1; row <= r; row++) {
      for (let col = 1; col <= c; col++) {
        const existingSetting = cardSettings.find(s => s.row === row && s.col === col);
        if (!existingSetting) {
          defaultSettings.push({
            row,
            col,
            is_face_up: false,
            hide_values: false
          });
        }
      }
    }
    
    // Combine existing settings with new default settings
    const allSettings = [...cardSettings, ...defaultSettings];
    setCardSettings(allSettings);
    onSelectionChange(r, c, allSettings);
  };

  const handleEdit = () => {
    // Unlock and reset hovered rows/cols to final selection
    setLocked(false);
    setHoveredRows(finalRows);
    setHoveredCols(finalCols);
  };

  const handleSaveCardSettings = (settings: CardSettings) => {
    console.log('handleSaveCardSettings', settings);
    setCardSettings(prevSettings => {
      const filteredSettings = prevSettings.filter(
        s => s.row !== settings.row || s.col !== settings.col
      );
      return [...filteredSettings, settings];
    });
  };

  useEffect(() => {
    // Whenever cardSettings, finalRows, or finalCols change, notify parent
    onSelectionChange(finalRows, finalCols, cardSettings);
  }, [cardSettings, finalRows, finalCols, onSelectionChange]);

  const handleCardClick = (r: number, c: number) => {
    if (!locked) {
      // Lock configuration if not locked
      handleClickToLock(r, c);
      return;
    }

    // If locked, open card settings dialog
    const existingSettings = getCardSettings(r, c);
    setSelectedCard(existingSettings);
  };

  const getCardSettings = (row: number, col: number) => {
    return (
      cardSettings.find(s => s.row === row && s.col === col) || {
        row,
        col,
        is_face_up: false,
        hide_values: false
      }
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center">
        {title}
        <InfoTooltip content={title === "Board Discard Piles" ? "Discard piles that appear on the game board. All players can see and interact with these piles." : "Personal discard piles that each player gets. Only visible to the owning player unless face-up."} />
      </h2>
      <div className="mb-2 text-sm text-gray-700 flex items-center space-x-2">
        <span>Selected: {finalRows} x {finalCols}</span>
        {locked && (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            Edit Pile
          </Button>
        )}
      </div>
      <div
        className="inline-grid gap-1"
        style={{
          gridTemplateRows: `repeat(${displayedRows}, auto)`,
          gridTemplateColumns: `repeat(${displayedCols}, auto)`
        }}
      >
        {Array.from({ length: displayedRows }, (_, rowIndex) =>
          Array.from({ length: displayedCols }, (_, colIndex) => {
            const r = rowIndex + 1;
            const c = colIndex + 1;
            const isWithinHoveredArea = r <= hoveredRows && c <= hoveredCols;
            const isGhostRow = !locked && r === hoveredRows + 1 && r <= maxRows;
            const isGhostCol = !locked && c === hoveredCols + 1 && c <= maxColumns;
            const isGhostCell = isGhostRow || isGhostCol;
            const cardData = getCardSettings(r, c);

            let cellClasses = 'relative w-24 h-36 rounded-sm cursor-pointer transition-all';
            let cellStyle: React.CSSProperties = {};

            if (isGhostCell) {
              // Ghost cell styling
              cellClasses += ' border-2 border-gray-300 border-dashed';
              cellStyle.backgroundColor = '#f9f9f9';
            } else {
              // Normal cell styling
              cellClasses += ' border-2';
              if (isWithinHoveredArea) {
                cellClasses += ' border-blue-500';
              } else {
                cellClasses += ' border-gray-300';
              }

              // Show a different background depending on face_up state
              if (cardData.is_face_up) {
                // Face up: white background
                cellStyle.backgroundColor = '#ffffff';
              } else {
                // Face down: show card back
                cellStyle.backgroundImage = `url(${cardBackImage})`;
                cellStyle.backgroundSize = 'cover';
                cellStyle.backgroundPosition = 'center';
              }
            }

            return (
              <div
                key={`${r}-${c}`}
                className={cellClasses}
                style={cellStyle}
                onMouseEnter={() => handleMouseEnter(r, c)}
                onClick={() => handleCardClick(r, c)}
              >
                {locked && !isGhostCell && (
                  <div className="absolute inset-0 flex flex-col items-center bg-white/90 rounded-sm p-2">
                    <div className="text-xs text-gray-500 mt-1">
                      Card {r}-{c}
                    </div>
                    <div className="text-xs space-y-1.5 mt-2">
                      <div
                        className={`px-1.5 py-0.5 rounded-full transition-colors text-[10px] whitespace-nowrap ${
                          cardData.is_face_up
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {cardData.is_face_up ? 'Face Up' : 'Face Down'}
                      </div>
                      <div
                        className={`px-1.5 py-0.5 rounded-full transition-colors text-[10px] whitespace-nowrap ${
                          cardData.hide_values
                            ? 'bg-gray-800 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {cardData.hide_values ? 'Values Hidden' : 'Values Shown'}
                      </div>
                    </div>
                    <div className="absolute bottom-1 right-1 text-[10px] text-gray-500 hover:text-gray-700 transition-colors">
                      Click to edit
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <CardSettingsDialog
        isOpen={selectedCard !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedCard(null);
        }}
        settings={selectedCard || { row: 0, col: 0, is_face_up: false, hide_values: false }}
        onSave={handleSaveCardSettings}
      />
    </div>
  );
};

interface DiscardPileBuilderProps {
  initialBoardPiles: DiscardPile[];
  initialPlayerPiles: DiscardPile[];
  onComplete: (boardPiles: DiscardPile[], playerPiles: DiscardPile[]) => void;
  onCancel: () => void;
}

export default function DiscardPileBuilder({
  initialBoardPiles,
  initialPlayerPiles,
  onComplete,
  onCancel
}: DiscardPileBuilderProps) {
  const router = useRouter();

  // We'll maintain separate state for board and player piles
  const [boardSettings, setBoardSettings] = useState<{
    rows: number;
    columns: number;
    cardSettings: CardSettings[];
  }>({
    rows: 1,
    columns: 1,
    cardSettings: initialBoardPiles.map(pile => ({
      row: pile.y_pos,
      col: pile.x_pos,
      is_face_up: pile.is_face_up,
      hide_values: pile.hide_values
    }))
  });

  const [playerSettings, setPlayerSettings] = useState<{
    rows: number;
    columns: number;
    cardSettings: CardSettings[];
  }>({
    rows: 1,
    columns: 1,
    cardSettings: initialPlayerPiles.map(pile => ({
      row: pile.y_pos,
      col: pile.x_pos,
      is_face_up: pile.is_face_up,
      hide_values: pile.hide_values
    }))
  });

  const handleBoardSelectionChange = useCallback((r: number, c: number, cardSettings: CardSettings[]) => {
    setBoardSettings({ rows: r, columns: c, cardSettings });
  }, []);

  const handlePlayerSelectionChange = useCallback((r: number, c: number, cardSettings: CardSettings[]) => {
    setPlayerSettings({ rows: r, columns: c, cardSettings });
  }, []);

  const handleSave = () => {
    const boardPiles = boardSettings.cardSettings.map(card => ({
      pile_id: 0,
      is_player: false,
      is_face_up: card.is_face_up,
      hide_values: card.hide_values,
      game_id: 0,
      x_pos: card.col,
      y_pos: card.row,
      pile_name: `Board Pile ${card.row}-${card.col}`
    }));

    const playerPiles = playerSettings.cardSettings.map(card => ({
      pile_id: 0,
      is_player: true,
      is_face_up: card.is_face_up,
      hide_values: card.hide_values,
      game_id: 0,
      x_pos: card.col,
      y_pos: card.row,
      pile_name: `Player Pile ${card.row}-${card.col}`
    }));

    onComplete(boardPiles, playerPiles);
  };

  const handleBack = () => {
    onCancel();
  };

  return (
    <div className="space-y-8 p-4 pb-16">
      <div className="flex justify-between items-center">
        <Button onClick={handleBack}>Back</Button>
        <Button onClick={handleSave}>Save & Return</Button>
      </div>
      
      <DiscardPileGridSelector
        title="Board Discard Piles"
        initialRows={boardSettings.rows}
        initialColumns={boardSettings.columns}
        initialCardSettings={boardSettings.cardSettings}
        onSelectionChange={handleBoardSelectionChange}
      />
      <DiscardPileGridSelector
        title="Player Discard Piles"
        initialRows={playerSettings.rows}
        initialColumns={playerSettings.columns}
        initialCardSettings={playerSettings.cardSettings}
        onSelectionChange={handlePlayerSelectionChange}
      />
    </div>
  );
}