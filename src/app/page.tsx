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

import { identifyDocumentType as identifyDocumentTypeFlow, type IdentifyDocumentTypeOutput } from "@/ai/flows/identify-document-type";
import { summarizeNotes as summarizeNotesFlow, type SummarizeNotesOutput } from "@/ai/flows/summarize-notes";
import { extractReceiptData as extractReceiptDataFlow, type ExtractReceiptDataOutput } from "@/ai/flows/extract-receipt-data";
import { generateContactCard as generateContactCardFlow, type GenerateContactCardOutput } from "@/ai/flows/generate-contact-card";
// Assuming invoice and printed text will primarily return raw text or use a generic structure from Genkit
import { extractInvoiceInformation } from "@/services/invoice"; // Placeholder for AI flow
import type { DocumentType } from "@/services/document-analysis";
import type { Invoice } from "@/services/invoice";

// Placeholder for printed text AI flow - Genkit would typically just extract text
async function extractPrintedTextFlow(input: { photoDataUri: string }): Promise<{ text: string }> {
  // This would be a simple text extraction prompt with Genkit
  // For now, simulate by calling summarizeNotes which includes transcription
  const summaryResult = await summarizeNotesFlow(input);
  // We need the raw transcription part. Assuming summarizeNotesFlow or a base transcription flow gives this.
  // For this example, we'll reuse the summary for simplicity, but in real app, it would be raw text.
  // A more direct Genkit flow would be:
  // const transcribePrompt = ai.definePrompt({..., prompt: `Extract all text: {{media url=photoDataUri}}`});
  // const { output } = await transcribePrompt(input);
  // return { text: output };
  return { text: `Simulated raw text extraction: ${summaryResult.summary}` }; // Placeholder
}


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
      
      // Step 1: Identify Document Type
      toast({ title: "Processing Started", description: "Identifying document type..." });
      const idOutput: IdentifyDocumentTypeOutput = await identifyDocumentTypeFlow({ photoDataUri: imageDataUri });
      setDocumentType(idOutput.documentType);
      toast({ title: "Document Type Identified", description: `Type: ${idOutput.documentType}` });

      // Step 2: Process based on type
      let tempRawText = ""; // To store raw text if not part of main processed data

      switch (idOutput.documentType) {
        case "handwritten_notes":
          toast({ title: "Processing Notes", description: "Summarizing handwritten notes..." });
          const notesOutput: SummarizeNotesOutput = await summarizeNotesFlow({ photoDataUri: imageDataUri });
          setProcessedData(notesOutput);
          // The summarizeNotesFlow ideally should also return raw transcription.
          // For now, we'll use a placeholder or assume summary contains enough.
          // A proper implementation would have a separate flow/step for raw transcription.
          // For demonstration, if summarizeNotesFlow included raw_transcription:
          // setRawText(notesOutput.raw_transcription || notesOutput.summary); 
          // Simulate raw text for now
          const transcriptionForNotes = await extractPrintedTextFlow({ photoDataUri: imageDataUri }); // Re-use for transcription
          setRawText(transcriptionForNotes.text);
          break;
        case "retail_receipt":
          toast({ title: "Processing Receipt", description: "Extracting receipt data..." });
          const receiptOutput: ExtractReceiptDataOutput = await extractReceiptDataFlow({ photoDataUri: imageDataUri });
          setProcessedData(receiptOutput);
          setRawText(JSON.stringify(receiptOutput.receipt, null, 2)); // Raw as JSON for receipts
          break;
        case "invoice":
          toast({ title: "Processing Invoice", description: "Extracting invoice data..." });
          // Placeholder: In a real app, this would use a Genkit flow for invoices.
          // For now, using the service stub.
          const invoiceOutput: Invoice = await extractInvoiceInformation(imageDataUri);
          setProcessedData(invoiceOutput);
          setRawText(JSON.stringify(invoiceOutput, null, 2)); // Raw as JSON for invoices
          break;
        case "business_card":
          toast({ title: "Processing Business Card", description: "Generating contact card..." });
          const cardOutput: GenerateContactCardOutput = await generateContactCardFlow({ photoDataUri: imageDataUri });
          setProcessedData(cardOutput);
          setRawText(cardOutput.vCard); // Raw as vCard string
          break;
        case "printed_text":
        default:
          toast({ title: "Processing Text", description: "Extracting printed text..." });
          // Placeholder: Use a generic text extraction flow
          const textOutput = await extractPrintedTextFlow({ photoDataUri: imageDataUri });
          setProcessedData({ text: textOutput.text }); // Store as {text: "..."}
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
      // "Save" logic: current rawText state already holds the edited text
      // You might want to update `processedData` if the raw text affects it
      // For NotesViewer, `processedData` is the summary, `rawText` is transcription.
      // For PrintedTextViewer, `processedData.text` should be updated.
      if (documentType === 'printed_text' && processedData) {
        setProcessedData({ ...processedData, text: rawText });
      }
      toast({ title: "Text Saved", description: "Your changes have been locally saved." });
    }
    setIsEditing(!isEditing);
  };


  return (
    <>
      <Head>
        <title>DocuMind - Intelligent Document Scanner</title>
        <meta name="description" content="Scan, extract text, and process documents intelligently with AI." />
        <link rel="icon" href="/favicon.ico" /> {/* Make sure you have a favicon */}
      </Head>

      <div className="flex flex-col min-h-screen bg-background">
        <DocuMindHeader onSettingsClick={() => setIsSettingsOpen(true)} />
        
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <ImageUploader onImageSelect={handleImageSelect} selectedImagePreview={selectedImagePreview} />
              {selectedImageFile && (
                <Button
                  onClick={handleProcessImage}
                  disabled={isLoading}
                  className="w-full text-lg py-6"
                >
                  {isLoading ? (
                    <LoadingSpinner message="Processing..." />
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

              {!isLoading && (documentType || rawText) && (
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
                    />
                  </CardContent>
                </Card>
              )}
              
              {!isLoading && !error && !documentType && !rawText && selectedImageFile && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl text-foreground">Ready to Process</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Image selected. Click "Process Image" to analyze.</p>
                  </CardContent>
                </Card>
              )}

              {isLoading && <LoadingSpinner message="Analyzing your document, please wait..." />}
            </div>
          </div>
        </main>

        <footer className="py-6 text-center text-sm text-muted-foreground border-t">
          © {new Date().getFullYear()} DocuMind. All rights reserved.
        </footer>
      </div>

      <SettingsDialog isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  );
};

export default Home;
