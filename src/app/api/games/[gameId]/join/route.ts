import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const { userName } = await request.json();
    const gameId = params.gameId;
    console.log(gameId);
    // Validate the input
    if (!userName) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Generate a simple placeholder ID (in real app, use proper ID generation)
    const playerId = `1`;

    // Here you would:
    // 1. Verify the game exists
    // 2. Add the player to the game
    // 3. Set up any necessary game state

    return NextResponse.json({
      success: true,
      playerId: playerId,
    });
  } catch (error) {
    console.error('Error joining game:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
