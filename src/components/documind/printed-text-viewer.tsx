"use client";

import React, { useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit, Save } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PrintedTextViewerProps {
  text: string;
  onTextChange?: (newText: string) => void;
  isEditing?: boolean;
  fontSize: string; 
  onEditToggle?: () => void;
  header?: string;
}

export function PrintedTextViewer({ text, onTextChange, isEditing, fontSize, onEditToggle, header }: PrintedTextViewerProps) {
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
  }, [text, isEditing, fontSize]);


  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onTextChange) {
      onTextChange(event.target.value);
    }
  };

  const defaultHeader = isEditing ? "Edit Extracted Text" : "Extracted Printed Text";
  const currentHeader = header || defaultHeader;
  const showEditButton = onEditToggle && (text || text === "" || isEditing);

  return (
    <TooltipProvider>
      <div className="w-full">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-lg font-semibold text-foreground">
            {currentHeader}
          </h3>
          {showEditButton && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onEditToggle} aria-label={isEditing ? "Save Text" : "Edit Text"}>
                    {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isEditing ? "Save Text" : "Edit Text"}</p>
                </TooltipContent>
              </Tooltip>
            )}
        </div>
        {isEditing && onTextChange ? (
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            className={cn(
              "min-h-[80px] w-full resize-none overflow-hidden border rounded-md p-2 focus:ring-2 focus:ring-primary",
              fontSize
            )}
            aria-label="Editable printed text"
            rows={1} 
            onFocus={autoResizeTextarea}
          />
        ) : (
          <p className={cn("whitespace-pre-wrap p-2 rounded-md bg-muted/20", fontSize, !text && "text-muted-foreground italic")}>
            {text || (header ? "No raw text extracted for this section." : "No text extracted.")}
          </p>
        )}
      </div>
    </TooltipProvider>
  );
}
