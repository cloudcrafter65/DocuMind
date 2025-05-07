'use server';

/**
 * @fileOverview A business card processing AI agent.
 *
 * - generateContactCard - A function that handles the business card processing.
 * - GenerateContactCardInput - The input type for the generateContactCard function.
 * - GenerateContactCardOutput - The return type for the generateContactCard function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {extractBusinessCardInformation, BusinessCard} from '@/services/business-card';

const GenerateContactCardInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a business card, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateContactCardInput = z.infer<typeof GenerateContactCardInputSchema>;

const GenerateContactCardOutputSchema = z.object({
  contactInfo: z.object({
        fullName: z.string().describe('The full name extracted from the business card.'),
        jobTitle: z.string().describe('The job title extracted from the business card.'),
        companyName: z.string().describe('The company name extracted from the business card.'),
        phoneNumbers: z.array(z.string()).describe('An array of phone numbers extracted from the business card.'),
        emailAddresses: z.array(z.string()).describe('An array of email addresses extracted from the business card.'),
        website: z.string().describe('The website URL extracted from the business card.'),
        address: z.string().describe('The physical address extracted from the business card.'),
    }).describe('Extracted contact information from the business card.'),
  vCard: z.string().describe('The vCard data generated from the contact information.'),
});
export type GenerateContactCardOutput = z.infer<typeof GenerateContactCardOutputSchema>;

export async function generateContactCard(input: GenerateContactCardInput): Promise<GenerateContactCardOutput> {
  return generateContactCardFlow(input);
}

const generateContactCardFlow = ai.defineFlow(
  {
    name: 'generateContactCardFlow',
    inputSchema: GenerateContactCardInputSchema,
    outputSchema: GenerateContactCardOutputSchema,
  },
  async input => {
    const businessCardInfo: BusinessCard = await extractBusinessCardInformation(input.photoDataUri);

    // Generate vCard data
    const vCardData = `BEGIN:VCARD\nVERSION:3.0\nN:${businessCardInfo.fullName};;\nFN:${businessCardInfo.fullName}\nORG:${businessCardInfo.companyName}\nTITLE:${businessCardInfo.jobTitle}\nTEL;TYPE=work,VOICE:${businessCardInfo.phoneNumbers.join('\nTEL;TYPE=work,VOICE:')}\nEMAIL:${businessCardInfo.emailAddresses.join('\nEMAIL:')}\nADR;TYPE=WORK:${businessCardInfo.address}\nURL:${businessCardInfo.website}\nEND:VCARD`;

    return {
      contactInfo: businessCardInfo,
      vCard: vCardData,
    };
  }
);
