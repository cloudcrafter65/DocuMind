'use server';
/**
 * @fileOverview Extracts printed text from an image.
 *
 * - extractPrintedText - A function that handles the text extraction process.
 * - ExtractPrintedTextInput - The input type for the extractPrintedText function.
 * - ExtractPrintedTextOutput - The return type for the extractPrintedText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractPrintedTextInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a document with printed text, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractPrintedTextInput = z.infer<typeof ExtractPrintedTextInputSchema>;

const ExtractPrintedTextOutputSchema = z.object({
  text: z.string().describe('The extracted printed text from the image.'),
});
export type ExtractPrintedTextOutput = z.infer<typeof ExtractPrintedTextOutputSchema>;

const transcribeTextPrompt = ai.definePrompt({
  name: 'transcribeTextPromptInternal', // Renamed to avoid conflict if 'transcribeTextPrompt' is used elsewhere
  input: {schema: ExtractPrintedTextInputSchema},
  output: {schema: ExtractPrintedTextOutputSchema}, // Ensure output schema matches
  prompt: `Extract all text from the following image: {{media url=photoDataUri}}`,
});

const extractPrintedTextFlow = ai.defineFlow(
  {
    name: 'extractPrintedTextFlow',
    inputSchema: ExtractPrintedTextInputSchema,
    outputSchema: ExtractPrintedTextOutputSchema,
  },
  async (input) => {
    const {output} = await transcribeTextPrompt(input);
    return { text: output?.text ?? '' }; // Access 'text' field from the structured output
  }
);

// Wrapper function to be called from client components
export async function extractPrintedText(
  input: ExtractPrintedTextInput
): Promise<ExtractPrintedTextOutput> {
  return extractPrintedTextFlow(input);
}
