"use client";

import React, { useState, useEffect } from "react";
import type { AiProvider } from "@/components/documind/settings-dialog";

interface DocuMindFooterProps {
  apiProvider: AiProvider;
}

export function DocuMindFooter({ apiProvider }: DocuMindFooterProps) {
  const [currentYear, setCurrentYear] = useState<string>("");
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
      {/* apiProvider prop is hydration-safe from useLocalStorage in parent */}
      {apiProvider && (
        <p className="mt-1">AI processing powered by: {apiProvider}</p>
      )}
    </footer>
  );
}