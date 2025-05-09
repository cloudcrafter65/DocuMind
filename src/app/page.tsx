"use client";

import type { NextPage } from "next";
import Head from "next/head";
import React, { useState, useEffect, useCallback } from "react";
import { DocuMindHeader } from "@/components/documind/header";
import { SettingsDialog, type AiProvider, type FontSizeOptionKey, fontSizeOptions } from "@/components/documind/settings-dialog";
import { ImageUploader } from "@/components/documind/image-uploader";
import { ResultsDisplay } from "@/components/documind/results-display";
import { LoadingSpinner } from "@/components/documind/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { imageFileToBase64 } from "@/lib/image-utils";
import useLocalStorage from "@/hooks/use-local-storage";
import { DocuMindFooter } from "@/components/documind/documind-footer";

import { identifyDocumentType as identifyDocumentTypeFlow, type IdentifyDocumentTypeOutput } from "@/ai/flows/identify-document-type";
import { summarizeNotes as summarizeNotesFlow, type SummarizeNotesOutput } from "@/ai/flows/summarize-notes";
import { extractReceiptData as extractReceiptDataFlow, type ExtractReceiptDataOutput } from "@/ai/flows/extract-receipt-data";
import { generateContactCard as generateContactCardFlow, type GenerateContactCardOutput } from "@/ai/flows/generate-contact-card";
import { extractPrintedText as extractPrintedTextFlow, type ExtractPrintedTextOutput } from "@/ai/flows/extract-printed-text-flow";
import { extractInvoiceData as extractInvoiceDataFlow, type ExtractInvoiceDataOutput } from "@/ai/flows/extract-invoice-data-flow"; // New import

import type { DocumentType } from "@/services/document-analysis";


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
  
  const [apiProvider, setApiProvider] = useLocalStorage<AiProvider>("documind_api_provider", "Google AI");
  const [fontSizeKey, setFontSizeKey] = useLocalStorage<FontSizeOptionKey>("documind_font_size", "base");
  const [currentFontSize, setCurrentFontSize] = useState<string>(fontSizeOptions.base.value);

  useEffect(() => {
    setCurrentFontSize(fontSizeOptions[fontSizeKey]?.value || fontSizeOptions.base.value);
  }, [fontSizeKey]);

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
      const idOutput: IdentifyDocumentTypeOutput = await identifyDocumentTypeFlow({ photoDataUri: imageDataUri });
      setDocumentType(idOutput.documentType);
      toast({ title: "Document Type Identified", description: `Type: ${idOutput.documentType.replace(/_/g, ' ')}` });

      let extractedTextForProcessing = "";
      // For all document types except business cards (which have their own direct extraction), first get raw text.
      // This raw text can be displayed alongside structured data for types like receipts/invoices.
      if (idOutput.documentType !== 'business_card') { 
         const textExtractionResult: ExtractPrintedTextOutput = await extractPrintedTextFlow({ photoDataUri: imageDataUri });
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
            const notesOutput: SummarizeNotesOutput = await summarizeNotesFlow({ photoDataUri: imageDataUri, existingTranscription: extractedTextForProcessing });
            setProcessedData(notesOutput);
          }
          break;
        case "retail_receipt":
          toast({ title: "Processing Receipt", description: "Extracting receipt data..." });
          const receiptOutput: ExtractReceiptDataOutput = await extractReceiptDataFlow({ photoDataUri: imageDataUri });
          setProcessedData(receiptOutput);
          break;
        case "invoice":
          toast({ title: "Processing Invoice", description: "Extracting invoice data..." });
          const invoiceOutput: ExtractInvoiceDataOutput = await extractInvoiceDataFlow({ photoDataUri: imageDataUri }); 
          setProcessedData(invoiceOutput); // Store the whole output object
          break;
        case "business_card":
          toast({ title: "Processing Business Card", description: "Generating contact card..." });
          const cardOutput: GenerateContactCardOutput = await generateContactCardFlow({ photoDataUri: imageDataUri });
          // Business cards might not have 'rawText' in the same way, their info is structured.
          // If a raw text view is desired for business cards, the flow would need to provide it, 
          // or a separate text extraction call would be needed here.
          // For now, assuming rawText for business cards might be empty or populated by its specific flow.
          const bizCardRawTextAttempt = await extractPrintedTextFlow({ photoDataUri: imageDataUri });
          setRawText(bizCardRawTextAttempt.text);
          setProcessedData(cardOutput);
          break;
        case "printed_text":
        default:
          toast({ title: "Processing Text", description: "Extracting printed text..." });
          // Use the already set rawText for printed_text type, as it is the primary content.
          setProcessedData({ text: extractedTextForProcessing }); 
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
      } else if (documentType === 'handwritten_notes') {
         toast({ title: "Text Saved", description: "Raw transcription updated. Re-process image to update summary if needed." });
      } else if (documentType === 'retail_receipt' || documentType === 'invoice' || documentType === 'business_card') {
         toast({ title: "Raw Text Saved", description: "Changes to the raw text have been saved locally." });
      } else {
        toast({ title: "Text Saved", description: "Your changes to the raw text have been saved locally." });
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
        
        <main className="flex-grow container mx-auto px-2 sm:px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
            <div className="space-y-4">
              <ImageUploader onImageSelect={handleImageSelect} selectedImagePreview={selectedImagePreview} />
              {selectedImageFile && !isLoading && !processedData && (
                <Button
                  onClick={handleProcessImage}
                  className="w-full text-lg py-4"
                >
                    Process Image
                </Button>
              )}
              {isLoading && selectedImageFile && ( 
                 <Button
                  disabled
                  className="w-full text-lg py-4 flex items-center justify-center"
                >
                  <LoadingSpinner message="Processing Image..." messageClassName="text-lg text-primary-foreground ml-2" />
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {(!isLoading || processedData) && (documentType || rawText || processedData) && (
                    <ResultsDisplay
                      documentType={documentType}
                      processedData={processedData}
                      rawText={rawText}
                      onEditToggle={handleEditToggle}
                      isEditing={isEditing}
                      onRawTextChange={setRawText} 
                      fontSize={currentFontSize}
                    />
              )}
              
              {!isLoading && !error && !documentType && !rawText && !processedData && selectedImageFile && !processedData && (
                <Card className="shadow-lg">
                  <CardHeader className="px-2 sm:px-4 py-3">
                    <CardTitle className="text-lg text-foreground">Ready to Process</CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-4 pb-3">
                    <p className="text-muted-foreground">Image selected. Click "Process Image" to analyze.</p>
                  </CardContent>
                </Card>
              )}
              
              {isLoading && !selectedImageFile && (
                 <div className="flex justify-center items-center h-full py-10">
                    <LoadingSpinner message="Waiting for image..." />
                 </div>
              )}
            </div>
          </div>
        </main>

        <DocuMindFooter apiProvider={apiProvider} />
      </div>

      <SettingsDialog 
        isOpen={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen}
        currentApiProvider={apiProvider}
        onApiProviderChange={setApiProvider}
        currentFontSizeKey={fontSizeKey}
        onFontSizeKeyChange={setFontSizeKey}
      />
    </>
  );
};

export default Home;
