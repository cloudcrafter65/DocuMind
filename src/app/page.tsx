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
    // Keep existing data until new data is ready to avoid UI flicker
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
         setRawText(extractedTextForProcessing); // Set state for display, but use direct variable for immediate logic
      }


      switch (idOutput.documentType) {
        case "handwritten_notes":
          toast({ title: "Processing Notes", description: "Transcribing and summarizing handwritten notes..." });
          // Use the locally available 'extractedTextForProcessing' for the check and the flow call,
          // as the 'rawText' state might not be updated yet due to the asynchronous nature of setState.
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
          // rawText (from extractedTextForProcessing) is already set if applicable
          break;
        case "invoice":
          toast({ title: "Processing Invoice", description: "Extracting invoice data..." });
          const invoiceOutput: Invoice = await extractInvoiceInformation(imageDataUri); 
          setProcessedData(invoiceOutput);
          // rawText (from extractedTextForProcessing) is already set if applicable
          break;
        case "business_card":
          toast({ title: "Processing Business Card", description: "Generating contact card..." });
          // Business cards might not always have a useful "raw text" for separate display.
          // If raw text is desired for business cards, it needs to be extracted explicitly:
          // const businessCardText: ExtractPrintedTextOutput = await extractPrintedTextFlow({ photoDataUri: imageDataUri });
          // setRawText(businessCardText.text); // And potentially extractedTextForProcessing = businessCardText.text earlier
          const cardOutput: GenerateContactCardOutput = await generateContactCardFlow({ photoDataUri: imageDataUri });
          setProcessedData(cardOutput);
          break;
        case "printed_text":
        default:
          toast({ title: "Processing Text", description: "Extracting printed text..." });
          // Use extractedTextForProcessing directly for consistency, though rawText state will eventually update UI
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
    if (isEditing) { // When saving
      if (documentType === 'printed_text' && processedData) {
        setProcessedData({ ...processedData, text: rawText });
      } else if (documentType === 'handwritten_notes') {
         toast({ title: "Text Saved", description: "Raw transcription updated. Re-process image to update summary if needed." });
      } else if (documentType === 'retail_receipt' || documentType === 'invoice' || documentType === 'business_card') {
         // For these types, editing raw text might not directly impact the structured processedData.
         // We'll save the rawText. If re-processing is desired for structured data based on edited raw text,
         // that would be a more complex feature (e.g., re-running a specific part of the AI flow).
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
        
        <main className="flex-grow container mx-auto px-2 sm:px-4 py-6"> {/* Reduced py-8 to py-6 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start"> {/* Reduced gap-8 to gap-6 */}
            <div className="space-y-4"> {/* Reduced space-y-6 to space-y-4 */}
              <ImageUploader onImageSelect={handleImageSelect} selectedImagePreview={selectedImagePreview} />
              {selectedImageFile && !isLoading && !processedData && ( // Only show if not loading AND no processed data yet for this image
                <Button
                  onClick={handleProcessImage}
                  className="w-full text-lg py-4" // Reduced py-6 to py-4
                >
                    Process Image
                </Button>
              )}
              {/* Show loading on the button only when processing THIS specific file and it's the initial processing run */}
              {isLoading && selectedImageFile && !processedData && ( 
                 <Button
                  disabled
                  className="w-full text-lg py-4 flex items-center justify-center" // Reduced py-6, added flex for centering
                >
                  <LoadingSpinner message="Processing Image..." messageClassName="text-lg text-primary-foreground ml-2" />
                </Button>
              )}
            </div>

            <div className="space-y-4"> {/* Reduced space-y-6 to space-y-4 */}
              {error && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!isLoading && (documentType || rawText || processedData) && (
                // Removed Card wrapper for results display to save space
                // <Card className="shadow-lg">
                //   <CardHeader className="px-2 sm:px-4 py-3">
                //     <CardTitle className="text-lg text-foreground">Processed Document</CardTitle>
                //     {documentType && <CardDescription>Type: {documentType.replace(/_/g, ' ')}</CardDescription>}
                //   </CardHeader>
                //   <CardContent className="pt-0 pb-2 px-2 sm:px-4">
                    <ResultsDisplay
                      documentType={documentType}
                      processedData={processedData}
                      rawText={rawText}
                      onEditToggle={handleEditToggle}
                      isEditing={isEditing}
                      onRawTextChange={setRawText} 
                      fontSize={currentFontSize}
                    />
                //   </CardContent>
                // </Card>
              )}
              
              {/* Message for when image is selected but not yet processed */}
              {!isLoading && !error && !documentType && !rawText && !processedData && selectedImageFile && (
                <Card className="shadow-lg">
                  <CardHeader className="px-2 sm:px-4 py-3">
                    <CardTitle className="text-lg text-foreground">Ready to Process</CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-4 pb-3">
                    <p className="text-muted-foreground">Image selected. Click "Process Image" to analyze.</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Spinner for initial loading state before any image is selected */}
              {isLoading && !selectedImageFile && (
                 <div className="flex justify-center items-center h-full py-10">
                    <LoadingSpinner message="Waiting for image..." />
                 </div>
              )}
            </div>
          </div>
        </main>

        <footer className="py-4 text-center text-xs text-muted-foreground border-t"> {/* Reduced py-6, text-sm to text-xs */}
          <p>© {new Date().getFullYear()} DocuMind. All rights reserved.</p>
          {apiProvider && <p className="mt-1">AI processing powered by: {apiProvider}</p>}
        </footer>
      </div>

      <SettingsDialog isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  );
};

export default Home;

    