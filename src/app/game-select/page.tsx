'use client';

import { Button } from '@/components/ui/button';
import useGameNamesAndId from '@/hooks/useGameNamesAndId';
import { createSessionFromGameTemplateId } from '@/lib/supabase/session';
import { GameTemplateNameAndId } from '@/types/game-interfaces';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function GameSelectPage() {
  const router = useRouter();
  const { games, error, isLoading } = useGameNamesAndId();
  const [actionError, setActionError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  console.log(games);
  console.log(selectedTags);
  console.log(searchTerm);
  
  // Get unique tags from all games
  const allTags = Array.from(
    new Set(games?.flatMap((game) => {
      // Handle both string and array formats of tags
      if (!game.tags) return [];
      if (typeof game.tags === 'string') {
        // If tags is a string, split it by commas and trim whitespace
        return (game.tags as string).split(',').map(tag => tag.trim());
      }
      return game.tags;
    }) || [])
  );

  // Filter games based on search term and selected tags
  const filteredGames = games?.filter((game) => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Handle tag matching with both string and array formats
    const gameTags = typeof game.tags === 'string' 
      ? (game.tags as string).split(',').map(tag => tag.trim())
      : game.tags || [];
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => gameTags.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Create new session based on game id selected. Route to host-start page if successful.
  const handleGameSelect = async (game: GameTemplateNameAndId) => {
    // Clear previous error
    setActionError('');

    // Navigate to the game review page
    router.push(`/game-review?gameId=${game.id}`);
  };

  // Display loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading games...</div>
      </div>
    );
  }

  // Display error if fetching games failed
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500" role="alert">
          Error fetching games: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
      <Button onClick={() => router.back()} className="absolute top-4 left-4">
        Back
      </Button>
      <h1 className="text-4xl font-bold mb-8">Select a Game</h1>

      {/* Search and Filter Section */}
      <div className="w-full max-w-2xl mb-6 px-4">
        <Input
          type="search"
          placeholder="Search games..."
          className="mb-4"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 mb-4">
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {actionError && (
        <div className="text-red-500 mb-4" role="alert">
          {actionError}
        </div>
      )}

      <div className="space-y-6">
        {filteredGames?.map((game) => (
          <Button
            key={game.id}
            className="w-48"
            onClick={() => handleGameSelect(game)}
          >
            {game.name}
          </Button>
        ))}
        <Link href="/create-custom-game">
          <Button className="w-48" variant="outline">
            Create Custom Game
          </Button>
        </Link>
      </div>
    </div>
  );
}
