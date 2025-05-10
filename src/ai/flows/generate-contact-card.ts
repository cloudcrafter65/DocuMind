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

const GenerateContactCardInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a business card, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateContactCardInput = z.infer<typeof GenerateContactCardInputSchema>;

const ContactInfoSchema = z.object({
    fullName: z.string().describe('The full name extracted from the business card. If not found, use "N/A".'),
    jobTitle: z.string().describe('The job title extracted from the business card. If not found, use "N/A".'),
    companyName: z.string().describe('The company name extracted from the business card. If not found, use "N/A".'),
    phoneNumbers: z.array(z.string()).describe('An array of phone numbers extracted from the business card. If none found, return an empty array.'),
    emailAddresses: z.array(z.string()).describe('An array of email addresses extracted from the business card. If none found, return an empty array.'),
    website: z.string().describe('The website URL extracted from the business card. If not found, use "N/A".'),
    address: z.string().describe('The physical address extracted from the business card. If not found, use "N/A".'),
});

const GenerateContactCardOutputSchema = z.object({
  contactInfo: ContactInfoSchema.describe('Extracted contact information from the business card.'),
  vCard: z.string().describe('The vCard data generated from the contact information.'),
});
export type GenerateContactCardOutput = z.infer<typeof GenerateContactCardOutputSchema>;


export async function generateContactCard(input: GenerateContactCardInput): Promise<GenerateContactCardOutput> {
  return generateContactCardFlow(input);
}

const extractBusinessCardInfoPrompt = ai.definePrompt({
  name: 'extractBusinessCardInfoPrompt',
  input: { schema: GenerateContactCardInputSchema },
  output: { schema: ContactInfoSchema },
  prompt: `You are an expert data extraction tool specializing in business cards. Analyze the provided business card image and extract the following information accurately.
  If a field is not present or clearly discernible, use "N/A" for string fields and an empty array for array fields (like phoneNumbers, emailAddresses).

  Extract the following details:
  - Full Name
  - Job Title
  - Company Name
  - Phone Numbers (list all found)
  - Email Addresses (list all found)
  - Website
  - Physical Address

  Business Card Image: {{media url=photoDataUri}}`,
});


const generateContactCardFlow = ai.defineFlow(
  {
    name: 'generateContactCardFlow',
    inputSchema: GenerateContactCardInputSchema,
    outputSchema: GenerateContactCardOutputSchema,
  },
  async input => {
    const { output: extractedInfo } = await extractBusinessCardInfoPrompt({ photoDataUri: input.photoDataUri });

    if (!extractedInfo) {
        throw new Error("Failed to extract business card information from the AI model.");
    }
    
    const businessCardInfo = extractedInfo;

    // Generate vCard data
    // Ensure graceful handling of potentially N/A or empty fields
    const N = businessCardInfo.fullName !== "N/A" ? businessCardInfo.fullName.split(' ').pop() + ';' + businessCardInfo.fullName.split(' ').slice(0,-1).join(' ') : '';
    const FN = businessCardInfo.fullName !== "N/A" ? businessCardInfo.fullName : '';
    const ORG = businessCardInfo.companyName !== "N/A" ? businessCardInfo.companyName : '';
    const TITLE = businessCardInfo.jobTitle !== "N/A" ? businessCardInfo.jobTitle : '';
    
    let telLines = '';
    if (businessCardInfo.phoneNumbers && businessCardInfo.phoneNumbers.length > 0) {
      telLines = businessCardInfo.phoneNumbers.map(num => `TEL;TYPE=WORK,VOICE:${num}`).join('\n');
    }

    let emailLines = '';
    if (businessCardInfo.emailAddresses && businessCardInfo.emailAddresses.length > 0) {
      emailLines = businessCardInfo.emailAddresses.map(email => `EMAIL:${email}`).join('\n');
    }
    
    const ADR = businessCardInfo.address !== "N/A" ? `ADR;TYPE=WORK:${businessCardInfo.address}` : '';
    const URL = businessCardInfo.website !== "N/A" ? `URL:${businessCardInfo.website}` : '';

    let vCardData = `BEGIN:VCARD\nVERSION:3.0`;
    if (N) vCardData += `\nN:${N}`;
    if (FN) vCardData += `\nFN:${FN}`;
    if (ORG) vCardData += `\nORG:${ORG}`;
    if (TITLE) vCardData += `\nTITLE:${TITLE}`;
    if (telLines) vCardData += `\n${telLines}`;
    if (emailLines) vCardData += `\n${emailLines}`;
    if (ADR) vCardData += `\n${ADR}`;
    if (URL) vCardData += `\n${URL}`;
    vCardData += `\nEND:VCARD`;


    return {
      contactInfo: businessCardInfo,
      vCard: vCardData,
    };
  }
);
