"use client";
import React, { useState, useEffect } from 'react';

interface TimerProps {
  timeRemaining: number;
  onTimeEnd?: () => void;
}

const Timer: React.FC<TimerProps> = ({ timeRemaining: initialTime, onTimeEnd }) => {
  const [time, setTime] = useState(initialTime);

  // Reinitialize timer when initialTime prop changes
  useEffect(() => {
    setTime(initialTime);
  }, [initialTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          onTimeEnd?.();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeEnd]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
  };

  const getTimerColor = () => {
    if (time <= 300) return 'text-red-600 animate-pulse';
    if (time <= 600) return 'text-orange-500';
    return 'text-gray-700';
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200">
      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 font-medium">Time Left</span>
        <span className={`font-mono text-lg font-bold tracking-wider ${getTimerColor()}`}>
          {formatTime(time)}
        </span>
      </div>
    </div>
  );
};

export default Timer;
