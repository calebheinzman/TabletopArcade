import { gameActions, GameTemplateNameAndId } from '@/lib/supabase';
import { useEffect, useState } from 'react';

// Used to fetch games with name and id from game table.
const useGameNamesAndId = () => {
  const [games, setGames] = useState<GameTemplateNameAndId[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gamesData = await gameActions.fetchGameNames();
        setGames(gamesData);
      } catch (err) {
        console.error('Error fetching game names:', err);

        // Type narrowing to handle 'err' of type 'unknown'
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, []);

  return { games, error, isLoading };
};

export default useGameNamesAndId;
