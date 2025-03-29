import React, { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { ImagePreviewProps } from '../utils/types';

const ImagePreview: React.FC<ImagePreviewProps> = ({ file, onRemove }) => {
  const [loading, setLoading] = useState(true);
  const [objectUrl, setObjectUrl] = useState<string>('');

  React.useEffect(() => {
    if (file) {
      // Create a URL for the file
      const url = URL.createObjectURL(file);
      setObjectUrl(url);

      // Clean up function to revoke the URL when component unmounts
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div className="relative border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-0.5 text-red-500 hover:text-red-700 hover:bg-opacity-100 transition-colors z-10"
      >
        <X size={14} />
      </button>

      <div className="w-full h-24 relative">
        {objectUrl && (
          <Image
            src={objectUrl}
            alt="Preview"
            fill
            className={`object-contain transition-opacity duration-300 ${
              loading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoadingComplete={() => setLoading(false)}
          />
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      <div className="p-1 bg-gray-50 text-[10px] text-gray-500 truncate text-center">
        {file.name}
      </div>
    </div>
  );
};

export default ImagePreview; 