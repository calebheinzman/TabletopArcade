import { SessionPlayer } from '@/types/game-interfaces';
import { useEffect, useState } from 'react';

type Props = {
  player: SessionPlayer;
};

const usePlayerStatus = ({ player }: Props) => {
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const checkActivity = () => {
      const lastAction = new Date(player.time_last_action).getTime();
      const now = new Date().getTime();
      const timeDiff = now - lastAction;
      setIsActive(timeDiff <= 30000); // 30 seconds in milliseconds
    };

    checkActivity();
    const interval = setInterval(checkActivity, 1000);
    return () => clearInterval(interval);
  }, [player.time_last_action]);

  return { active: isActive };
};

export default usePlayerStatus;
