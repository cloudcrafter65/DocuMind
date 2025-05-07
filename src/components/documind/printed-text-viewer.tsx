
"use client";

import React, { useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface PrintedTextViewerProps {
  text: string;
  onTextChange?: (newText: string) => void;
  isEditing?: boolean;
  fontSize: string; // e.g., 'text-sm', 'text-base', 'text-lg'
}

export function PrintedTextViewer({ text, onTextChange, isEditing, fontSize }: PrintedTextViewerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = 'auto'; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scroll height
    }
  }, [text, isEditing]);

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onTextChange) {
      onTextChange(event.target.value);
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-2 text-foreground">
        {isEditing ? "Edit Extracted Text" : "Extracted Printed Text"}
      </h3>
      {isEditing && onTextChange ? (
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          className={cn(
            "min-h-[100px] w-full resize-none overflow-y-hidden border rounded-md p-2",
            fontSize
          )}
          aria-label="Editable printed text"
          rows={1} // Start with a single row, JS will adjust
        />
      ) : (
        <p className={cn("whitespace-pre-wrap p-2 border rounded-md bg-muted/30", fontSize)}>
          {text || "No text extracted."}
        </p>
      )}
    </div>
  );
}
