import { ImageAnnotatorClient } from '@google-cloud/vision';

// Initialize Google Cloud Vision client
let visionClient: ImageAnnotatorClient;

try {
  // Create credentials object from environment variables
  const credentials = {
    type: 'service_account',
    project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
    private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLOUD_CLIENT_EMAIL}`,
  };

  visionClient = new ImageAnnotatorClient({
    credentials,
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  });
} catch (error) {
  console.error('Failed to initialize Google Vision client:', error);
}

export interface OCRResult {
  text: string;
  confidence: number;
  success: boolean;
  error?: string;
}

export async function extractTextFromImage(imageUrl: string): Promise<OCRResult> {
  try {
    if (!visionClient) {
      throw new Error('Google Vision client not initialized. Check your credentials.');
    }

    // Perform text detection on the image
    const [result] = await visionClient.documentTextDetection({
      image: {
        source: {
          imageUri: imageUrl,
        },
      },
    });

    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      return {
        text: '',
        confidence: 0,
        success: false,
        error: 'No text detected in the image',
      };
    }

    // The first detection contains the full text
    const fullText = detections[0].description || '';
    
    // Calculate average confidence from all detections
    let totalConfidence = 0;
    let confidenceCount = 0;
    
    detections.forEach((detection) => {
      if (detection.confidence !== undefined && detection.confidence !== null) {
        totalConfidence += detection.confidence;
        confidenceCount++;
      }
    });
    
    const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0.8; // Default confidence
    
    // Consider successful if confidence is above 70%
    const isSuccessful = averageConfidence >= 0.7;
    
    return {
      text: fullText.trim(),
      confidence: averageConfidence,
      success: isSuccessful,
      error: isSuccessful ? undefined : 'Low confidence in text detection. Please upload a clearer image.',
    };
  } catch (error) {
    console.error('Google Vision OCR error:', error);
    
    return {
      text: '',
      confidence: 0,
      success: false,
      error: `Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function extractTextFromMultipleImages(imageUrls: string[]): Promise<OCRResult[]> {
  const results = await Promise.allSettled(
    imageUrls.map(url => extractTextFromImage(url))
  );
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        text: '',
        confidence: 0,
        success: false,
        error: `Failed to process image ${index + 1}: ${result.reason}`,
      };
    }
  });
}

// Helper function to validate image URL
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const pathname = urlObj.pathname.toLowerCase();
    
    return validExtensions.some(ext => pathname.endsWith(ext)) || 
           url.includes('cloudinary.com') || // Cloudinary URLs
           url.includes('googleapis.com'); // Google Cloud Storage URLs
  } catch {
    return false;
  }
}

export default visionClient;
