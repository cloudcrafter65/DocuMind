"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FileText, FileSearch, Zap, PenTool, ContactRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <div className="relative py-12 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Transform Your{" "}
              <span className="text-primary">Documents</span>{" "}
              with AI Intelligence
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              Extract, analyze, and understand your documents instantly. From invoices
              to business cards, DocuMind makes document processing effortless.
            </p>
            <Button 
              size="lg" 
              className="gap-2"
              onClick={onGetStarted}
            >
              Try it Now
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                →
              </motion.span>
            </Button>
          </motion.div>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    title: "Document Recognition",
                    description: "Automatically identify document types and extract relevant information.",
                    icon: FileSearch,
                  },
                  {
                    title: "Handwriting Recognition",
                    description: "Convert handwritten notes and documents into digital text with high accuracy.",
                    icon: PenTool,
                  },
                  {
                    title: "Business Card Digitization",
                    description: "Transform business cards into digital contacts instantly.",
                    icon: ContactRound,
                  },
                  {
                    title: "Data Extraction",
                    description: "Extract structured data from invoices, receipts, and forms with precision.",
                    icon: FileText,
                  },
                  {
                    title: "Instant Analysis",
                    description: "Get immediate insights and summaries from your documents in seconds.",
                    icon: Zap,
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
                      <feature.icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-sm">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
