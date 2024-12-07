'use client';

import { PlayerAction } from '@/lib/supabase';
import { useGame } from '@/components/GameContext';

const PLAYER_COLORS = [
  'text-blue-600',
  'text-emerald-600',
  'text-purple-600',
  'text-orange-600',
  'text-pink-600',
  'text-teal-600',
  'text-red-600',
  'text-indigo-600',
];

const BoardActionFeed: React.FC = () => {
  const { playerActions, sessionPlayers } = useGame();

  // Changed variable name from playerInfo to playerInfoMap
  const playerInfoMap = new Map(
    sessionPlayers.map((player, index) => [
      player.playerid,
      {
        name: player.username,
        color: PLAYER_COLORS[index % PLAYER_COLORS.length]
      }
    ])
  );

  return (
    <div className="w-80 bg-white border border-gray-200 shadow-lg rounded-lg overflow-y-auto p-4">
      <h3 className="text-lg font-semibold mb-4">Action History</h3>
      <div className="space-y-2">
        {playerActions.map((action, index) => {
          const playerInfo = playerInfoMap.get(action.playerid);
          return (
            <div 
              key={action.action_id || index} 
              className="text-sm p-2 bg-gray-50 rounded-md"
            >
              <span className={`font-medium ${playerInfo?.color || 'text-gray-600'}`}>
                {playerInfo?.name}:
              </span>{' '}
              <span className="text-gray-700">{action.description}</span>
            </div>
          );
        })}
        {playerActions.length === 0 && (
          <p className="text-gray-500 text-sm italic">No actions yet</p>
        )}
      </div>
    </div>
  );
};

export default BoardActionFeed;
