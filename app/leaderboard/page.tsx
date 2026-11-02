import LayoutSelector from '@/components/common/LayoutSelector';
import LeaderboardView from '@/components/leaderboard/LeaderboardView';

export const metadata = {
  title: 'Leaderboard | WagerX',
  description: 'See the top players on WagerX — global, weekly, and among your friends.',
};

export default function LeaderboardPage() {
  return (
    <LayoutSelector layoutType="main">
      <LeaderboardView />
    </LayoutSelector>
  );
}
