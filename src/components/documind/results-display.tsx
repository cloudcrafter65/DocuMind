"use client";

import type { DocumentType } from "@/services/document-analysis";
import type { SummarizeNotesOutput } from "@/ai/flows/summarize-notes";
import type { ExtractReceiptDataOutput } from "@/ai/flows/extract-receipt-data";
import type { ExtractInvoiceDataOutput } from "@/ai/flows/extract-invoice-data-flow"; // Updated import
import type { GenerateContactCardOutput } from "@/ai/flows/generate-contact-card";
import { NotesViewer } from "./notes-viewer";
import { ReceiptViewer } from "./receipt-viewer";
import { InvoiceViewer } from "./invoice-viewer";
import { BusinessCardViewer } from "./business-card-viewer";
import { PrintedTextViewer } from "./printed-text-viewer";
import { Button } from "@/components/ui/button";
import { Copy, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ResultsDisplayProps {
  documentType: DocumentType | null;
  processedData: any;
  rawText: string;
  onEditToggle?: () => void;
  isEditing?: boolean;
  onRawTextChange?: (newText: string) => void;
  fontSize: string;
}

export function ResultsDisplay({ documentType, processedData, rawText, onEditToggle, isEditing, onRawTextChange, fontSize }: ResultsDisplayProps) {
  const { toast } = useToast();

  const getShareableText = (): string => {
    let shareable = "";
    if (documentType === 'handwritten_notes' && processedData?.summary) {
      shareable += `Summary:\n${processedData.summary}\n\n`;
    } else if (documentType === 'printed_text' && (processedData?.text || rawText)) {
      // rawText is the main content for printed_text, processedData.text is fallback
    } else if (documentType === 'invoice' && processedData?.invoice) {
      const inv = processedData.invoice;
      shareable += `Invoice Summary:\nNumber: ${inv.invoiceNumber}\nTotal Due: ${inv.totalAmountDue}\nDue Date: ${inv.dueDate}\n\n`;
    } else if (documentType === 'retail_receipt' && processedData?.receipt) {
      const rec = processedData.receipt;
      shareable += `Receipt Summary:\nVendor: ${rec.vendorName}\nTotal: ${rec.totalAmount}\nDate: ${rec.dateTimeOfPurchase}\n\n`;
    } else if (processedData && typeof processedData === 'object' && 'summary' in processedData && processedData.summary) { // Generic summary
      shareable += `Summary:\n${processedData.summary}\n\n`;
    }
    
    if (rawText) {
      shareable += `Full Text/Details:\n${rawText}`;
    } else if (!shareable && processedData?.text) { 
      shareable += `Text:\n${processedData.text}`;
    } else if (!shareable && documentType === 'business_card' && processedData?.contactInfo) {
      const { fullName, jobTitle, companyName, phoneNumbers, emailAddresses, website, address } = processedData.contactInfo;
      shareable = `Contact: ${fullName || 'N/A'}\nTitle: ${jobTitle || 'N/A'}\nCompany: ${companyName || 'N/A'}\nPhone: ${phoneNumbers?.join(', ') || 'N/A'}\nEmail: ${emailAddresses?.join(', ') || 'N/A'}\nWebsite: ${website || 'N/A'}\nAddress: ${address || 'N/A'}`;
    }
    return shareable.trim();
  };

  const handleCopyToClipboard = () => {
    const textToCopy = getShareableText();
    if (!textToCopy) {
      toast({ title: "Nothing to Copy", description: "No content available to copy.", variant: "default" });
      return;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast({ title: "Copied to Clipboard", description: "Content has been copied." });
    }).catch(err => {
      toast({ title: "Copy Failed", description: "Could not copy content.", variant: "destructive" });
      console.error('Failed to copy: ', err);
    });
  };

  const handleShare = async () => {
    const textToShare = getShareableText();
    if (!textToShare) {
      toast({ title: "Nothing to Share", description: "No content available to share.", variant: "default" });
      return;
    }
    let shareTitle = "DocuMind - Extracted Content";
    if (documentType) {
        shareTitle = `DocuMind - ${documentType.replace(/_/g, ' ')} Details`;
    }


    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: textToShare,
        });
      } catch (error) {
        console.error("Error sharing:", error);
        if ((error as DOMException).name !== 'AbortError') { 
          toast({ title: "Share Failed", description: "Could not share content.", variant: "destructive" });
        }
      }
    } else {
      toast({ title: "Share Not Supported", description: "Web Share API is not available. Copied to clipboard instead." });
      handleCopyToClipboard();
    }
  };
  
  const renderContent = () => {
    if (!documentType && !rawText && !processedData) {
        return <p className="text-muted-foreground px-1 py-2">No data to display yet. Process an image to see results.</p>;
    }
    
    if (!documentType && rawText) { // If only raw text is available (e.g. after paste, before processing type)
        return <PrintedTextViewer text={rawText} isEditing={isEditing} onTextChange={onRawTextChange} fontSize={fontSize} onEditToggle={onEditToggle} />;
    }

    switch (documentType) {
      case "handwritten_notes":
        return <NotesViewer summaryData={processedData as SummarizeNotesOutput} rawTranscription={rawText} isEditing={isEditing} onRawTextChange={onRawTextChange} fontSize={fontSize} onEditToggle={onEditToggle} />;
      case "retail_receipt":
        return (
          <div className="space-y-4">
            <ReceiptViewer receiptData={(processedData as ExtractReceiptDataOutput).receipt} />
            {(rawText || (isEditing && onRawTextChange)) && ( 
                 <PrintedTextViewer 
                    text={rawText} 
                    isEditing={!!isEditing} 
                    onTextChange={onRawTextChange} 
                    fontSize={fontSize} 
                    onEditToggle={onEditToggle} 
                    header="Raw Extracted Text (Receipt)"
                />
            )}
          </div>
        );
      case "invoice":
        return (
          <div className="space-y-4">
            <InvoiceViewer invoiceData={(processedData as ExtractInvoiceDataOutput).invoice} />
            {(rawText || (isEditing && onRawTextChange)) && (
                <PrintedTextViewer 
                    text={rawText} 
                    isEditing={!!isEditing} 
                    onTextChange={onRawTextChange} 
                    fontSize={fontSize} 
                    onEditToggle={onEditToggle}
                    header="Raw Extracted Text (Invoice)"
                />
            )}
          </div>
        );
      case "business_card":
        const cardData = processedData as GenerateContactCardOutput;
        return (
          <div className="space-y-4">
            <BusinessCardViewer contactData={cardData.contactInfo} vCardData={cardData.vCard} />
             {(rawText || (isEditing && onRawTextChange)) && (
                <PrintedTextViewer 
                    text={rawText} 
                    isEditing={!!isEditing} 
                    onTextChange={onRawTextChange} 
                    fontSize={fontSize} 
                    onEditToggle={onEditToggle}
                    header="Raw Extracted Text (Business Card)"
                />
            )}
          </div>
        );
      case "printed_text":
      default:
        // For printed_text, processedData might be { text: "..." } or rawText might be the primary source.
        const textToShow = processedData?.text ?? rawText;
        return <PrintedTextViewer text={textToShow} isEditing={isEditing} onTextChange={onRawTextChange} fontSize={fontSize} onEditToggle={onEditToggle} />;
    }
  };

  return (
    <TooltipProvider>
      <div className="mt-2 space-y-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleCopyToClipboard} aria-label="Copy content">
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy</p>
            </TooltipContent>
          </Tooltip>
          {typeof navigator !== 'undefined' && navigator.share && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleShare} aria-label="Share content">
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {renderContent()}
      </div>
    </TooltipProvider>
  );
}
