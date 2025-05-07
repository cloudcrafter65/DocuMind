"use client";

import type { Invoice } from "@/services/invoice"; // Assuming type comes from the service initially
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface InvoiceViewerProps {
  invoiceData: Invoice; // This will be populated by AI flow in a real app
}

// Placeholder function that would call the AI flow
async function extractInvoiceInformationFromAI(imageDataUri: string): Promise<Invoice> {
  // In a real app, this would call:
  // import { extractInvoiceInformation as extractInvoiceAIFlow } from '@/ai/flows/extract-invoice-data'; // Assuming this flow exists
  // const result = await extractInvoiceAIFlow({ photoDataUri: imageDataUri });
  // return result.invoice;
  
  // For UI demo, using the placeholder from services/invoice.ts
  const { extractInvoiceInformation } = await import("@/services/invoice");
  return extractInvoiceInformation(imageDataUri);
}


export function InvoiceViewer({ invoiceData }: InvoiceViewerProps) {
  const {
    invoiceNumber,
    issueDate,
    dueDate,
    billerInformation,
    recipientInformation,
    items,
    subtotal,
    taxes,
    discounts,
    totalAmountDue,
  } = invoiceData;

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Invoice #{invoiceNumber}</CardTitle>
            <CardDescription>
              Issued: {issueDate} &nbsp;&nbsp;&nbsp; Due: {dueDate}
            </CardDescription>
          </div>
          {/* Potential place for company logo if AI can extract it */}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-semibold mb-1">Biller:</h3>
            <p className="whitespace-pre-wrap">{billerInformation}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Recipient:</h3>
            <p className="whitespace-pre-wrap">{recipientInformation}</p>
          </div>
        </div>

        <Separator />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.description}</TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right">${item.totalPrice.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Separator />

        <div className="space-y-1 text-sm ml-auto max-w-xs">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {taxes > 0 && (
            <div className="flex justify-between">
              <span>Taxes:</span>
              <span>${taxes.toFixed(2)}</span>
            </div>
          )}
          {discounts > 0 && (
            <div className="flex justify-between">
              <span>Discounts:</span>
              <span className="text-green-600">-${discounts.toFixed(2)}</span>
            </div>
          )}
          <Separator className="my-1" />
          <div className="flex justify-between font-semibold text-base">
            <span>Total Amount Due:</span>
            <span>${totalAmountDue.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
