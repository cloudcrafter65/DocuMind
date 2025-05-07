'use server';
/**
 * @fileOverview Extracts data from a retail receipt image.
 *
 * - extractReceiptData - A function that handles the receipt data extraction process.
 * - ExtractReceiptDataInput - The input type for the extractReceiptData function.
 * - ExtractReceiptDataOutput - The return type for the extractReceiptData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {extractReceiptInformation, Receipt} from '@/services/receipt';

const ExtractReceiptDataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a retail receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractReceiptDataInput = z.infer<typeof ExtractReceiptDataInputSchema>;

const ExtractReceiptDataOutputSchema = z.object({
  receipt: z.object({
    vendorName: z.string().describe('The name of the vendor or store.'),
    dateTimeOfPurchase: z.string().describe('The date and time of purchase.'),
    items: z.array(
      z.object({
        description: z.string().describe('A description of the item.'),
        quantity: z.number().describe('The quantity of the item.'),
        pricePerItem: z.number().describe('The price per item.'),
        totalPrice: z.number().describe('The total price for the item.'),
      })
    ).describe('An array of items included in the receipt.'),
    subtotal: z.number().describe('The subtotal amount of the receipt.'),
    taxes: z.number().describe('The taxes applied to the receipt (type and amount).'),
    totalAmount: z.number().describe('The total amount of the receipt.'),
    paymentMethod: z.string().describe('The payment method used.'),
    storeAddress: z.string().describe('The store address or contact information.'),
  }).describe('The extracted receipt information.'),
});
export type ExtractReceiptDataOutput = z.infer<typeof ExtractReceiptDataOutputSchema>;

export async function extractReceiptData(input: ExtractReceiptDataInput): Promise<ExtractReceiptDataOutput> {
  return extractReceiptDataFlow(input);
}

const extractReceiptDataFlow = ai.defineFlow(
  {
    name: 'extractReceiptDataFlow',
    inputSchema: ExtractReceiptDataInputSchema,
    outputSchema: ExtractReceiptDataOutputSchema,
  },
  async input => {
    const receipt = await extractReceiptInformation(input.photoDataUri);
    return {receipt};
  }
);
