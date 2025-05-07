"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Globe, MapPin, Briefcase, User, Building, Copy, Download } from "lucide-react";
import type { GenerateContactCardOutput } from "@/ai/flows/generate-contact-card";
import { downloadFile } from "@/lib/download";
import { useToast } from "@/hooks/use-toast";

interface BusinessCardViewerProps {
  contactData: GenerateContactCardOutput["contactInfo"];
  vCardData: string;
}

export function BusinessCardViewer({ contactData, vCardData }: BusinessCardViewerProps) {
  const {
    fullName,
    jobTitle,
    companyName,
    phoneNumbers,
    emailAddresses,
    website,
    address,
  } = contactData;

  const { toast } = useToast();

  const getInitials = (name: string) => {
    if (!name) return "??";
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  const handleDownloadVCard = () => {
    const filename = `${fullName.replace(/\s+/g, '_') || 'contact'}.vcf`;
    downloadFile(filename, vCardData, "text/vcard");
    toast({ title: "vCard Downloaded", description: `${filename} has been saved.` });
  };

  const handleCopyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied to Clipboard", description: `${fieldName} copied.` });
    }).catch(err => {
      toast({ title: "Copy Failed", description: `Could not copy ${fieldName}.`, variant: "destructive" });
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="items-center text-center">
        <Avatar className="h-24 w-24 mb-3">
          {/* Placeholder for potential future image extraction */}
          <AvatarImage data-ai-hint="person portrait" src={`https://picsum.photos/seed/${fullName}/100/100`} alt={fullName} />
          <AvatarFallback className="text-3xl">{getInitials(fullName)}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-2xl">{fullName}</CardTitle>
        {jobTitle && <CardDescription className="text-primary">{jobTitle}</CardDescription>}
        {companyName && <p className="text-sm text-muted-foreground flex items-center justify-center"><Building className="mr-1 h-4 w-4" />{companyName}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        {emailAddresses?.length > 0 && (
          <div className="flex items-center group">
            <Mail className="mr-3 h-5 w-5 text-primary" />
            <a href={`mailto:${emailAddresses[0]}`} className="text-sm hover:underline flex-grow">{emailAddresses[0]}</a>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleCopyToClipboard(emailAddresses[0], 'Email')}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
        {phoneNumbers?.length > 0 && (
          <div className="flex items-center group">
            <Phone className="mr-3 h-5 w-5 text-primary" />
            <a href={`tel:${phoneNumbers[0]}`} className="text-sm hover:underline flex-grow">{phoneNumbers[0]}</a>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleCopyToClipboard(phoneNumbers[0], 'Phone')}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
        {website && (
          <div className="flex items-center group">
            <Globe className="mr-3 h-5 w-5 text-primary" />
            <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline flex-grow truncate">{website}</a>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleCopyToClipboard(website, 'Website')}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
        {address && (
          <div className="flex items-start group">
            <MapPin className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-sm flex-grow">{address}</span>
             <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleCopyToClipboard(address, 'Address')}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
         <Button onClick={handleDownloadVCard} className="w-full mt-4">
          <Download className="mr-2 h-4 w-4" /> Download vCard (.vcf)
        </Button>
      </CardContent>
    </Card>
  );
}
