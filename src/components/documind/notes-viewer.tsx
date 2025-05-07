"use client";

import React, { useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import type { SummarizeNotesOutput } from "@/ai/flows/summarize-notes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit, Save } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NotesViewerProps {
  summaryData: SummarizeNotesOutput;
  rawTranscription: string;
  onRawTextChange?: (newText: string) => void;
  isEditing?: boolean;
  fontSize: string;
  onEditToggle?: () => void;
}

export function NotesViewer({ summaryData, rawTranscription, onRawTextChange, isEditing, fontSize, onEditToggle }: NotesViewerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; 
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (isEditing) {
      autoResizeTextarea();
    }
  }, [rawTranscription, isEditing, fontSize]);


  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onRawTextChange) {
      onRawTextChange(event.target.value);
    }
    // autoResizeTextarea will be called by useEffect due to rawTranscription change
  };

  const showEditButton = onEditToggle && (rawTranscription || rawTranscription === "" || isEditing);

  return (
    <TooltipProvider>
      <div className="space-y-4"> {/* Reduced space to y-4 from y-6 */}
        <div>
          <h3 className="text-lg font-semibold mb-1 text-foreground">Summary</h3>
          <p className={cn("whitespace-pre-wrap", fontSize, !summaryData.summary && "text-muted-foreground italic")}>
            {summaryData.summary || "No summary available."}
          </p>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-lg font-semibold text-foreground">Full Transcription</h3>
            {showEditButton && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onEditToggle} aria-label={isEditing ? "Save Transcription" : "Edit Transcription"}>
                    {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isEditing ? "Save Transcription" : "Edit Transcription"}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {isEditing && onRawTextChange ? (
            <Textarea
              ref={textareaRef}
              value={rawTranscription}
              onChange={handleTextChange}
              className={cn(
                "min-h-[80px] w-full resize-none overflow-hidden border rounded-md p-2 focus:ring-2 focus:ring-primary", // Ensure focus style
                fontSize
              )}
              aria-label="Editable raw transcription"
              rows={1} 
              onFocus={autoResizeTextarea} // Also resize on focus in case content loaded when not visible
            />
          ) : (
            <p className={cn("whitespace-pre-wrap p-2 rounded-md bg-muted/20", fontSize, !rawTranscription && "text-muted-foreground italic")}>
              {rawTranscription || "No transcription available."}
            </p>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
