import { FullScreenProvider } from '@/providers/fullscreen-provider';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Game Lobby',
  description: 'A multi-game lobby system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="{inter.className}">
        <FullScreenProvider>{children}</FullScreenProvider>
      </body>
    </html>
  );
}
