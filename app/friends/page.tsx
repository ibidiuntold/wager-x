import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import LayoutSelector from '@/components/common/LayoutSelector';
import FriendsView from '@/components/friends/FriendsView';

export const metadata = {
  title: 'Friends | WagerX',
};

export default async function FriendsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth');
  }
  return (
    <LayoutSelector layoutType="main">
      <FriendsView />
    </LayoutSelector>
  );
}
