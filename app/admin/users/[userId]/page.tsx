import { Metadata } from 'next';
import UserDetailsClient from './user-details-client';

export const metadata: Metadata = {
  title: 'User Details - Admin Dashboard',
  description: 'User details and management',
};

export default function UserDetailsPage({ params }: { params: { userId: string } }) {
  return <UserDetailsClient userId={params.userId} />;
}
