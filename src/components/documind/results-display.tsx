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
import React, { useState } from 'react';

interface ResultsDisplayProps {
  documentType: DocumentType | null;
  processedData: any; // This will hold data specific to documentType
  rawText: string; // Always provide raw text
  onEditToggle?: () => void;
  isEditing?: boolean;
}

export function ResultsDisplay({ documentType, processedData, rawText, onEditToggle, isEditing }: ResultsDisplayProps) {
  const { toast } = useToast();
  const [editableRawText, setEditableRawText] = useState(rawText);

  React.useEffect(() => {
    setEditableRawText(rawText);
  }, [rawText]);


  const handleCopyToClipboard = (textToCopy: string = rawText) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast({ title: "Copied to Clipboard", description: "Text has been copied." });
    }).catch(err => {
      toast({ title: "Copy Failed", description: "Could not copy text.", variant: "destructive" });
      console.error('Failed to copy: ', err);
    });
  };

  const handleShare = async (textToShare: string = rawText, title: string = "DocuMind - Extracted Text") => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: textToShare,
        });
        toast({ title: "Shared Successfully" });
      } catch (error) {
        console.error("Error sharing:", error);
        toast({ title: "Share Failed", description: "Could not share content.", variant: "destructive" });
      }
    } else {
      toast({ title: "Share Not Supported", description: "Web Share API is not available on your browser/device. Copied to clipboard instead." });
      handleCopyToClipboard(textToShare);
    }
  };

  const handleDownload = (format: "txt" | "md" | "json" | "csv") => {
    let content = "";
    let mimeType = "text/plain";
    let extension = format;

    const dataToUse = isEditing ? editableRawText : rawText;

    switch (format) {
      case "txt":
        content = dataToUse;
        break;
      case "md":
        // Basic markdown conversion, can be enhanced
        content = `# ${documentType || "Document"}\n\n${dataToUse}`;
        break;
      case "json":
        content = JSON.stringify({ documentType, rawText: dataToUse, processedData }, null, 2);
        mimeType = "application/json";
        break;
      case "csv":
        // Basic CSV for receipts/invoices (items)
        if ((documentType === 'retail_receipt' || documentType === 'invoice') && processedData?.items) {
          const headers = Object.keys(processedData.items[0]).join(',');
          const rows = processedData.items.map((item: any) => Object.values(item).join(',')).join('\n');
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
    if (!documentType || !processedData) {
      return <PrintedTextViewer text={editableRawText} isEditing={isEditing} onTextChange={setEditableRawText} />;
    }

    switch (documentType) {
      case "handwritten_notes":
        return <NotesViewer summaryData={processedData as SummarizeNotesOutput} rawTranscription={editableRawText} isEditing={isEditing} onRawTextChange={setEditableRawText}/>;
      case "retail_receipt":
        return <ReceiptViewer receiptData={(processedData as ExtractReceiptDataOutput).receipt} />;
      case "invoice":
        return <InvoiceViewer invoiceData={processedData as Invoice} />;
      case "business_card":
        const cardData = processedData as GenerateContactCardOutput;
        return <BusinessCardViewer contactData={cardData.contactInfo} vCardData={cardData.vCard} />;
      case "printed_text":
      default:
        return <PrintedTextViewer text={editableRawText} isEditing={isEditing} onTextChange={setEditableRawText} />;
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {onEditToggle && (documentType === 'handwritten_notes' || documentType === 'printed_text') && (
          <Button variant="outline" onClick={onEditToggle}>
            {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
            {isEditing ? "Save Text" : "Edit Text"}
          </Button>
        )}
        <Button variant="outline" onClick={() => handleCopyToClipboard(isEditing ? editableRawText : rawText)}>
          <Copy className="mr-2 h-4 w-4" /> Copy Text
        </Button>
        <Button variant="outline" onClick={() => handleShare(isEditing ? editableRawText : rawText)}>
          <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
        <Button variant="outline" onClick={() => handleDownload("txt")}>
          <Download className="mr-2 h-4 w-4" /> TXT
        </Button>
        <Button variant="outline" onClick={() => handleDownload("md")}>
          <Download className="mr-2 h-4 w-4" /> MD
        </Button>
         {(documentType === 'retail_receipt' || documentType === 'invoice' || documentType === 'business_card') && (
          <Button variant="outline" onClick={() => handleDownload("json")}>
            <Download className="mr-2 h-4 w-4" /> JSON
          </Button>
        )}
        {(documentType === 'retail_receipt' || documentType === 'invoice') && processedData?.items?.length > 0 && (
          <Button variant="outline" onClick={() => handleDownload("csv")}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
        )}
      </div>
      {renderContent()}
    </div>
  );
}
