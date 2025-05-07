"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  messageClassName?: string;
}

export function LoadingSpinner({ size = 24, message, messageClassName }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2 p-4">
      <Loader2 className="animate-spin text-primary" style={{ width: size, height: size }} />
      {message && <p className={cn("text-sm text-muted-foreground", messageClassName)}>{message}</p>}
    </div>
  );
}
