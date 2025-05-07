'use server';

/**
 * @fileOverview Summarizes handwritten notes by first transcribing them and then identifying key topics.
 *
 * - summarizeNotes - A function that handles the summarization process.
 * - SummarizeNotesInput - The input type for the summarizeNotes function.
 * - SummarizeNotesOutput - The return type for the summarizeNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeNotesInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of handwritten notes, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  existingTranscription: z.string().optional().describe('Optional existing transcription of the notes. If provided, transcription step will be skipped.'),
});
export type SummarizeNotesInput = z.infer<typeof SummarizeNotesInputSchema>;

const SummarizeNotesOutputSchema = z.object({
  summary: z.string().describe('A summary of the key topics discussed in the notes.'),
});
export type SummarizeNotesOutput = z.infer<typeof SummarizeNotesOutputSchema>;

export async function summarizeNotes(input: SummarizeNotesInput): Promise<SummarizeNotesOutput> {
  return summarizeNotesFlow(input);
}

const transcribeNotesPrompt = ai.definePrompt({
  name: 'transcribeNotesPrompt',
  input: {schema: z.object({ photoDataUri: SummarizeNotesInputSchema.shape.photoDataUri })}, // Input only photo if transcribing
  // No output.schema here, so response.text will contain the string output
  prompt: `Transcribe the following handwritten notes from the image. Output only the text content of the image. Photo: {{media url=photoDataUri}}`,
});

const summarizeTextPrompt = ai.definePrompt({
  name: 'summarizeTextPrompt',
  input: {schema: z.object({text: z.string()})},
  output: {schema: SummarizeNotesOutputSchema}, // This prompt has an output schema
  prompt: `Summarize the following text, and identify the key topics discussed:\n\n{{{text}}}`,
});

const summarizeNotesFlow = ai.defineFlow(
  {
    name: 'summarizeNotesFlow',
    inputSchema: SummarizeNotesInputSchema,
    outputSchema: SummarizeNotesOutputSchema,
  },
  async (input: SummarizeNotesInput) => {
    let transcribedText = input.existingTranscription;

    if (!transcribedText) {
      const transcriptionResult = await transcribeNotesPrompt({ photoDataUri: input.photoDataUri });
      transcribedText = transcriptionResult.text; // Access raw text via .text
    }
    
    if (!transcribedText || transcribedText.trim() === "") {
      console.warn("Transcription resulted in empty text for summarization.");
      return { summary: "Could not transcribe any text from the notes to summarize." };
    }

    const summaryResult = await summarizeTextPrompt({text: transcribedText});
    return summaryResult.output!; 
  }
);
