'use server';
/**
 * @fileOverview Extracts structured data from an invoice image.
 *
 * - extractInvoiceData - A function that handles the invoice data extraction process.
 * - ExtractInvoiceDataInput - The input type for the extractInvoiceData function.
 * - ExtractInvoiceDataOutput - The return type for the extractInvoiceData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InvoiceItemSchema = z.object({
  description: z.string().describe('A description of the item or service.'),
  quantity: z.number().describe('The quantity of the item or service. Default to 1 if not specified.'),
  unitPrice: z.number().describe('The price per unit of the item or service.'),
  totalPrice: z.number().describe('The total price for this line item (quantity * unit price).'),
});
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

const InvoiceSchema = z.object({
  invoiceNumber: z.string().describe('The invoice number or bill ID. If not found, use "N/A".'),
  issueDate: z.string().describe('The date the invoice was issued (e.g., YYYY-MM-DD or "N/A" if not found).'),
  dueDate: z.string().describe('The date the invoice is due (e.g., YYYY-MM-DD or "N/A" if not found).'),
  billerInformation: z.string().describe('Full information about the biller (name, address, contact details). If not found, use "N/A".'),
  recipientInformation: z.string().describe('Full information about the recipient (name, address, contact details). If not found, use "N/A".'),
  items: z.array(InvoiceItemSchema).describe('An array of items or services listed in the invoice. If no items are clearly discernible, return an empty array.'),
  subtotal: z.number().describe('The subtotal amount before taxes and discounts. If not found, calculate from items or use 0.'),
  taxes: z.number().describe('The total amount of taxes applied. If not found, use 0.'),
  discounts: z.number().describe('The total amount of discounts applied (as a positive value). If not found, use 0.'),
  totalAmountDue: z.number().describe('The final total amount due for the invoice. This should be the most prominent total figure.'),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

export const ExtractInvoiceDataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an invoice, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractInvoiceDataInput = z.infer<typeof ExtractInvoiceDataInputSchema>;

export const ExtractInvoiceDataOutputSchema = z.object({
  invoice: InvoiceSchema.describe('The extracted invoice information.'),
});
export type ExtractInvoiceDataOutput = z.infer<typeof ExtractInvoiceDataOutputSchema>;

export async function extractInvoiceData(input: ExtractInvoiceDataInput): Promise<ExtractInvoiceDataOutput> {
  return extractInvoiceDataFlowInternal(input);
}

const extractInvoicePrompt = ai.definePrompt({
  name: 'extractInvoicePrompt',
  input: {schema: ExtractInvoiceDataInputSchema},
  output: {schema: ExtractInvoiceDataOutputSchema},
  prompt: `You are an expert data extraction tool specializing in invoices. Analyze the provided invoice image and extract the following information accurately.
  If a field is not present or clearly discernible, use "N/A" for string fields and 0 for numeric fields (like taxes, discounts) or an empty array for item lists.
  Ensure all monetary values are numbers.

  Extract the following details:
  - Invoice Number
  - Issue Date
  - Due Date
  - Biller Information (Name, Address, Contact)
  - Recipient Information (Name, Address, Contact)
  - Line Items (each with Description, Quantity, Unit Price, Total Price)
    - For quantity, if not explicitly stated, assume 1.
    - If unit price or total price is missing for an item, try to calculate it if possible, otherwise use 0.
  - Subtotal
  - Taxes
  - Discounts (as a positive value if present)
  - Total Amount Due (this is the most important final amount)

  Invoice Image: {{media url=photoDataUri}}`,
});

const extractInvoiceDataFlowInternal = ai.defineFlow(
  {
    name: 'extractInvoiceDataFlowInternal',
    inputSchema: ExtractInvoiceDataInputSchema,
    outputSchema: ExtractInvoiceDataOutputSchema,
  },
  async (input) => {
    const {output} = await extractInvoicePrompt(input);
    if (!output) {
      throw new Error('Failed to extract invoice data from the AI model.');
    }
    return output;
  }
);