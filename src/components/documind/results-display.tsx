
"use client";

import type { DocumentType } from "@/services/document-analysis";
import type { SummarizeNotesOutput } from "@/ai/flows/summarize-notes";
import type { ExtractReceiptDataOutput } from "@/ai/flows/extract-receipt-data";
import type { Invoice } from "@/services/invoice"; // Assuming type from service
import type { GenerateContactCardOutput } from "@/ai/flows/generate-contact-card";
import { NotesViewer } from "./notes-viewer";
import { ReceiptViewer } from "./receipt-viewer";
import { InvoiceViewer } from "./invoice-viewer";
import { BusinessCardViewer } from "./business-card-viewer";
import { PrintedTextViewer } from "./printed-text-viewer";
import { Button } from "@/components/ui/button";
import { Copy, Share2, Download, Edit, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/download";
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ResultsDisplayProps {
  documentType: DocumentType | null;
  processedData: any; // This will hold data specific to documentType
  rawText: string; // Always provide raw text
  onEditToggle?: () => void;
  isEditing?: boolean;
  onRawTextChange?: (newText: string) => void; // Add this prop
}

export function ResultsDisplay({ documentType, processedData, rawText, onEditToggle, isEditing, onRawTextChange }: ResultsDisplayProps) {
  const { toast } = useToast();

  const getShareableText = (): string => {
    let shareable = "";
    if (documentType === 'handwritten_notes' && processedData?.summary) {
      shareable += `Summary:\n${processedData.summary}\n\n`;
    }
    shareable += `Full Text:\n${rawText}`;
    return shareable;
  };

  const handleCopyToClipboard = () => {
    const textToCopy = getShareableText();
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast({ title: "Copied to Clipboard", description: "Content has been copied." });
    }).catch(err => {
      toast({ title: "Copy Failed", description: "Could not copy content.", variant: "destructive" });
      console.error('Failed to copy: ', err);
    });
  };

  const handleShare = async () => {
    const textToShare = getShareableText();
    const title = documentType === 'handwritten_notes' && processedData?.summary 
                  ? "DocuMind - Notes Summary & Transcription" 
                  : "DocuMind - Extracted Text";

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: textToShare,
        });
        toast({ title: "Shared Successfully" });
      } catch (error) {
        console.error("Error sharing:", error);
        // Check if error is AbortError, which means user cancelled share
        if ((error as DOMException).name !== 'AbortError') {
          toast({ title: "Share Failed", description: "Could not share content.", variant: "destructive" });
        }
      }
    } else {
      toast({ title: "Share Not Supported", description: "Web Share API is not available on your browser/device. Copied to clipboard instead." });
      handleCopyToClipboard(); // Fallback to copy
    }
  };

  const handleDownload = (format: "csv") => {
    let content = "";
    let mimeType = "text/plain";
    let extension = format;

    const dataToUse = rawText; 

    switch (format) {
      case "csv":
        // Basic CSV for receipts/invoices (items)
        if ((documentType === 'retail_receipt' || documentType === 'invoice') && processedData?.items && Array.isArray(processedData.items) && processedData.items.length > 0 ) {
          const headers = Object.keys(processedData.items[0]).join(',');
          const rows = processedData.items.map((item: any) => Object.values(item).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
          content = `${headers}\n${rows}`;
          mimeType = "text/csv";
        } else {
          toast({ title: "CSV Not Applicable", description: "CSV export is best for itemized data like receipts or invoices." });
          return;
        }
        break;
    }
    downloadFile(`documind_export.${extension}`, content, mimeType);
    toast({ title: "Download Started", description: `Exported as ${extension.toUpperCase()}` });
  };


  const renderContent = () => {
    if (!documentType) { 
        return <PrintedTextViewer text={rawText} isEditing={isEditing} onTextChange={onRawTextChange} />;
    }

    switch (documentType) {
      case "handwritten_notes":
        return <NotesViewer summaryData={processedData as SummarizeNotesOutput} rawTranscription={rawText} isEditing={isEditing} onRawTextChange={onRawTextChange}/>;
      case "retail_receipt":
        return (
          <>
            <ReceiptViewer receiptData={(processedData as ExtractReceiptDataOutput).receipt} />
            {isEditing && (
                 <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2 text-foreground">Raw Text (Editable)</h3>
                    <PrintedTextViewer text={rawText} isEditing={isEditing} onTextChange={onRawTextChange} />
                 </div>
            )}
          </>
        );
      case "invoice":
        return (
          <>
            <InvoiceViewer invoiceData={processedData as Invoice} />
            {isEditing && (
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2 text-foreground">Raw Text (Editable)</h3>
                    <PrintedTextViewer text={rawText} isEditing={isEditing} onTextChange={onRawTextChange} />
                </div>
            )}
          </>
        );
      case "business_card":
        const cardData = processedData as GenerateContactCardOutput;
        return (
          <>
            <BusinessCardViewer contactData={cardData.contactInfo} vCardData={cardData.vCard} />
             {isEditing && (
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2 text-foreground">Raw Text (Editable)</h3>
                    <PrintedTextViewer text={rawText} isEditing={isEditing} onTextChange={onRawTextChange} />
                </div>
            )}
          </>
        );
      case "printed_text":
      default:
        return <PrintedTextViewer text={rawText} isEditing={isEditing} onTextChange={onRawTextChange} />;
    }
  };

  const showEditButton = onEditToggle && rawText && 
    (documentType === 'handwritten_notes' || 
     documentType === 'printed_text' ||
     documentType === 'retail_receipt' || 
     documentType === 'invoice' || 
     documentType === 'business_card' 
     );


  return (
    <TooltipProvider>
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {showEditButton && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onEditToggle}>
                  {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  <span className="sr-only">{isEditing ? "Save Text" : "Edit Text"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isEditing ? "Save Text" : "Edit Text"}</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleCopyToClipboard}>
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Share</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share</p>
            </TooltipContent>
          </Tooltip>
          {(documentType === 'retail_receipt' || documentType === 'invoice') && processedData?.items?.length > 0 && (
             <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => handleDownload("csv")}>
                  <Download className="h-4 w-4" />
                   <span className="sr-only">Download CSV</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download CSV</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {renderContent()}
      </div>
    </TooltipProvider>
  );
}

