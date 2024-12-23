'use client';

import { PlayerHand } from '@/components/player-hand/player-hand';
import PlayerHeader from '@/components/player/player-header';

export default function PlayerHandContent() {
  return (
    <div className="flex flex-col w-screen h-screen bg-white overflow-hidden">
      {/* Only show header on desktop */}
      <PlayerHeader />

      <main
        className="flex-grow md:h-[90vh] h-screen overflow-hidden p-0"
        id="main-content"
      >
        <PlayerHand />
      </main>
    </div>
  );
}
