export function CommentSkeleton() {
  return (
    <div className="border border-gray-100 rounded-lg p-3 mb-4 animate-pulse">
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gray-300"></div>

        <div className="flex-1 space-y-2">
          {/* Name + Time */}
          <div className="w-24 h-3 bg-gray-300 rounded"></div>
          <div className="w-16 h-2 bg-gray-200 rounded"></div>

          {/* Comment text */}
          <div className="w-full h-3 bg-gray-300 rounded mt-3"></div>
          <div className="w-5/6 h-3 bg-gray-200 rounded"></div>

          {/* Actions */}
          <div className="flex space-x-4 mt-3">
            <div className="w-10 h-3 bg-gray-200 rounded"></div>
            <div className="w-16 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
