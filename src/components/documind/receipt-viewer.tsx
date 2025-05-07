"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import type { ExtractReceiptDataOutput } from "@/ai/flows/extract-receipt-data";

interface ReceiptViewerProps {
  receiptData: ExtractReceiptDataOutput["receipt"];
}

export function ReceiptViewer({ receiptData }: ReceiptViewerProps) {
  const {
    vendorName,
    dateTimeOfPurchase,
    items,
    subtotal,
    taxes,
    totalAmount,
    paymentMethod,
    storeAddress,
  } = receiptData;

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">{vendorName || "Receipt Details"}</CardTitle>
        <CardDescription>
          {dateTimeOfPurchase}
          {storeAddress && ` - ${storeAddress}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
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
                <TableCell className="text-right">${item.pricePerItem.toFixed(2)}</TableCell>
                <TableCell className="text-right">${item.totalPrice.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Separator className="my-4" />
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxes:</span>
            <span>${taxes.toFixed(2)}</span>
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between font-semibold text-base">
            <span>Total:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>
        {paymentMethod && (
          <>
            <Separator className="my-4" />
            <div className="text-sm">
              <span className="font-medium">Payment Method:</span> {paymentMethod}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
