import React from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from 'react-error-boundary';

// Dynamically import components with SSR disabled to ensure proper hydration
const NewWagers = dynamic(() => import('./NewWagers'), { ssr: false });
const RecentWagers = dynamic(() => import('./RecentWagers'), { ssr: false });

interface DashboardProps {
  onRequireAuth: () => void;
}

const ErrorFallback = ({ error }: { error: Error }) => (
  <div className="text-center py-4">
    <p className="text-red-500">Something went wrong: {error.message}</p>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ onRequireAuth }) => {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-screen-xl">
        <div className="">
          {/* Games section - takes up 2/3 of the space on desktop */}
          <div className="">
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <NewWagers onRequireAuth={onRequireAuth} />
            </ErrorBoundary>
          </div>
          {/* Wagers section - takes up 1/3 of the space on desktop */}
          {/* <div className="lg:col-span-1">
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <RecentWagers />
            </ErrorBoundary>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
