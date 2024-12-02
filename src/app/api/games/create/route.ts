import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { gameType } = await request.json();

    // Using a placeholder ID for now - backend will generate the real one
    const gameId = 'GAME123';

    return NextResponse.json(
      {
        gameId,
        message: `Successfully created ${gameType} game`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      {
        error: 'Failed to create game',
      },
      { status: 500 }
    );
  }
}
