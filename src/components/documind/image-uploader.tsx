"use client";

import type { ChangeEvent } from "react";
import React, { useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, ClipboardPaste } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  selectedImagePreview: string | null;
}

export function ImageUploader({ onImageSelect, selectedImagePreview }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  const handlePasteImage = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        toast({
          title: "Paste Not Supported",
          description: "Your browser may not support pasting images directly. Try uploading.",
          variant: "destructive",
        });
        return;
      }

      const clipboardItems = await navigator.clipboard.read();
      let imageFile: File | null = null;

      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            const extension = type.split('/')[1] || 'png';
            const fileName = `pasted_image_${Date.now()}.${extension}`;
            imageFile = new File([blob], fileName, { type });
            break;
          }
        }
        if (imageFile) break;
      }

      if (imageFile) {
        onImageSelect(imageFile);
        toast({
          title: "Image Pasted",
          description: "Image from clipboard has been loaded.",
        });
      } else {
        toast({
          title: "No Image Found",
          description: "No image was found on the clipboard, or it's not a supported image type.",
          variant: "default",
        });
      }
    } catch (err: any) {
      console.error("Error pasting image:", err);
      let description = "Could not paste image from clipboard.";
      if (err.name === 'NotAllowedError') {
        description = "Clipboard permission denied. Please allow clipboard access in your browser settings or use the upload button.";
      } else if (err.name === 'NotFoundError' || err.message?.includes('No valid image data found')) {
         description = "No image content found on the clipboard or clipboard access is restricted.";
      }
      toast({
        title: "Paste Failed",
        description,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-foreground">Upload or Paste Document</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedImagePreview && (
          <div className="mb-6 border rounded-md p-2 bg-muted/50 flex justify-center items-center max-h-[400px] overflow-hidden">
            <Image
              src={selectedImagePreview}
              alt="Selected document preview"
              width={500}
              height={300}
              className="rounded-md object-contain max-h-[380px] w-auto"
              data-ai-hint="document scan"
            />
          </div>
        )}
        <div className="space-y-2">
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/gif"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
            variant="outline"
          >
            <UploadCloud className="mr-2 h-5 w-5" /> Upload from Device
          </Button>
          <Button
            onClick={handlePasteImage}
            className="w-full"
            variant="outline"
          >
            <ClipboardPaste className="mr-2 h-5 w-5" /> Paste from Clipboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
