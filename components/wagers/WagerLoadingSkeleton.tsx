export const WagerLoadingSkeleton = () => {
    return (
      <div className="container mx-auto px-4 py-2 max-w-screen-xl">
        <div className="animate-pulse space-y-8">
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  };