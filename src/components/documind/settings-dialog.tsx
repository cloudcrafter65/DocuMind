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

export function SettingsDialog({ isOpen, onOpenChange }: SettingsDialogProps) {
  const [apiProvider, setApiProvider] = useLocalStorage<AiProvider>("documind_api_provider", "Google AI");
  const [apiKey, setApiKey] = useLocalStorage<string>("documind_api_key", "");

  const handleSave = () => {
    // Values are already saved by useLocalStorage on change
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>AI Settings</DialogTitle>
          <DialogDescription>
            Configure your AI provider and API key. Note: Currently, only Google AI via Genkit is active. Other provider settings are for UI demonstration.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
