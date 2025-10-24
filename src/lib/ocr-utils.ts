import { createWorker } from 'tesseract.js';

/**
 * OCR Configuration Options
 */
interface OCROptions {
  language?: string;  // Default: 'eng' for English
  confidence?: number; // Minimum confidence threshold (0-100)
  enableLogging?: boolean;
}

/**
 * OCR Result Interface
 */
interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  processingTime: number;
  error?: string;
}

/**
 * Extract text from image using OCR (Tesseract.js)
 * @param imageBase64 - Base64 encoded image string
 * @param options - OCR configuration options
 * @returns Promise<OCRResult> - OCR extraction result
 */
export const extractTextFromImage = async (
  imageBase64: string, 
  options: OCROptions = {}
): Promise<OCRResult> => {
  const startTime = Date.now();
  const {
    language = 'eng',
    confidence = 60,
    enableLogging = false
  } = options;

  let worker: any = null;

  try {
    if (enableLogging) {
      console.log('🔍 Starting OCR text extraction from image...');
    }

    // Create Tesseract worker
    worker = await createWorker(language);

    // Configure OCR parameters for better accuracy
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,!?-()[]{}:;"\'@#$%^&*+=<>/\\|`~_',
      tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
      preserve_interword_spaces: '1',
    });

    // Convert base64 to image data URL
    const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;
    
    // Perform OCR
    const { data } = await worker.recognize(imageDataUrl);
    
    const processingTime = Date.now() - startTime;
    
    // Filter out low-confidence text
    const extractedText = data.text?.trim() || '';
    const ocrConfidence = data.confidence || 0;

    if (enableLogging) {
      console.log(`✅ OCR completed in ${processingTime}ms`);
      console.log(`📊 Confidence: ${ocrConfidence.toFixed(1)}%`);
      console.log(`📝 Text length: ${extractedText.length} characters`);
    }

    // Check confidence threshold
    if (ocrConfidence < confidence) {
      return {
        success: false,
        text: extractedText,
        confidence: ocrConfidence,
        processingTime,
        error: `OCR confidence ${ocrConfidence.toFixed(1)}% is below threshold ${confidence}%`
      };
    }

    return {
      success: true,
      text: extractedText,
      confidence: ocrConfidence,
      processingTime
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ OCR extraction failed:', error);
    
    return {
      success: false,
      text: '',
      confidence: 0,
      processingTime,
      error: error instanceof Error ? error.message : 'Unknown OCR error'
    };

  } finally {
    // Always cleanup worker
    if (worker) {
      try {
        await worker.terminate();
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup OCR worker:', cleanupError);
      }
    }
  }
};

/**
 * Extract text from PDF using OCR by converting pages to images first
 * Note: This handles scanned PDFs or PDFs with images containing text
 * @param file - PDF file
 * @param options - OCR configuration options
 * @returns Promise<OCRResult> - OCR extraction result
 */
export const extractTextFromPDFWithOCR = async (
  _file: File, 
  options: OCROptions = {}
): Promise<OCRResult> => {
  const startTime = Date.now();
  const { enableLogging = false } = options;

  try {
    if (enableLogging) {
      console.log('🔍 Starting OCR text extraction from PDF...');
    }

    // For now, we'll return a placeholder since PDF-to-image conversion
    // requires more complex setup in a web environment
    // This can be enhanced later with server-side processing or canvas-based conversion
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: false,
      text: '',
      confidence: 0,
      processingTime,
      error: 'PDF OCR conversion not implemented yet. Use regular PDF text extraction instead.'
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ PDF OCR extraction failed:', error);
    
    return {
      success: false,
      text: '',
      confidence: 0,
      processingTime,
      error: error instanceof Error ? error.message : 'Unknown PDF OCR error'
    };
  }
};

/**
 * Enhanced text cleaning for OCR results
 * @param text - Raw OCR text
 * @returns string - Cleaned text
 */
export const cleanOCRText = (text: string): string => {
  if (!text) return '';
  
  return text
    // Fix common OCR mistakes
    .replace(/[|]/g, 'I') // Vertical bars often misread as I
    .replace(/[0]/g, 'O') // Zero often misread as O in words
    .replace(/[1]/g, 'l') // One often misread as l in words
    .replace(/[5]/g, 'S') // Five often misread as S
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    // Remove extra spaces around punctuation
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/([,.!?;:])\s+/g, '$1 ')
    .trim();
};

/**
 * Check if text likely contains meaningful content
 * @param text - Text to analyze
 * @returns boolean - True if text appears meaningful
 */
export const isTextMeaningful = (text: string): boolean => {
  if (!text || text.length < 3) return false;
  
  // Check for reasonable word/character patterns
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return false;
  
  // At least some words should be longer than 2 characters
  const meaningfulWords = words.filter(w => w.length > 2);
  const meaningfulRatio = meaningfulWords.length / words.length;
  
  // Should have reasonable alphabet character density
  const alphabetChars = text.match(/[a-zA-Z]/g) || [];
  const alphabetRatio = alphabetChars.length / text.length;
  
  return meaningfulRatio > 0.3 && alphabetRatio > 0.5;
};

/**
 * Format OCR result for display to user
 * @param result - OCR result
 * @param sourceType - Type of source (image/pdf)
 * @returns string - Formatted result message
 */
export const formatOCRResult = (result: OCRResult, sourceType: 'image' | 'pdf' = 'image'): string => {
  const { success, text, confidence, processingTime, error } = result;
  
  if (!success) {
    return `❌ OCR Failed: ${error || 'Unknown error'}`;
  }
  
  if (!text || !isTextMeaningful(text)) {
    return `⚠️ OCR completed but no meaningful text was detected in the ${sourceType}`;
  }
  
  const cleanedText = cleanOCRText(text);
  
  return `✅ OCR Text Extracted (${confidence.toFixed(1)}% confidence, ${processingTime}ms):\n\n${cleanedText}`;
};

export type { OCROptions, OCRResult };