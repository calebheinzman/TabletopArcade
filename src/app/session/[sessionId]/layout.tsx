'use client';

import { GameProvider } from '@/components/GameContext';
import { ReactNode, use } from 'react';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ sessionId: string }>;
}

export default function Layout({ children, params }: LayoutProps) {
  const { sessionId } = use(params);
  console.log('Layout sessionId', sessionId);
  return <GameProvider sessionId={parseInt(sessionId)}>{children}</GameProvider>;
}
