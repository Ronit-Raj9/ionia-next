// Lazy load cloudinary to prevent client-side execution
let cloudinary: any = null;

function getCloudinary() {
  if (typeof window !== 'undefined') {
    // Client-side: cloudinary should not be used
    throw new Error('Cloudinary can only be used on the server side');
  }
  
  if (!cloudinary) {
    try {
      const cloudinaryModule = require('cloudinary');
      cloudinary = cloudinaryModule.v2;
      
      // Configure if environment variables are available
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });
      }
    } catch (error) {
      console.warn('Failed to load cloudinary:', error);
      throw error;
    }
  }
  
  return cloudinary;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  folder: 'assignments' | 'submissions' | 'chat' | 'class-chat' | 'study-materials'
): Promise<UploadResult> {
  try {
    // Ensure cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return {
        success: false,
        error: 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.',
      };
    }

    const cloudinary = getCloudinary();

    // Sanitize fileName to prevent errors
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `ionia/${folder}`,
          public_id: `${Date.now()}_${sanitizedFileName.replace(/\.[^/.]+$/, '')}`, // Remove extension
          resource_type: 'auto', // Automatically detect file type
          quality: 'auto:good', // Optimize quality
          fetch_format: 'auto', // Optimize format
        },
        (error: any, result: any) => {
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
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return {
        success: false,
        error: 'Cloudinary is not configured.',
      };
    }

    const cloudinary = getCloudinary();
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: `ionia/${folder}`,
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

export async function deleteFile(publicId: string | null | undefined): Promise<boolean> {
  try {
    if (!publicId || typeof publicId !== 'string') {
      return false;
    }

    // Ensure cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('Cloudinary not configured, cannot delete file');
      return false;
    }

    const cloudinary = getCloudinary();
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
  if (typeof window !== 'undefined') {
    // Client-side: return original URL or handle differently
    return publicId;
  }
  
  const cloudinary = getCloudinary();
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'limit',
    quality,
    fetch_format: 'auto',
  });
}

// Helper function to extract public ID from Cloudinary URL
export function extractPublicId(cloudinaryUrl: string | null | undefined): string | null {
  try {
    if (!cloudinaryUrl || typeof cloudinaryUrl !== 'string') {
      return null;
    }
    const matches = cloudinaryUrl.match(/\/v\d+\/(.+)\.[^.]+$/);
    return matches ? matches[1] : null;
  } catch {
    return null;
  }
}

// Validate file type and size for study materials (20MB limit)
export function validateStudyMaterialFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 20 * 1024 * 1024; // 20MB
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 20MB',
    };
  }
  
  // Allow all file types for study materials
  return { valid: true };
}

// Validate file type and size (original - 10MB for other uploads)
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  // Allow images
  const isImage = file.type.startsWith('image/');
  
  // Allow documents (PDF, Word, Excel, PowerPoint, Text)
  const isDocument = 
    file.type === 'application/pdf' ||
    file.type === 'text/plain' ||
    file.type.includes('document') ||
    file.type.includes('msword') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'application/vnd.ms-excel' ||
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-powerpoint' ||
    file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 10MB',
    };
  }

  if (!isImage && !isDocument) {
    return {
      valid: false,
      error: 'File type not supported. Please upload images (JPG, PNG, GIF, WebP) or documents (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT).',
    };
  }

  return { valid: true };
}

// Export getCloudinary for server-side usage only
export { getCloudinary };
