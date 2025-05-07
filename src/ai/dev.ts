import { config } from 'dotenv';
config();

import '@/ai/flows/extract-receipt-data.ts';
import '@/ai/flows/generate-contact-card.ts';
import '@/ai/flows/identify-document-type.ts';
import '@/ai/flows/summarize-notes.ts';