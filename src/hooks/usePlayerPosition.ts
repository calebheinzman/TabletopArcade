// hooks/usePlayerPosition.ts

import { useMemo } from 'react';

const usePlayerPosition = (
  index: number,
  totalPlayers: number
): React.CSSProperties => {
  return useMemo(() => {
    const angle = (360 / totalPlayers) * index;
    const radians = (angle * Math.PI) / 180;
    const radius = 40; // Adjust radius as needed

    return {
      top: `${50 + radius * Math.sin(radians)}%`,
      left: `${50 + radius * Math.cos(radians)}%`,
    };
  }, [index, totalPlayers]);
};

export default usePlayerPosition;
