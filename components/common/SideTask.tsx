import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import siteData from '@/components/site-data.json';

const SideTask: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-700 dark:to-purple-700 rounded-lg p-4 mb-4 relative overflow-hidden">
      <Image
          src="/images/task-tab.png"
          alt="Task Tab"
          fill
          className="opacity-30 object-cover"
          sizes="(max-width: 768px) 100vw, 768px"
        />
      <div className="relative z-10">
        <div 
          className="flex justify-between items-center cursor-pointer" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="text-lg font-semibold text-white">
            Daily Tasks
          </span>
          <button
            className="p-1 rounded-full bg-white bg-opacity-30 hover:bg-opacity-50 text-white transition-colors duration-200"
            aria-label={isExpanded ? "Collapse daily tasks" : "Expand daily tasks"}
          >
            {isExpanded ? (
              <ChevronUp className="h-6 w-6" />
            ) : (
              <ChevronDown className="h-6 w-6" />
            )}
          </button>
        </div>
        {isExpanded && (
          <div className="mt-4 space-y-2">
            {siteData.dailyTasks.map((task, index) => (
              <Link 
                key={index} 
                href={task.link}
                className="block w-full text-left px-4 py-2 text-sm text-white bg-white/20 hover:bg-white/30 rounded transition duration-150 ease-in-out"
              >
                {task.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SideTask;