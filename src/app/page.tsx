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

import { identifyDocumentType as identifyDocumentTypeFlow, type IdentifyDocumentTypeOutput } from "@/ai/flows/identify-document-type";
import { summarizeNotes as summarizeNotesFlow, type SummarizeNotesOutput } from "@/ai/flows/summarize-notes";
import { extractReceiptData as extractReceiptDataFlow, type ExtractReceiptDataOutput } from "@/ai/flows/extract-receipt-data";
import { generateContactCard as generateContactCardFlow, type GenerateContactCardOutput } from "@/ai/flows/generate-contact-card";
import { extractPrintedText as extractPrintedTextFlow, type ExtractPrintedTextOutput } from "@/ai/flows/extract-printed-text-flow";

import { extractInvoiceInformation } from "@/services/invoice";
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
  const [fontSizeKey] = useLocalStorage<FontSizeOptionKey>("documind_font_size", "base");
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
    // Keep existing documentType, processedData, rawText until new data is ready
    // setDocumentType(null); 
    // setProcessedData(null);
    // setRawText("");
    setIsEditing(false);

    try {
      const imageDataUri = await imageFileToBase64(selectedImageFile);
      
      toast({ title: "Processing Started", description: "Identifying document type..." });
      const idOutput: IdentifyDocumentTypeOutput = await identifyDocumentTypeFlow({ photoDataUri: imageDataUri });
      setDocumentType(idOutput.documentType);
      toast({ title: "Document Type Identified", description: `Type: ${idOutput.documentType.replace(/_/g, ' ')}` });

      let extractedTextForProcessing = "";
      // Always extract text first, unless it's a type that doesn't need pre-extraction for its primary flow (like business cards)
      // For notes, we still extract, then pass it to summarization.
      if (idOutput.documentType !== 'business_card') { 
         const textExtractionResult: ExtractPrintedTextOutput = await extractPrintedTextFlow({ photoDataUri: imageDataUri });
         extractedTextForProcessing = textExtractionResult.text;
         setRawText(extractedTextForProcessing);
      }


      switch (idOutput.documentType) {
        case "handwritten_notes":
          toast({ title: "Processing Notes", description: "Transcribing and summarizing handwritten notes..." });
          // Raw text is already set from the general extraction step if it was run
          // If it wasn't (e.g. if we changed logic above), we'd need to extract it here.
          // For now, we assume rawText contains the transcription.
          
          if (!rawText || rawText.trim() === "") { // Use the state `rawText`
             toast({ title: "Transcription Empty", description: "Could not transcribe text from notes. Summary cannot be generated.", variant: "default" });
             setProcessedData({ summary: "No text transcribed to summarize." });
          } else {
            const notesOutput: SummarizeNotesOutput = await summarizeNotesFlow({ photoDataUri: imageDataUri, existingTranscription: rawText });
            setProcessedData(notesOutput);
          }
          break;
        case "retail_receipt":
          toast({ title: "Processing Receipt", description: "Extracting receipt data..." });
          const receiptOutput: ExtractReceiptDataOutput = await extractReceiptDataFlow({ photoDataUri: imageDataUri });
          setProcessedData(receiptOutput);
          // Raw text already set if applicable
          break;
        case "invoice":
          toast({ title: "Processing Invoice", description: "Extracting invoice data..." });
          const invoiceOutput: Invoice = await extractInvoiceInformation(imageDataUri); 
          setProcessedData(invoiceOutput);
          // Raw text already set if applicable
          break;
        case "business_card":
          toast({ title: "Processing Business Card", description: "Generating contact card..." });
          // Business cards might not always have a useful "raw text" for separate display,
          // the structured data is key. If text extraction is needed, it should be done explicitly.
          // For now, we extract primary business card info and vCard.
          // If raw text is desired, extract it here:
          // const businessCardText: ExtractPrintedTextOutput = await extractPrintedTextFlow({ photoDataUri: imageDataUri });
          // setRawText(businessCardText.text);
          const cardOutput: GenerateContactCardOutput = await generateContactCardFlow({ photoDataUri: imageDataUri });
          setProcessedData(cardOutput);
          break;
        case "printed_text":
        default:
          toast({ title: "Processing Text", description: "Extracting printed text..." });
          // Raw text is already set by the initial extraction
          setProcessedData({ text: rawText }); // use state `rawText`
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
      if (documentType === 'handwritten_notes') {
         toast({ title: "Text Saved", description: "Raw transcription updated. Re-process to update summary if needed." });
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
        
        <main className="flex-grow container mx-auto px-2 sm:px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-start">
            <div className="space-y-6">
              <ImageUploader onImageSelect={handleImageSelect} selectedImagePreview={selectedImagePreview} />
              {selectedImageFile && !isLoading && !processedData && (
                <Button
                  onClick={handleProcessImage}
                  className="w-full text-lg py-6"
                >
                    Process Image
                </Button>
              )}
              {isLoading && selectedImageFile && ( // Show loading on the button only when processing this specific file
                 <Button
                  disabled
                  className="w-full text-lg py-6"
                >
                  <LoadingSpinner message="Processing Image..." messageClassName="text-lg text-primary-foreground" />
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
                  <CardContent className="pt-0 pb-2 px-2 sm:px-4">
                    <ResultsDisplay
                      documentType={documentType}
                      processedData={processedData}
                      rawText={rawText}
                      onEditToggle={handleEditToggle}
                      isEditing={isEditing}
                      onRawTextChange={setRawText} 
                      fontSize={currentFontSize}
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

              {isLoading && !selectedImageFile && <div className="flex justify-center items-center h-full"><LoadingSpinner message="Waiting for image..." /></div>}
              {/* The specific loading spinner for when processing is active is now part of the button */}
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
