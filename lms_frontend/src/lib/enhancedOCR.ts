/**
 * Enhanced OCR and Text Extraction System
 * Improves accuracy with multiple processing techniques and AI validation
 */

import { generateAIResponse } from './gemini-service';
import { extractTextFromImage } from './googleVision';

export interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  processingMethod: 'google_vision' | 'ai_enhanced' | 'fallback';
  extractedElements: {
    questions: string[];
    formulas: string[];
    diagrams: string[];
    tables: string[];
  };
  qualityMetrics: {
    clarity: number;
    completeness: number;
    accuracy: number;
  };
  suggestions: string[];
}

export interface TextProcessingOptions {
  enhanceWithAI: boolean;
  extractStructuredData: boolean;
  validateAccuracy: boolean;
  language: string;
  subject: string;
}

/**
 * Enhanced OCR processing with multiple techniques
 */
export async function processImageWithEnhancedOCR(
  imageUrl: string, 
  options: TextProcessingOptions = {
    enhanceWithAI: true,
    extractStructuredData: true,
    validateAccuracy: true,
    language: 'en',
    subject: 'general'
  }
): Promise<OCRResult> {
  try {
    // Step 1: Initial OCR with Google Vision
    const initialOCR = await extractTextFromImage(imageUrl);
    
    if (!initialOCR.success) {
      return {
        success: false,
        text: '',
        confidence: 0,
        processingMethod: 'fallback',
        extractedElements: { questions: [], formulas: [], diagrams: [], tables: [] },
        qualityMetrics: { clarity: 0, completeness: 0, accuracy: 0 },
        suggestions: ['Image quality too low for OCR processing']
      };
    }
    
    let processedText = initialOCR.text;
    let confidence = initialOCR.confidence || 0.7;
    let processingMethod: 'google_vision' | 'ai_enhanced' | 'fallback' = 'google_vision';
    
    // Step 2: AI Enhancement if enabled
    if (options.enhanceWithAI && confidence < 0.9) {
      const aiEnhanced = await enhanceTextWithAI(processedText, options);
      if (aiEnhanced.success) {
        processedText = aiEnhanced.text;
        confidence = Math.min(0.95, confidence + 0.2);
        processingMethod = 'ai_enhanced';
      }
    }
    
    // Step 3: Extract structured data if enabled
    const extractedElements = options.extractStructuredData 
      ? await extractStructuredData(processedText, options.subject)
      : { questions: [], formulas: [], diagrams: [], tables: [] };
    
    // Step 4: Calculate quality metrics
    const qualityMetrics = calculateQualityMetrics(processedText, extractedElements);
    
    // Step 5: Generate suggestions for improvement
    const suggestions = generateImprovementSuggestions(qualityMetrics, confidence);
    
    return {
      success: true,
      text: processedText,
      confidence,
      processingMethod,
      extractedElements,
      qualityMetrics,
      suggestions
    };
    
  } catch (error) {
    console.error('Enhanced OCR processing error:', error);
    return {
      success: false,
      text: '',
      confidence: 0,
      processingMethod: 'fallback',
      extractedElements: { questions: [], formulas: [], diagrams: [], tables: [] },
      qualityMetrics: { clarity: 0, completeness: 0, accuracy: 0 },
      suggestions: ['OCR processing failed. Please try with a clearer image.']
    };
  }
}

/**
 * Enhance OCR text using AI for better accuracy
 */
async function enhanceTextWithAI(text: string, options: TextProcessingOptions): Promise<{ success: boolean; text: string }> {
  try {
    const prompt = createTextEnhancementPrompt(text, options);
    const enhancedText = await generateAIResponse(prompt);
    
    return {
      success: true,
      text: enhancedText
    };
    
  } catch (error) {
    console.error('AI text enhancement error:', error);
    return {
      success: false,
      text: text // Return original text if enhancement fails
    };
  }
}

/**
 * Create prompt for AI text enhancement
 */
function createTextEnhancementPrompt(text: string, options: TextProcessingOptions): string {
  return `
You are an expert at correcting and enhancing OCR (Optical Character Recognition) text, especially for educational content.

**Original OCR Text:**
"${text}"

**Context:**
- Subject: ${options.subject}
- Language: ${options.language}

**Your Task:**
1. Correct any OCR errors (misread characters, spacing issues, formatting problems)
2. Fix mathematical expressions and formulas
3. Restore proper punctuation and capitalization
4. Maintain the original structure and meaning
5. Preserve question numbers and formatting
6. Fix common OCR mistakes like:
   - '0' instead of 'O'
   - '1' instead of 'l' or 'I'
   - '5' instead of 'S'
   - '6' instead of 'G'
   - '8' instead of 'B'
   - Missing spaces or extra spaces
   - Broken mathematical symbols

**Important Guidelines:**
- Only correct obvious OCR errors, don't change the content
- Preserve mathematical notation exactly
- Keep question structure intact
- Don't add information that wasn't in the original
- If uncertain about a character, leave it as is

**Return ONLY the corrected text, no explanations or additional formatting.**
`;
}

/**
 * Extract structured data from text
 */
async function extractStructuredData(text: string, subject: string): Promise<{
  questions: string[];
  formulas: string[];
  diagrams: string[];
  tables: string[];
}> {
  try {
    const prompt = createStructuredDataExtractionPrompt(text, subject);
    const response = await generateAIResponse(prompt);
    
    // Parse the structured response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        questions: Array.isArray(data.questions) ? data.questions : [],
        formulas: Array.isArray(data.formulas) ? data.formulas : [],
        diagrams: Array.isArray(data.diagrams) ? data.diagrams : [],
        tables: Array.isArray(data.tables) ? data.tables : []
      };
    }
    
    // Fallback to simple extraction
    return extractStructuredDataFallback(text);
    
  } catch (error) {
    console.error('Structured data extraction error:', error);
    return extractStructuredDataFallback(text);
  }
}

/**
 * Create prompt for structured data extraction
 */
function createStructuredDataExtractionPrompt(text: string, subject: string): string {
  return `
Extract structured educational content from the following text:

**Text:**
"${text}"

**Subject:** ${subject}

**Extract and categorize the following elements:**

1. **Questions** - Individual questions or problems
2. **Formulas** - Mathematical expressions, equations, or formulas
3. **Diagrams** - References to diagrams, figures, or visual elements
4. **Tables** - Tabular data or structured information

**Return ONLY valid JSON in this format:**
{
  "questions": ["Question 1 text", "Question 2 text", ...],
  "formulas": ["Formula 1", "Formula 2", ...],
  "diagrams": ["Diagram reference 1", "Diagram reference 2", ...],
  "tables": ["Table 1", "Table 2", ...]
}

**Guidelines:**
- Extract complete questions, not fragments
- Include mathematical expressions as formulas
- Note any references to visual elements
- Be precise and accurate
`;
}

/**
 * Fallback structured data extraction using regex patterns
 */
function extractStructuredDataFallback(text: string): {
  questions: string[];
  formulas: string[];
  diagrams: string[];
  tables: string[];
} {
  const questions: string[] = [];
  const formulas: string[] = [];
  const diagrams: string[] = [];
  const tables: string[] = [];
  
  // Extract questions (lines starting with numbers or Q)
  const questionPattern = /(?:^|\n)\s*(?:\d+\.|Q\d*\.?|Question\s*\d*\.?)\s*(.+?)(?=\n\s*(?:\d+\.|Q\d*\.?|Question\s*\d*\.?)|$)/gims;
  let match;
  while ((match = questionPattern.exec(text)) !== null) {
    questions.push(match[1].trim());
  }
  
  // Extract formulas (mathematical expressions)
  const formulaPattern = /[=+\-*/^()\[\]{}]+|\\[a-zA-Z]+|∑|∫|√|π|α|β|γ|δ|ε|θ|λ|μ|σ|φ|ψ|ω/g;
  const formulaMatches = text.match(formulaPattern);
  if (formulaMatches) {
    formulas.push(...formulaMatches);
  }
  
  // Extract diagram references
  const diagramPattern = /(?:figure|diagram|graph|chart|image|picture)\s*\d*/gi;
  const diagramMatches = text.match(diagramPattern);
  if (diagramMatches) {
    diagrams.push(...diagramMatches);
  }
  
  // Extract table references
  const tablePattern = /(?:table|chart)\s*\d*/gi;
  const tableMatches = text.match(tablePattern);
  if (tableMatches) {
    tables.push(...tableMatches);
  }
  
  return { questions, formulas, diagrams, tables };
}

/**
 * Calculate quality metrics for OCR result
 */
function calculateQualityMetrics(text: string, extractedElements: any): {
  clarity: number;
  completeness: number;
  accuracy: number;
} {
  // Clarity: based on text length and structure
  const clarity = Math.min(1, text.length / 100) * 0.3 + 
                  (extractedElements.questions.length > 0 ? 0.4 : 0) +
                  (text.includes('?') ? 0.3 : 0);
  
  // Completeness: based on extracted elements
  const completeness = (extractedElements.questions.length > 0 ? 0.4 : 0) +
                       (extractedElements.formulas.length > 0 ? 0.3 : 0) +
                       (text.length > 50 ? 0.3 : 0);
  
  // Accuracy: based on common OCR error patterns
  const commonErrors = (text.match(/[0O1lI5S6G8B]/g) || []).length;
  const accuracy = Math.max(0, 1 - (commonErrors / text.length));
  
  return {
    clarity: Math.round(clarity * 100) / 100,
    completeness: Math.round(completeness * 100) / 100,
    accuracy: Math.round(accuracy * 100) / 100
  };
}

/**
 * Generate improvement suggestions
 */
function generateImprovementSuggestions(qualityMetrics: any, confidence: number): string[] {
  const suggestions: string[] = [];
  
  if (confidence < 0.8) {
    suggestions.push('Image quality could be improved for better OCR accuracy');
  }
  
  if (qualityMetrics.clarity < 0.6) {
    suggestions.push('Text structure could be clearer - ensure proper spacing and formatting');
  }
  
  if (qualityMetrics.completeness < 0.7) {
    suggestions.push('Some content may be missing - check if all text is visible in the image');
  }
  
  if (qualityMetrics.accuracy < 0.8) {
    suggestions.push('OCR accuracy could be improved - try with a higher resolution image');
  }
  
  if (suggestions.length === 0) {
    suggestions.push('OCR quality is good - text extracted successfully');
  }
  
  return suggestions;
}

/**
 * Batch process multiple images
 */
export async function processImagesBatch(
  imageUrls: string[], 
  options: TextProcessingOptions
): Promise<OCRResult[]> {
  const results = await Promise.allSettled(
    imageUrls.map(url => processImageWithEnhancedOCR(url, options))
  );
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`Failed to process image ${index + 1}:`, result.reason);
      return {
        success: false,
        text: '',
        confidence: 0,
        processingMethod: 'fallback',
        extractedElements: { questions: [], formulas: [], diagrams: [], tables: [] },
        qualityMetrics: { clarity: 0, completeness: 0, accuracy: 0 },
        suggestions: ['Image processing failed']
      };
    }
  });
}

/**
 * Validate OCR result quality
 */
export function validateOCRQuality(result: OCRResult): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  if (result.confidence < 0.7) {
    issues.push('Low OCR confidence');
    recommendations.push('Try with a clearer, higher resolution image');
  }
  
  if (result.qualityMetrics.accuracy < 0.8) {
    issues.push('Potential OCR errors detected');
    recommendations.push('Review extracted text for accuracy');
  }
  
  if (result.qualityMetrics.completeness < 0.6) {
    issues.push('Incomplete text extraction');
    recommendations.push('Ensure all text is visible and readable in the image');
  }
  
  if (result.extractedElements.questions.length === 0 && result.text.length > 100) {
    issues.push('No questions detected in text');
    recommendations.push('Verify that the image contains question content');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
}
