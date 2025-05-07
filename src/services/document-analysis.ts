/**
 * Represents the type of a document.
 */
export type DocumentType = 'handwritten_notes' | 'retail_receipt' | 'invoice' | 'business_card' | 'printed_text';

/**
 * Represents the analysis of a document, including its type.
 */
export interface DocumentAnalysis {
  /**
   * The identified type of the document.
   */
  documentType: DocumentType;
}

/**
 * Asynchronously analyzes a document image to determine its type.
 *
 * @param image The image data of the document to analyze.
 * @returns A promise that resolves to a DocumentAnalysis object containing the document type.
 */
export async function analyzeDocument(image: string): Promise<DocumentAnalysis> {
  // TODO: Implement this by calling an API.

  return {
    documentType: 'handwritten_notes',
  };
}
