"use client";

import { FileText, FileSearch, Zap, PenTool, ContactRound } from "lucide-react";
import { FeatureCard } from "./feature-card";

export function FeaturesSection() {
  const features = [
    {
      title: "Document Recognition",
      description:
        "Automatically identify document types and extract relevant information.",
      icon: FileSearch,
    },
    {
      title: "Handwriting Recognition",
      description:
        "Convert handwritten notes and documents into digital text with high accuracy.",
      icon: PenTool,
    },
    {
      title: "Business Card Digitization",
      description:
        "Transform business cards into digital contacts instantly, syncing with your address book.",
      icon: ContactRound,
    },
    {
      title: "Data Extraction",
      description:
        "Extract structured data from invoices, receipts, and forms with precision.",
      icon: FileText,
    },
    {
      title: "Instant Analysis",
      description:
        "Get immediate insights and summaries from your documents in seconds.",
      icon: Zap,
    },
  ];

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Powerful Features for Modern Document Processing
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
