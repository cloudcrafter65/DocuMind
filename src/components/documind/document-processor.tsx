"use client";

import React, { useState, useCallback } from "react";
import { ImageUploader } from "@/components/documind/image-uploader";
import { ResultsDisplay } from "@/components/documind/results-display";
import { LoadingSpinner } from "@/components/documind/loading-spinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { imageFileToBase64 } from "@/lib/image-utils";

import { identifyDocumentType as identifyDocumentTypeFlow } from "@/ai/flows/identify-document-type";
import { summarizeNotes as summarizeNotesFlow } from "@/ai/flows/summarize-notes";
import { extractReceiptData as extractReceiptDataFlow } from "@/ai/flows/extract-receipt-data";
import { generateContactCard as generateContactCardFlow } from "@/ai/flows/generate-contact-card";
import { extractPrintedText as extractPrintedTextFlow } from "@/ai/flows/extract-printed-text-flow";
import { extractInvoiceData as extractInvoiceDataFlow } from "@/ai/flows/extract-invoice-data-flow";

import type { DocumentType } from "@/services/document-analysis";

interface DocumentProcessorProps {
  className?: string;
}

export function DocumentProcessor({ className }: DocumentProcessorProps) {
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [processedData, setProcessedData] = useState<any | null>(null);
  const [rawText, setRawText] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  
  const { toast } = useToast();

  const handleImageSelect = useCallback((file: File) => {
    setSelectedImageFile(file);
    setDocumentType(null);
    setProcessedData(null);
    setRawText("");
    setError(null);
    setIsEditing(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleProcessImage = async () => {
    if (!selectedImageFile) {
      setError("Please select an image first.");
      toast({ title: "Error", description: "No image selected.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsEditing(false);

    try {
      const imageDataUri = await imageFileToBase64(selectedImageFile);
      
      toast({ title: "Processing Started", description: "Identifying document type..." });
      const idOutput = await identifyDocumentTypeFlow({ photoDataUri: imageDataUri });
      setDocumentType(idOutput.documentType);
      toast({ title: "Document Type Identified", description: `Type: ${idOutput.documentType.replace(/_/g, ' ')}` });

      let extractedTextForProcessing = "";
      if (idOutput.documentType !== 'business_card') { 
         const textExtractionResult = await extractPrintedTextFlow({ photoDataUri: imageDataUri });
         extractedTextForProcessing = textExtractionResult.text;
         setRawText(extractedTextForProcessing); 
      }

      switch (idOutput.documentType) {
        case "handwritten_notes":
          toast({ title: "Processing Notes", description: "Transcribing and summarizing handwritten notes..." });
          if (!extractedTextForProcessing || extractedTextForProcessing.trim() === "") {
             toast({ title: "Transcription Empty", description: "Could not transcribe text from notes. Summary cannot be generated.", variant: "default" });
             setProcessedData({ summary: "No text transcribed to summarize." });
          } else {
            const notesOutput = await summarizeNotesFlow({ photoDataUri: imageDataUri, existingTranscription: extractedTextForProcessing });
            setProcessedData(notesOutput);
          }
          break;
        case "retail_receipt":
          toast({ title: "Processing Receipt", description: "Extracting receipt data..." });
          const receiptOutput = await extractReceiptDataFlow({ photoDataUri: imageDataUri });
          setProcessedData(receiptOutput);
          break;
        case "invoice":
          toast({ title: "Processing Invoice", description: "Extracting invoice data..." });
          const invoiceOutput = await extractInvoiceDataFlow({ photoDataUri: imageDataUri }); 
          setProcessedData(invoiceOutput);
          break;
        case "business_card":
          toast({ title: "Processing Business Card", description: "Generating contact card..." });
          const cardOutput = await generateContactCardFlow({ photoDataUri: imageDataUri });
          setProcessedData(cardOutput);
          break;
        default:
          setError("Unsupported document type");
          return;
      }
    } catch (err) {
      console.error('Error processing document:', err);
      setError(err instanceof Error ? err.message : "An error occurred while processing the document");
      toast({ 
        title: "Processing Error", 
        description: err instanceof Error ? err.message : "An error occurred while processing the document",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("container mx-auto px-4", className)}>
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left side - Document Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>
              Upload or paste your document to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6">
              {error && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <ImageUploader
                onImageSelect={handleImageSelect}
                selectedImagePreview={selectedImagePreview}
              />
              
              {selectedImageFile && !isLoading && !processedData && (
                <Button 
                  onClick={handleProcessImage}
                  className="w-full"
                >
                  Process Document
                </Button>
              )}

              {isLoading && (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right side - Results */}
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              {processedData ? "Document analysis results" : "Upload a document to see the results"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {processedData ? (
              <ResultsDisplay
                documentType={documentType}
                processedData={processedData}
                rawText={rawText}
                onEditToggle={() => setIsEditing(!isEditing)}
                isEditing={isEditing}
                onRawTextChange={setRawText}
                fontSize="base"
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No document processed yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
