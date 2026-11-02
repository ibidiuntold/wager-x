import { Timer, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WagerAboutProps {
  description: string;
  expiresAt: { toDate: () => Date } | any;
  participantsCount: number;
  totalPool: number;
  isExpired: boolean;
}

// Safely format date from various timestamp formats
const formatDate = (timestamp: any): string => {
  try {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString();
    } else if (timestamp && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    } else if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }
    return 'Invalid date';
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const WagerAbout = ({
  description,
  expiresAt,
  participantsCount,
  totalPool,
  isExpired
}: WagerAboutProps) => (
  <Card className="p-4">
    <CardHeader>
      <CardTitle className="-ml-4 -mb-4">About this Wager</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="flex items-center text-gray-500">
            <Timer className="mr-2 h-4 w-4" />
            <span className="text-sm">Time Remaining</span>
          </div>
          <p className="font-medium">
            {isExpired ? 'Expired' : 'Expires'} on{' '}
            {formatDate(expiresAt)}
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center text-gray-500">
            <Users className="mr-2 h-4 w-4" />
            <span className="text-sm">Participants</span>
          </div>
          <p className="font-medium">{participantsCount}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center text-gray-500">
            <TrendingUp className="mr-2 h-4 w-4" />
            <span className="text-sm">Total Pool</span>
          </div>
          <p className="font-medium">₦{totalPool.toLocaleString()}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);