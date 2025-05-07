"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea"; // For editable raw text
import type { SummarizeNotesOutput } from "@/ai/flows/summarize-notes"; // Assuming raw transcription is also part of this or handled separately

interface NotesViewerProps {
  summaryData: SummarizeNotesOutput;
  rawTranscription: string;
  onRawTextChange?: (newText: string) => void;
  isEditing?: boolean;
}

export function NotesViewer({ summaryData, rawTranscription, onRawTextChange, isEditing }: NotesViewerProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Key topics identified from your notes.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-40 rounded-md border p-3 bg-muted/30">
            <p className="text-sm whitespace-pre-wrap">{summaryData.summary}</p>
          </ScrollArea>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Full Transcription</CardTitle>
          <CardDescription>The complete text extracted from your notes.</CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing && onRawTextChange ? (
             <Textarea
                value={rawTranscription}
                onChange={(e) => onRawTextChange(e.target.value)}
                className="min-h-[200px] text-sm"
                aria-label="Editable raw transcription"
              />
          ) : (
            <ScrollArea className="h-60 rounded-md border p-3 bg-muted/30">
                <p className="text-sm whitespace-pre-wrap">{rawTranscription}</p>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
