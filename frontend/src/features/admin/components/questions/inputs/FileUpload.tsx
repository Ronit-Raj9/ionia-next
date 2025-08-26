import React, { useState, useRef, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { FileUploadProps } from '../utils/types';
import ImagePreview from './ImagePreview';
import Image from 'next/image';

// Extended props to accept a URL string
interface ExtendedFileUploadProps extends Omit<FileUploadProps, 'initialFile'> {
  initialFile?: File | null;
  initialUrl?: string;
}

const FileUpload: React.FC<ExtendedFileUploadProps> = ({ 
  onFileSelect, 
  label, 
  initialFile,
  initialUrl 
}) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [imageUrl, setImageUrl] = useState<string | null>(initialUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setImageUrl(null); // Clear URL if a file is selected
      onFileSelect(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setImageUrl(null);
    onFileSelect(null as unknown as File); // Pass null to parent
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Show upload UI if neither file nor URL is present
  const showUploadUI = !file && !imageUrl;

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {label}
        </label>
      </div>
      
      {showUploadUI ? (
        <div 
          onClick={() => fileInputRef.current?.click()} 
          className="cursor-pointer border border-dashed border-gray-300 rounded-lg p-2 text-center hover:border-blue-500 transition-colors"
        >
          <Upload className="mx-auto h-4 w-4 text-gray-400" />
          <p className="mt-1 text-xs text-gray-500">Click to upload</p>
          <p className="text-[10px] text-gray-400">PNG, JPG up to 5MB</p>
        </div>
      ) : file ? (
        <ImagePreview file={file} onRemove={handleRemoveFile} />
      ) : imageUrl ? (
        <div className="relative border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={handleRemoveFile}
            className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-0.5 text-red-500 hover:text-red-700 hover:bg-opacity-100 transition-colors z-10"
          >
            <X size={14} />
          </button>
          <div className="w-full h-24 relative">
            <Image
              src={imageUrl}
              alt="Image Preview"
              fill
              className="object-contain"
            />
          </div>
          <div className="p-1 bg-gray-50 text-[10px] text-gray-500 truncate text-center">
            Uploaded Image
          </div>
        </div>
      ) : null}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default FileUpload; 