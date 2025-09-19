import React, { useState } from 'react';
import Image from 'next/image';

interface CloudinaryImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'wide' | 'auto';
  sizes?: string;
  priority?: boolean;
  onError?: () => void;
}

const CloudinaryImage: React.FC<CloudinaryImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = 'auto',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  onError
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if the URL is valid and not empty
  const isValidUrl = src && 
    src.trim() !== '' && 
    src !== 'undefined' && 
    src !== 'null' &&
    src.startsWith('http'); // Must be a valid HTTP URL
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('CloudinaryImage - Original src:', src);
    console.log('CloudinaryImage - Valid URL:', isValidUrl);
    console.log('CloudinaryImage - Will render:', isValidUrl && !imageError);
  }

  // Handle image load error
  const handleError = () => {
    console.warn(`Failed to load image: ${src}`);
    setImageError(true);
    setIsLoading(false);
    onError?.();
  };

  // Handle successful load
  const handleLoad = () => {
    setIsLoading(false);
  };

  // Don't render anything if URL is invalid
  if (!isValidUrl) {
    return null;
  }

  // Get aspect ratio class
  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'video':
        return 'aspect-video';
      case 'wide':
        return 'aspect-[16/9]';
      default:
        return 'aspect-auto';
    }
  };

  // Show error placeholder if image failed to load
  if (imageError) {
    return (
      <div className={`${getAspectClass()} w-full bg-gray-100 border border-gray-200 rounded flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <svg
            className="mx-auto h-8 w-8 text-gray-400 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs text-gray-500">Image not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${getAspectClass()} w-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded flex items-center justify-center z-10">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Try Next.js Image first, fallback to regular img if needed */}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-contain bg-gray-50 rounded ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={(e) => {
          console.warn(`Next.js Image failed to load: ${src}`);
          handleError();
        }}
        onLoad={handleLoad}
        onLoadingComplete={handleLoad}
        unoptimized={true} // Add this to bypass Next.js optimization issues
      />
    </div>
  );
};

export default CloudinaryImage;
