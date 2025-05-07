
"use client";

import React, { useState, useEffect } from "react";
import useLocalStorage from "@/hooks/use-local-storage";
import type { AiProvider } from "@/components/documind/settings-dialog";

export function DocuMindFooter() {
  const [currentYear, setCurrentYear] = useState<string>("");
  const [apiProvider] = useLocalStorage<AiProvider>("documind_api_provider", "Google AI");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  return (
    <footer className="py-4 text-center text-xs text-muted-foreground border-t">
      <p>
        © {mounted ? currentYear : new Date().getFullYear().toString()} DocuMind. All rights reserved.
      </p>
      {mounted && apiProvider && (
        <p className="mt-1">AI processing powered by: {apiProvider}</p>
      )}
      {!mounted && ( // Fallback for SSR to match initial render before hydration completes
         <p className="mt-1">AI processing powered by: Google AI</p>
      )}
    </footer>
  );
}
