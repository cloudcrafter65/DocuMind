"use client";

import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import React, { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, Camera } from "lucide-react";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  selectedImagePreview: string | null;
}

export function ImageUploader({ onImageSelect, selectedImagePreview }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-foreground">Upload Document Image</CardTitle>
        <CardDescription>Capture an image using your camera or upload one from your device.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
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
          
          <Input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            onChange={handleFileChange}
            className="hidden"
            id="camera-capture"
          />
          <Button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full"
            variant="outline"
          >
            <Camera className="mr-2 h-5 w-5" /> Capture with Camera
          </Button>
        </div>

        {selectedImagePreview && (
          <div className="mt-6 border rounded-md p-2 bg-muted/50 flex justify-center items-center max-h-[400px] overflow-hidden">
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
      </CardContent>
    </Card>
  );
}
