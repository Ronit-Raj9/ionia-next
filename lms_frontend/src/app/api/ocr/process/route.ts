import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromImage } from '@/lib/googleVision';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert File to base64 data URL
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${imageFile.type};base64,${base64}`;
    
    // Process with Google Vision API
    const result = await extractTextFromImage(dataUrl);
    
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('OCR processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
