import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ children, className = '', variant = 'default', ...props }, ref) => {
    const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
    
    const variantClasses = {
      default: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
      outline: "border border-gray-300 text-gray-700",
      destructive: "bg-red-100 text-red-800 hover:bg-red-200"
    };
    
    return (
      <div 
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Badge.displayName = "Badge"; 