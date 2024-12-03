// components/board/BoardHeader.tsx

'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import { Button } from '../ui/button';

interface BoardHeaderProps {
  deckCount: number;
}

const BoardHeader: React.FC<BoardHeaderProps> = ({ deckCount }) => {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
      <Button onClick={() => router.back()} size="sm" className="self-start">
        Back
      </Button>
      <div className="space-x-2 self-end">
        <Button size="sm">Draw Card ({deckCount})</Button>
        <Button size="sm">Give Token</Button>
        <Button size="sm">Discard Card</Button>
      </div>
    </div>
  );
};

export default BoardHeader;
