'use client';

import React, { ReactNode } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';

import BackdropPanel from './BackdropPanel';

import TransitionSkeleton from './TransitionSkeleton';

interface GameStateContainerProps {

  children: ReactNode;

  className?: string;

  isActive: boolean;

  state: string; // Used for animation keying

  isLoading?: boolean;

  title?: string;

  showTitle?: boolean;

  width?: 'sm' | 'md' | 'lg' | 'full';

  height?: 'auto' | 'full';

}

/**

 * A consistent container for different game states

 * Handles transitions between states with consistent animations

 */

const GameStateContainer: React.FC<GameStateContainerProps> = ({

  children,

  className,

  isActive,

  state,

  isLoading = false,

  title,

  showTitle = true,

  width = 'md',

  height = 'auto'

}) => {

  // Animation variants

  const containerVariants = {

    hidden: { opacity: 0, scale: 0.95, y: 10 },

    visible: { 

      opacity: 1, 

      scale: 1, 

      y: 0,

      transition: { 

        type: 'spring',

        stiffness: 500,

        damping: 30

      }

    },

    exit: { 

      opacity: 0, 

      scale: 0.95,

      y: -10,

      transition: { 

        duration: 0.2

      }

    }

  };

  // Width classes

  const widthClasses = {

    sm: 'max-w-sm',

    md: 'max-w-md',

    lg: 'max-w-lg',

    full: 'w-full'

  };

  // Height classes

  const heightClasses = {

    auto: 'h-auto',

    full: 'h-full'

  };

  return (

    <AnimatePresence mode="wait">

      {isActive && (

        <motion.div

          key={`container-${state}`}

          className="flex flex-col items-center justify-center w-full h-full"

          variants={containerVariants}

          initial="hidden"

          animate="visible"

          exit="exit"

        >

          <BackdropPanel className={cn(

            widthClasses[width],

            heightClasses[height],

            "w-full p-6 space-y-6",

            className

          )}>

            {showTitle && title && (

              <h2 className="text-xl font-bold text-center text-slate-700 dark:text-white">

                {title}

              </h2>

            )}

            

            {isLoading ? (

              <TransitionSkeleton state={state} />

            ) : (

              <AnimatePresence mode="wait">

                <motion.div

                  key={`content-${state}`}

                  initial={{ opacity: 0 }}

                  animate={{ opacity: 1 }}

                  exit={{ opacity: 0 }}

                  transition={{ duration: 0.3 }}

                  className="w-full"

                >

                  {children}

                </motion.div>

              </AnimatePresence>

            )}

          </BackdropPanel>

        </motion.div>

      )}

    </AnimatePresence>

  );

};

export default GameStateContainer;