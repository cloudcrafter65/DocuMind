
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
  processedData: any;
  rawText: string;
  onEditToggle?: () => void;
  isEditing?: boolean;
  onRawTextChange?: (newText: string) => void;
  fontSize: string; // Added fontSize prop
}

export function ResultsDisplay({ documentType, processedData, rawText, onEditToggle, isEditing, onRawTextChange, fontSize }: ResultsDisplayProps) {
  const { toast } = useToast();

  const getShareableText = (): string => {
    let shareable = "";
    if (documentType === 'handwritten_notes' && processedData?.summary) {
      shareable += `Summary:\n${processedData.summary}\n\n`;
    } else if (documentType === 'printed_text' && processedData?.text) {
      // No separate summary for printed_text, rawText is the main content
    } else if (processedData && typeof processedData === 'object' && 'summary' in processedData && processedData.summary) {
      // Generic summary if available for other types
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
        toast({ title: "Shared Successfully" });
      } catch (error) {
        console.error("Error sharing:", error);
        if ((error as DOMException).name !== 'AbortError') {
          toast({ title: "Share Failed", description: "Could not share content.", variant: "destructive" });
        }
      }
    } else {
      toast({ title: "Share Not Supported", description: "Web Share API is not available on your browser/device. Copied to clipboard instead." });
      handleCopyToClipboard();
    }
  };

  const handleDownload = (format: "csv") => {
    let content = "";
    let mimeType = "text/plain";
    let extension = format;

    switch (format) {
      case "csv":
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
    if (!documentType && !rawText && !processedData) {
        return <p className="text-muted-foreground">No data to display yet. Process an image to see results.</p>;
    }
    
    // Fallback for when documentType is null but there's rawText (e.g., initial generic text extraction)
    if (!documentType && rawText) {
        return <PrintedTextViewer text={rawText} isEditing={isEditing} onTextChange={onRawTextChange} fontSize={fontSize} />;
    }


    switch (documentType) {
      case "handwritten_notes":
        return <NotesViewer summaryData={processedData as SummarizeNotesOutput} rawTranscription={rawText} isEditing={isEditing} onRawTextChange={onRawTextChange} fontSize={fontSize}/>;
      case "retail_receipt":
        return (
          <div className="space-y-4">
            <ReceiptViewer receiptData={(processedData as ExtractReceiptDataOutput).receipt} />
            {isEditing && rawText && (
                 <PrintedTextViewer text={rawText} isEditing={isEditing} onTextChange={onRawTextChange} fontSize={fontSize} />
            )}
          </div>
        );
      case "invoice":
        return (
          <div className="space-y-4">
            <InvoiceViewer invoiceData={processedData as Invoice} />
            {isEditing && rawText && (
                <PrintedTextViewer text={rawText} isEditing={isEditing} onTextChange={onRawTextChange} fontSize={fontSize} />
            )}
          </div>
        );
      case "business_card":
        const cardData = processedData as GenerateContactCardOutput;
        return (
          <div className="space-y-4">
            <BusinessCardViewer contactData={cardData.contactInfo} vCardData={cardData.vCard} />
             {isEditing && rawText && (
                <PrintedTextViewer text={rawText} isEditing={isEditing} onTextChange={onRawTextChange} fontSize={fontSize} />
            )}
          </div>
        );
      case "printed_text":
      default:
        // Use rawText directly for printed_text, as processedData.text might be the same
        return <PrintedTextViewer text={rawText} isEditing={isEditing} onTextChange={onRawTextChange} fontSize={fontSize} />;
    }
  };

  const showEditButton = onEditToggle && rawText;


  return (
    <TooltipProvider>
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {showEditButton && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onEditToggle} aria-label={isEditing ? "Save Text" : "Edit Text"}>
                  {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isEditing ? "Save Text" : "Edit Text"}</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleCopyToClipboard} aria-label="Copy content to clipboard">
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
          {(documentType === 'retail_receipt' || documentType === 'invoice') && processedData?.items?.length > 0 && (
             <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => handleDownload("csv")} aria-label="Download data as CSV">
                  <Download className="h-4 w-4" />
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
