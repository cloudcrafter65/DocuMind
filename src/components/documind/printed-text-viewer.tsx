"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrintedTextViewerProps {
  text: string;
  onTextChange?: (newText: string) => void;
  isEditing?: boolean;
}

export function PrintedTextViewer({ text, onTextChange, isEditing }: PrintedTextViewerProps) {
  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Extracted Printed Text</CardTitle>
        <CardDescription>
          {isEditing ? "Edit the transcribed text below." : "Review the transcribed text."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing && onTextChange ? (
          <Textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            className="min-h-[300px] text-sm"
            aria-label="Editable printed text"
          />
        ) : (
          <ScrollArea className="h-80 rounded-md border p-3 bg-muted/30">
            <p className="text-sm whitespace-pre-wrap">{text}</p>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
