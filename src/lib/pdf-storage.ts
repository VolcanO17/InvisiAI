import { safeLocalStorage } from "./storage/helper";

// Define AttachedFile interface locally
interface AttachedFile {
  id: string;
  name: string;
  type: string;
  base64: string;
  size: number;
  textContent?: string;
}

export interface SavedPDF {
  id: string;
  fileName: string;
  fileSize: number;
  textContent: string;
  base64Data: string;
  uploadedAt: string;
}

/**
 * Save PDF to persistent storage
 */
export const savePDFToPersistentStorage = (file: AttachedFile): SavedPDF => {
  try {
    const savedPDFs = getAllSavedPDFs();
    
    const savedPDF: SavedPDF = {
      id: file.id,
      fileName: file.name,
      fileSize: file.size,
      textContent: file.textContent || "",
      base64Data: file.base64,
      uploadedAt: new Date().toISOString(),
    };
    
    // Add to existing PDFs
    savedPDFs.push(savedPDF);
    
    // Save to localStorage
    safeLocalStorage.setItem('saved_pdfs', JSON.stringify(savedPDFs));
    
    console.log("✅ PDF saved to persistent storage:", savedPDF.fileName);
    return savedPDF;
  } catch (error) {
    console.error("Failed to save PDF:", error);
    throw error;
  }
};

/**
 * Get all saved PDFs
 */
export const getAllSavedPDFs = (): SavedPDF[] => {
  try {
    const savedPDFs = safeLocalStorage.getItem('saved_pdfs');
    if (!savedPDFs) return [];
    
    const parsed = JSON.parse(savedPDFs);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load saved PDFs:", error);
    return [];
  }
};

/**
 * Delete a saved PDF
 */
export const deleteSavedPDF = (id: string): boolean => {
  try {
    const savedPDFs = getAllSavedPDFs();
    const filteredPDFs = savedPDFs.filter(pdf => pdf.id !== id);
    
    if (filteredPDFs.length === savedPDFs.length) {
      console.warn("PDF not found:", id);
      return false;
    }
    
    safeLocalStorage.setItem('saved_pdfs', JSON.stringify(filteredPDFs));
    console.log("✅ PDF deleted from storage:", id);
    return true;
  } catch (error) {
    console.error("Failed to delete PDF:", error);
    return false;
  }
};

/**
 * Get saved PDF by ID
 */
export const getSavedPDFById = (id: string): SavedPDF | null => {
  const pdfs = getAllSavedPDFs();
  return pdfs.find(pdf => pdf.id === id) || null;
};