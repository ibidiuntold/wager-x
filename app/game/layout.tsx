// app/game/layout.tsx
import { Metadata } from 'next';
import LayoutSelector from '@/components/common/LayoutSelector';

export const metadata: Metadata = {
  title: 'Play Game | WagerX',
  description: 'Play games and wager with friends in real-time',
};

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutSelector layoutType="game">{children}</LayoutSelector>;
}