// hooks/usePlayerPosition.ts

import { useMemo } from 'react';

const usePlayerPosition = (
  index: number,
  totalPlayers: number
): React.CSSProperties => {
  return useMemo(() => {
    const angle = (360 / totalPlayers) * index;
    const radians = (angle * Math.PI) / 180;
    const radius = 40; // Base radius
    
    // Adjust vertical position for top player in 4-player layout
    let topOffset = 47 + radius * Math.sin(radians);
    if (totalPlayers === 4 && index === 0) {
      topOffset = 40; // Move top player up by reducing percentage
    }

    return {
      top: `${topOffset}%`,
      left: `${50 + radius * Math.cos(radians)}%`,
    };
  }, [index, totalPlayers]);
};

export default usePlayerPosition;
