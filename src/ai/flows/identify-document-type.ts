'use server';

/**
 * @fileOverview A document type identification AI agent.
 *
 * - identifyDocumentType - A function that handles the document type identification process.
 * - IdentifyDocumentTypeInput - The input type for the identifyDocumentType function.
 * - IdentifyDocumentTypeOutput - The return type for the identifyDocumentType function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {DocumentType} from '@/services/document-analysis';

const IdentifyDocumentTypeInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyDocumentTypeInput = z.infer<typeof IdentifyDocumentTypeInputSchema>;

const IdentifyDocumentTypeOutputSchema = z.object({
  documentType: z
    .enum([
      'handwritten_notes',
      'retail_receipt',
      'invoice',
      'business_card',
      'printed_text',
    ])
    .describe('The identified type of the document.'),
});
export type IdentifyDocumentTypeOutput = z.infer<typeof IdentifyDocumentTypeOutputSchema>;

export async function identifyDocumentType(
  input: IdentifyDocumentTypeInput
): Promise<IdentifyDocumentTypeOutput> {
  return identifyDocumentTypeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyDocumentTypePrompt',
  input: {schema: IdentifyDocumentTypeInputSchema},
  output: {schema: IdentifyDocumentTypeOutputSchema},
  prompt: `You are an expert document classifier.  You will identify the type of document in the image.

  The document type must be one of the following:
  - handwritten_notes
  - retail_receipt
  - invoice
  - business_card
  - printed_text

  Photo: {{media url=photoDataUri}}`,
});

const identifyDocumentTypeFlow = ai.defineFlow(
  {
    name: 'identifyDocumentTypeFlow',
    inputSchema: IdentifyDocumentTypeInputSchema,
    outputSchema: IdentifyDocumentTypeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
