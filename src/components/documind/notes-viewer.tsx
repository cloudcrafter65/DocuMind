
"use client";

import React, { useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import type { SummarizeNotesOutput } from "@/ai/flows/summarize-notes";
import { cn } from "@/lib/utils";

interface NotesViewerProps {
  summaryData: SummarizeNotesOutput;
  rawTranscription: string;
  onRawTextChange?: (newText: string) => void;
  isEditing?: boolean;
  fontSize: string; // e.g., 'text-sm', 'text-base', 'text-lg'
}

export function NotesViewer({ summaryData, rawTranscription, onRawTextChange, isEditing, fontSize }: NotesViewerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = 'auto'; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scroll height
    }
  }, [rawTranscription, isEditing]);

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onRawTextChange) {
      onRawTextChange(event.target.value);
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-foreground">Summary</h3>
        <p className={cn("whitespace-pre-wrap", fontSize)}>
          {summaryData.summary || "No summary available."}
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2 text-foreground">Full Transcription</h3>
        {isEditing && onRawTextChange ? (
          <Textarea
            ref={textareaRef}
            value={rawTranscription}
            onChange={handleTextChange}
            className={cn(
              "min-h-[100px] w-full resize-none overflow-y-hidden border rounded-md p-2",
              fontSize
            )}
            aria-label="Editable raw transcription"
            rows={1} // Start with a single row, JS will adjust
          />
        ) : (
          <p className={cn("whitespace-pre-wrap p-2 border rounded-md bg-muted/30", fontSize)}>
            {rawTranscription || "No transcription available."}
          </p>
        )}
      </div>
    </div>
  );
}
