
"use client";

import type { NextPage } from "next";
import Head from "next/head";
import React, { useState, useEffect, useCallback } from "react";
import { DocuMindHeader } from "@/components/documind/header";
import { SettingsDialog, type AiProvider } from "@/components/documind/settings-dialog";
import { ImageUploader } from "@/components/documind/image-uploader";
import { ResultsDisplay } from "@/components/documind/results-display";
import { LoadingSpinner } from "@/components/documind/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { imageFileToBase64 } from "@/lib/image-utils";
import useLocalStorage from "@/hooks/use-local-storage"; // Added for API provider footnote

import { identifyDocumentType as identifyDocumentTypeFlow, type IdentifyDocumentTypeOutput } from "@/ai/flows/identify-document-type";
import { summarizeNotes as summarizeNotesFlow, type SummarizeNotesOutput } from "@/ai/flows/summarize-notes";
import { extractReceiptData as extractReceiptDataFlow, type ExtractReceiptDataOutput } from "@/ai/flows/extract-receipt-data";
import { generateContactCard as generateContactCardFlow, type GenerateContactCardOutput } from "@/ai/flows/generate-contact-card";
import { extractPrintedText as extractPrintedTextFlowOriginal, type ExtractPrintedTextOutput } from "@/ai/flows/extract-printed-text-flow";

// Assuming invoice will primarily return raw text or use a generic structure from Genkit
import { extractInvoiceInformation } from "@/services/invoice"; // Placeholder for AI flow
import type { DocumentType } from "@/services/document-analysis";
import type { Invoice } from "@/services/invoice";


const Home: NextPage = () => {
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [processedData, setProcessedData] = useState<any | null>(null);
  const [rawText, setRawText] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [apiProvider] = useLocalStorage<AiProvider>("documind_api_provider", "Google AI");


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
    setDocumentType(null);
    setProcessedData(null);
    setRawText("");
    setIsEditing(false);

    try {
      const imageDataUri = await imageFileToBase64(selectedImageFile);
      
      toast({ title: "Processing Started", description: "Identifying document type..." });
      const idOutput: IdentifyDocumentTypeOutput = await identifyDocumentTypeFlow({ photoDataUri: imageDataUri });
      setDocumentType(idOutput.documentType);
      toast({ title: "Document Type Identified", description: `Type: ${idOutput.documentType.replace(/_/g, ' ')}` });

      switch (idOutput.documentType) {
        case "handwritten_notes":
          toast({ title: "Processing Notes", description: "Summarizing handwritten notes..." });
          const transcriptionForNotes: ExtractPrintedTextOutput = await extractPrintedTextFlowOriginal({ photoDataUri: imageDataUri });
          setRawText(transcriptionForNotes.text); 

          if (!transcriptionForNotes.text || transcriptionForNotes.text.trim() === "") {
             toast({ title: "Transcription Empty", description: "Could not transcribe text from notes. Summary cannot be generated.", variant: "default" });
             setProcessedData({ summary: "No text transcribed to summarize." }); 
          } else {
            const notesOutput: SummarizeNotesOutput = await summarizeNotesFlow({ photoDataUri: imageDataUri, existingTranscription: transcriptionForNotes.text });
            setProcessedData(notesOutput);
          }
          break;
        case "retail_receipt":
          toast({ title: "Processing Receipt", description: "Extracting receipt data..." });
          const receiptOutput: ExtractReceiptDataOutput = await extractReceiptDataFlow({ photoDataUri: imageDataUri });
          setProcessedData(receiptOutput);
          const rawTextForReceipt: ExtractPrintedTextOutput = await extractPrintedTextFlowOriginal({ photoDataUri: imageDataUri });
          setRawText(rawTextForReceipt.text);
          break;
        case "invoice":
          toast({ title: "Processing Invoice", description: "Extracting invoice data..." });
          const invoiceOutput: Invoice = await extractInvoiceInformation(imageDataUri); 
          setProcessedData(invoiceOutput);
          const rawTextForInvoice: ExtractPrintedTextOutput = await extractPrintedTextFlowOriginal({ photoDataUri: imageDataUri });
          setRawText(rawTextForInvoice.text);
          break;
        case "business_card":
          toast({ title: "Processing Business Card", description: "Generating contact card..." });
          const cardOutput: GenerateContactCardOutput = await generateContactCardFlow({ photoDataUri: imageDataUri });
          setProcessedData(cardOutput);
          const rawTextForBizCard: ExtractPrintedTextOutput = await extractPrintedTextFlowOriginal({ photoDataUri: imageDataUri });
          setRawText(rawTextForBizCard.text); 
          break;
        case "printed_text":
        default:
          toast({ title: "Processing Text", description: "Extracting printed text..." });
          const textOutput: ExtractPrintedTextOutput = await extractPrintedTextFlowOriginal({ photoDataUri: imageDataUri });
          setProcessedData({ text: textOutput.text }); 
          setRawText(textOutput.text);
          break;
      }
      toast({ title: "Processing Complete", description: "Document processed successfully." });
    } catch (err: any) {
      console.error("Processing error:", err);
      const errorMessage = err.message || "An unknown error occurred during processing.";
      setError(errorMessage);
      toast({ title: "Processing Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditToggle = () => {
    if (isEditing) {
      if (documentType === 'printed_text' && processedData) {
        setProcessedData({ ...processedData, text: rawText });
      }
       if (documentType === 'handwritten_notes' && processedData) {
        // Potentially re-summarize if raw text changed significantly
        // For now, just save the raw text change.
        // If re-summarization is needed, a new call to summarizeNotesFlow would be required.
        toast({ title: "Text Saved", description: "Raw transcription updated. Summary may need regeneration if changes are substantial." });
      } else {
        toast({ title: "Text Saved", description: "Your changes have been locally saved." });
      }
    }
    setIsEditing(!isEditing);
  };


  return (
    <>
      <Head>
        <title>DocuMind - Intelligent Document Scanner</title>
        <meta name="description" content="Scan, extract text, and process documents intelligently with AI." />
      </Head>

      <div className="flex flex-col min-h-screen bg-background">
        <DocuMindHeader onSettingsClick={() => setIsSettingsOpen(true)} />
        
        <main className="flex-grow container mx-auto px-2 sm:px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-start">
            <div className="space-y-6">
              <ImageUploader onImageSelect={handleImageSelect} selectedImagePreview={selectedImagePreview} />
              {selectedImageFile && (
                <Button
                  onClick={handleProcessImage}
                  disabled={isLoading}
                  className="w-full text-lg py-6"
                >
                  {isLoading ? (
                    <LoadingSpinner message="Processing..." messageClassName="text-lg text-primary-foreground" />
                  ) : (
                    "Process Image"
                  )}
                </Button>
              )}
            </div>

            <div className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!isLoading && (documentType || rawText || processedData) && (
                <Card className="shadow-lg">
                   <CardHeader>
                    <CardTitle className="text-xl text-foreground">Processed Document</CardTitle>
                    {documentType && <CardDescription>Type: {documentType.replace(/_/g, ' ')}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <ResultsDisplay
                      documentType={documentType}
                      processedData={processedData}
                      rawText={rawText}
                      onEditToggle={handleEditToggle}
                      isEditing={isEditing}
                      onRawTextChange={setRawText} 
                    />
                  </CardContent>
                </Card>
              )}
              
              {!isLoading && !error && !documentType && !rawText && !processedData && selectedImageFile && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl text-foreground">Ready to Process</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Image selected. Click "Process Image" to analyze.</p>
                  </CardContent>
                </Card>
              )}

              {isLoading && <div className="flex justify-center items-center h-full"><LoadingSpinner message="Analyzing your document, please wait..." /></div>}
            </div>
          </div>
        </main>

        <footer className="py-6 text-center text-sm text-muted-foreground border-t">
          <p>© {new Date().getFullYear()} DocuMind. All rights reserved.</p>
          {apiProvider && <p className="mt-1">AI processing powered by: {apiProvider}</p>}
        </footer>
      </div>

      <SettingsDialog isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  );
};

export default Home;
