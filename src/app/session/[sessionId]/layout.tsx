import { GameProvider } from '@/components/GameContext';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  params: { sessionId: string };
}

export default async function Layout({ children, params }: LayoutProps) {
  const { sessionId } = await params;

  return <GameProvider sessionId={sessionId}>{children}</GameProvider>;
}
