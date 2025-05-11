"use client";

import { useState, useRef } from "react";
import { HeroSection } from "@/components/intro/hero-section";
import { DocumentProcessor } from "@/components/documind/document-processor";
import { DocuMindHeader } from "@/components/documind/header";
import { DocuMindFooter } from "@/components/documind/documind-footer";
import { ImageUploader } from "@/components/documind/image-uploader";
import { SettingsDialog, type AiProvider, type FontSizeOptionKey } from "@/components/documind/settings-dialog";
import { cn } from "@/lib/utils";
import { fontSizeOptions } from "@/components/documind/settings-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  const [showDemo, setShowDemo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiProvider, setApiProvider] = useState<AiProvider>("Google AI");
  const [fontSizeKey, setFontSizeKey] = useState<FontSizeOptionKey>("base");
  const demoRef = useRef<HTMLDivElement>(null);

  const scrollToDemo = () => {
    setShowDemo(true);
    setTimeout(() => {
      demoRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Get the current font size class from the fontSizeOptions
  const fontSizeClass = fontSizeOptions[fontSizeKey].value;

  return (
    <main className={cn("relative min-h-screen flex flex-col", fontSizeClass)}>
      <DocuMindHeader onSettingsClick={() => setShowSettings(true)} />
      <SettingsDialog
        isOpen={showSettings}
        onOpenChange={setShowSettings}
        currentApiProvider={apiProvider}
        onApiProviderChange={setApiProvider}
        currentFontSizeKey={fontSizeKey}
        onFontSizeKeyChange={setFontSizeKey}
      />
      <HeroSection onGetStarted={scrollToDemo} />

      <section 
        ref={demoRef}
        className={cn(
          "min-h-screen py-8 bg-muted/30 transition-opacity duration-500",
          showDemo ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {showDemo && <DocumentProcessor className={fontSizeClass} />}
          </div>
        </div>
      </section>
      <DocuMindFooter apiProvider={apiProvider} />
    </main>
  );
}
