"use client";

import type { DocumentType } from "@/services/document-analysis";
import type { SummarizeNotesOutput } from "@/ai/flows/summarize-notes";
import type { ExtractReceiptDataOutput } from "@/ai/flows/extract-receipt-data";
import type { Invoice } from "@/services/invoice";
import type { GenerateContactCardOutput } from "@/ai/flows/generate-contact-card";
import { NotesViewer } from "./notes-viewer";
import { ReceiptViewer } from "./receipt-viewer";
import { InvoiceViewer } from "./invoice-viewer";
import { BusinessCardViewer } from "./business-card-viewer";
import { PrintedTextViewer } from "./printed-text-viewer";
import { Button } from "@/components/ui/button";
import { Copy, Share2, Download } from "lucide-react"; // Removed Edit, Save
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/download";
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
    } else if (documentType === 'printed_text' && processedData?.text) {
      // rawText is the main content
    } else if (processedData && typeof processedData === 'object' && 'summary' in processedData && processedData.summary) {
      shareable += `Summary:\n${processedData.summary}\n\n`;
    }
    
    if (rawText) {
      shareable += `Full Text:\n${rawText}`;
    } else if (!shareable && processedData?.text) { // Fallback for printed_text if rawText is empty but processedData.text exists
      shareable += `Text:\n${processedData.text}`;
    } else if (!shareable && documentType === 'business_card' && processedData?.contactInfo) {
      const { fullName, jobTitle, companyName, phoneNumbers, emailAddresses, website, address } = processedData.contactInfo;
      shareable = `Contact: ${fullName}\nTitle: ${jobTitle}\nCompany: ${companyName}\nPhone: ${phoneNumbers?.join(', ')}\nEmail: ${emailAddresses?.join(', ')}\nWebsite: ${website}\nAddress: ${address}`;
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
    if (documentType === 'handwritten_notes' && processedData?.summary) {
      shareTitle = "DocuMind - Notes Summary & Transcription";
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: textToShare,
        });
        // toast({ title: "Shared Successfully" }); // Often, browsers handle their own share success/cancel UI
      } catch (error) {
        console.error("Error sharing:", error);
        if ((error as DOMException).name !== 'AbortError') { // Don't toast if user cancelled
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
    
    if (!documentType && rawText) {
        return <PrintedTextViewer text={rawText} isEditing={isEditing} onTextChange={onRawTextChange} fontSize={fontSize} onEditToggle={onEditToggle} />;
    }

    switch (documentType) {
      case "handwritten_notes":
        return <NotesViewer summaryData={processedData as SummarizeNotesOutput} rawTranscription={rawText} isEditing={isEditing} onRawTextChange={onRawTextChange} fontSize={fontSize} onEditToggle={onEditToggle} />;
      case "retail_receipt":
        return (
          <div className="space-y-4">
            <ReceiptViewer receiptData={(processedData as ExtractReceiptDataOutput).receipt} />
            {(rawText || isEditing) && ( // Show raw text or edit area if rawText exists or in edit mode
                 <PrintedTextViewer 
                    text={rawText} 
                    isEditing={isEditing} 
                    onTextChange={onRawTextChange} 
                    fontSize={fontSize} 
                    onEditToggle={rawText ? onEditToggle : undefined} // Only allow toggle if there's text
                    header={rawText ? "Raw Extracted Text (Receipt)" : (isEditing ? "Edit Raw Text (Receipt)" : "")}
                />
            )}
          </div>
        );
      case "invoice":
        return (
          <div className="space-y-4">
            <InvoiceViewer invoiceData={processedData as Invoice} />
            {(rawText || isEditing) && (
                <PrintedTextViewer 
                    text={rawText} 
                    isEditing={isEditing} 
                    onTextChange={onRawTextChange} 
                    fontSize={fontSize} 
                    onEditToggle={rawText ? onEditToggle : undefined}
                    header={rawText ? "Raw Extracted Text (Invoice)" : (isEditing ? "Edit Raw Text (Invoice)" : "")}
                />
            )}
          </div>
        );
      case "business_card":
        const cardData = processedData as GenerateContactCardOutput;
        return (
          <div className="space-y-4">
            <BusinessCardViewer contactData={cardData.contactInfo} vCardData={cardData.vCard} />
             {(rawText || isEditing) && (
                <PrintedTextViewer 
                    text={rawText} 
                    isEditing={isEditing} 
                    onTextChange={onRawTextChange} 
                    fontSize={fontSize} 
                    onEditToggle={rawText ? onEditToggle : undefined}
                    header={rawText ? "Raw Extracted Text (Business Card)" : (isEditing ? "Edit Raw Text (Business Card)" : "")}
                />
            )}
          </div>
        );
      case "printed_text":
      default:
        return <PrintedTextViewer text={rawText} isEditing={isEditing} onTextChange={onRawTextChange} fontSize={fontSize} onEditToggle={onEditToggle} />;
    }
  };

  return (
    <TooltipProvider>
      <div className="mt-2 space-y-4"> {/* Reduced top margin */}
        <div className="flex flex-wrap gap-2 mb-3">
          {/* Edit/Save button is now moved to individual viewers */}
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
          {navigator.share && (
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
