import React from 'react';

interface IconProps {
  className?: string;
}

export const NotVisitedIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <div className={`${className} border border-gray-400 bg-gray-100 rounded-[2px]`} />
);

export const NotAnsweredIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <div className={`${className} relative`}>
    <svg viewBox="0 0 16 16" className="w-full h-full" preserveAspectRatio="none">
      <path
        fill="#FF0000"
        d="M3 0 L13 0 L10 16 L0 16 Z"
      />
    </svg>
  </div>
);

export const AnsweredIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <div className={`${className} relative`}>
    <svg viewBox="0 0 16 16" className="w-full h-full" preserveAspectRatio="none">
      <path
        fill="#00FF00"
        d="M3 0 L13 0 L10 16 L0 16 Z"
      />
    </svg>
  </div>
);

export const MarkedForReviewIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <div className={`${className} relative`}>
    <div className="absolute inset-0 bg-[#800080] rounded-full" />
  </div>
);

export const AnsweredAndMarkedIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <div className={`${className} relative`}>
    <div className="absolute inset-0 bg-[#800080] rounded-full" />
    <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#00FF00]" />
  </div>
);

// Combined component for displaying status with text
interface QuestionStatusProps extends IconProps {
  status: 'not-visited' | 'not-answered' | 'answered' | 'marked' | 'answered-marked';
  showText?: boolean;
}

export const QuestionStatus: React.FC<QuestionStatusProps> = ({ 
  status, 
  className = "w-5 h-5", // Slightly larger default size to match image
  showText = true 
}) => {
  const getIcon = () => {
    switch (status) {
      case 'not-visited':
        return <NotVisitedIcon className={className} />;
      case 'not-answered':
        return <NotAnsweredIcon className={className} />;
      case 'answered':
        return <AnsweredIcon className={className} />;
      case 'marked':
        return <MarkedForReviewIcon className={className} />;
      case 'answered-marked':
        return <AnsweredAndMarkedIcon className={className} />;
    }
  };

  const getText = () => {
    switch (status) {
      case 'not-visited':
        return 'You have not visited the question yet.';
      case 'not-answered':
        return 'You have not answered the question.';
      case 'answered':
        return 'You have answered the question.';
      case 'marked':
        return 'You have NOT answered the question, but have marked the question for review.';
      case 'answered-marked':
        return 'The question(s) "Answered and Marked for Review" will be considered for evaluation.';
    }
  };

  return (
    <div className="flex items-center">
      <div className="mr-3">{getIcon()}</div>
      {showText && <span className="text-sm">{getText()}</span>}
    </div>
  );
}; 