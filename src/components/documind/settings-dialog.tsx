
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useLocalStorage from "@/hooks/use-local-storage";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export type AiProvider = "Google AI" | "Together.AI" | "Groq";
export type FontSizeOptionKey = "sm" | "base" | "lg";
export type FontSizeOptionValue = "text-sm" | "text-base" | "text-lg";

export const fontSizeOptions: Record<FontSizeOptionKey, { label: string; value: FontSizeOptionValue }> = {
  sm: { label: "Small", value: "text-sm" },
  base: { label: "Medium", value: "text-base" },
  lg: { label: "Large", value: "text-lg" },
};

export function SettingsDialog({ isOpen, onOpenChange }: SettingsDialogProps) {
  const [apiProvider, setApiProvider] = useLocalStorage<AiProvider>("documind_api_provider", "Google AI");
  const [apiKey, setApiKey] = useLocalStorage<string>("documind_api_key", "");
  const [fontSizeKey, setFontSizeKey] = useLocalStorage<FontSizeOptionKey>("documind_font_size", "base");

  const handleSave = () => {
    // Values are already saved by useLocalStorage on change
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your AI provider, API key, and display preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">AI Configuration</h4>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ai-provider" className="text-right">
                AI Provider
              </Label>
              <Select value={apiProvider} onValueChange={(value) => setApiProvider(value as AiProvider)}>
                <SelectTrigger id="ai-provider" className="col-span-3">
                  <SelectValue placeholder="Select AI Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Google AI">Google AI (Default via Genkit)</SelectItem>
                  <SelectItem value="Together.AI">Together.AI (UI Only)</SelectItem>
                  <SelectItem value="Groq">Groq (UI Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api-key" className="text-right">
                API Key
              </Label>
              <Input
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="col-span-3"
                type="password"
                placeholder="Enter your API key"
              />
            </div>
             <p className="text-xs text-muted-foreground col-span-4 pl-[calc(25%+0.5rem)]">
              Note: Currently, only Google AI via Genkit is active. Other provider settings are for UI demonstration.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Display Preferences</h4>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="font-size" className="text-right">
                Font Size
              </Label>
              <Select value={fontSizeKey} onValueChange={(value) => setFontSizeKey(value as FontSizeOptionKey)}>
                <SelectTrigger id="font-size" className="col-span-3">
                  <SelectValue placeholder="Select Font Size" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(fontSizeOptions) as FontSizeOptionKey[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {fontSizeOptions[key].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
