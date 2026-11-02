'use client';

import React from 'react';
import { Trophy } from 'lucide-react';

interface WagerSuccessAnimationProps {
  className?: string;
}

export const WagerSuccessAnimation: React.FC<WagerSuccessAnimationProps> = ({ className }) => {
  return (
    <div className={`success-animation-container relative ${className || ''}`}>
      <div className="success-animation-action absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-20 w-20 sm:h-24 sm:w-24">
        <div className="success-trophy flex items-center justify-center bg-white dark:bg-gray-800 h-full w-full rounded-full">
          <Trophy className="h-10 w-10 text-yellow-400" />
        </div>
        <div className="success-confetti"></div>
        <div className="success-confetti two"></div>
        <div className="success-confetti three"></div>
        <div className="success-confetti four"></div>
        <div className="success-confetti--purple"></div>
        <div className="success-confetti--purple two"></div>
        <div className="success-confetti--purple three"></div>
        <div className="success-confetti--purple four"></div>
      </div>

      <style jsx>{`
        @keyframes trophy {
          0% {
            transform: translateY(50px);
            opacity: 0;
          }
          35% {
            opacity: 0;
          }
          100% {
            transform: translateY(0px);
            opacity: 1;
          }
        }
        @keyframes fly--up {
          0% {
            transform: translateY(10px);
            opacity: 0;
          }
          60% {
            opacity: 1;
          }
          80% {
            transform: translateY(-40px);
          }
          100% {
            transform: translateY(-30px);
            opacity: 0;
          }
        }
        @keyframes fly--down {
          0% {
            transform: translateY(-10px);
            opacity: 0;
          }
          60% {
            opacity: 1;
          }
          80% {
            transform: translateY(40px);
          }
          100% {
            transform: translateY(30px);
            opacity: 0;
          }
        }
        @keyframes fly--left {
          0% {
            transform: translateX(10px);
            opacity: 0;
          }
          60% {
            opacity: 1;
          }
          80% {
            transform: translateX(-70px);
          }
          100% {
            transform: translateX(-60px);
            opacity: 0;
          }
        }
        @keyframes fly--right {
          0% {
            transform: translateX(-10px);
            opacity: 0;
          }
          60% {
            opacity: 1;
          }
          80% {
            transform: translateX(70px);
          }
          100% {
            transform: translateX(60px);
            opacity: 0;
          }
        }
        @keyframes fly--up--left {
          0% {
            transform: rotate(135deg) translate(0px, 0px);
            opacity: 0;
          }
          60% {
            opacity: 1;
          }
          100% {
            transform: rotate(135deg) translate(-20px, 60px);
            opacity: 0;
          }
        }
        @keyframes fly--up--right {
          0% {
            transform: rotate(45deg);
            opacity: 0;
          }
          60% {
            opacity: 1;
          }
          100% {
            transform: rotate(45deg) translate(-20px, -60px);
            opacity: 0;
          }
        }
        @keyframes fly--down--left {
          0% {
            transform: rotate(45deg) translate(0px, 0px);
            opacity: 0;
          }
          60% {
            opacity: 1;
          }
          100% {
            transform: rotate(45deg) translate(-20px, 60px);
            opacity: 0;
          }
        }
        @keyframes fly--down--right {
          0% {
            transform: rotate(135deg) translate(0px, 0px);
            opacity: 0;
          }
          60% {
            opacity: 1;
          }
          100% {
            transform: rotate(135deg) translate(0px, -60px);
            opacity: 0;
          }
        }
        
        .success-animation-container {
          overflow: hidden;
          width: 100%;
          height: 140px;
        }
        
        .success-trophy {
          z-index: 1;
          animation: trophy 0.5s 1 forwards;
        }
        
        .success-confetti {
          z-index: -1;
          position: absolute;
          height: 30px;
          width: 6px;
          border-radius: 10px;
          animation-fill-mode: forwards;
          animation-duration: 0.75s;
          animation-iteration-count: 1;
          transform-origin: center middle;
          opacity: 0;
          top: 0;
          left: calc(50% - 3px);
          background-color: #FFEA00;
          animation-name: fly--up;
          animation-delay: 0.35s;
        }
        
        .success-confetti.two {
          top: auto;
          bottom: 0;
          animation-name: fly--down;
        }
        
        .success-confetti.three,
        .success-confetti.four {
          top: calc(50% - 3px);
          left: calc(50% - 15px);
          height: 6px;
          width: 30px;
          animation-name: fly--left;
        }
        
        .success-confetti.four {
          animation-name: fly--right;
        }
        
        .success-confetti--purple {
          z-index: -1;
          position: absolute;
          height: 30px;
          width: 6px;
          border-radius: 10px;
          animation-fill-mode: forwards;
          animation-duration: 0.75s;
          animation-iteration-count: 1;
          transform-origin: center middle;
          opacity: 0;
          background-color: #6200EA;
          animation-name: fly--up--left;
          transform: rotate(135deg);
          animation-delay: .5s;
          left: 20%;
          top: 20%;
        }
        
        .success-confetti--purple.two {
          animation-name: fly--up--right;
          left: auto;
          right: 20%;
          transform: rotate(45deg);
        }
        
        .success-confetti--purple.three {
          top: auto;
          bottom: 20%;
          transform: rotate(45deg);
          animation-name: fly--down--left;
        }
        
        .success-confetti--purple.four {
          top: auto;
          bottom: 20%;
          left: auto;
          right: 20%;
          transform: rotate(135deg);
          animation-name: fly--down--right;
        }
      `}</style>
    </div>
  );
};

export default WagerSuccessAnimation;