
"use client";

import { ScanText } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import type { Dispatch, SetStateAction } from "react";

interface DocuMindHeaderProps {
  onSettingsClick: () => void;
}

export function DocuMindHeader({ onSettingsClick }: DocuMindHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center ml-2"> {/* Added ml-2 here */}
           <ScanText className="h-8 w-8 mr-2 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">DocuMind</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={onSettingsClick} aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

// Re-import Settings icon since it was removed in a previous step due to a thinking error, it's needed by the button.
import { Settings } from "lucide-react";
