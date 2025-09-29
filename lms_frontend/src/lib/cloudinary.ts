import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  folder: 'assignments' | 'submissions'
): Promise<UploadResult> {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `eduflow/${folder}`,
          public_id: `${Date.now()}_${fileName.replace(/\.[^/.]+$/, '')}`, // Remove extension
          resource_type: 'auto', // Automatically detect file type
          quality: 'auto:good', // Optimize quality
          fetch_format: 'auto', // Optimize format
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(fileBuffer);
    });

    const uploadResult = result as any;

    return {
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function uploadBase64Image(
  base64Data: string,
  fileName: string,
  folder: 'assignments' | 'submissions'
): Promise<UploadResult> {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: `eduflow/${folder}`,
      public_id: `${Date.now()}_${fileName.replace(/\.[^/.]+$/, '')}`,
      resource_type: 'image',
      quality: 'auto:good',
      fetch_format: 'auto',
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary base64 upload error:', error);
    return {
      success: false,
      error: `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function deleteFile(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

export function getOptimizedImageUrl(
  publicId: string,
  width?: number,
  height?: number,
  quality: 'auto' | 'auto:good' | 'auto:best' | number = 'auto:good'
): string {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'limit',
    quality,
    fetch_format: 'auto',
  });
}

// Helper function to extract public ID from Cloudinary URL
export function extractPublicId(cloudinaryUrl: string): string | null {
  try {
    const matches = cloudinaryUrl.match(/\/v\d+\/(.+)\.[^.]+$/);
    return matches ? matches[1] : null;
  } catch {
    return null;
  }
}

// Validate file type and size
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
  ];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 10MB',
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not supported. Please upload images, PDFs, or text files.',
    };
  }

  return { valid: true };
}

export default cloudinary;
