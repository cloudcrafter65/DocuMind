# DocuMind

<p align="center">
  <img src="/public/icons/android-chrome-512x512.png" alt="DocuMind Logo" width="120"/>
</p>

DocuMind is an intelligent document analysis platform built with Next.js. It leverages advanced AI capabilities to process and analyze various types of documents, including invoices, receipts, business cards, and general text documents.

## ✨ Features

- **🔍 Smart Document Recognition:** Automatically identifies document types upon upload
- **📄 Data Extraction:** Intelligent extraction of structured data from:
  - Invoices (amounts, dates, vendor details)
  - Receipts (items, prices, totals)
  - Business Cards (contact information)
- **📝 Text Analysis:** Advanced OCR and text processing capabilities
- **📊 Notes Summarization:** AI-powered summarization of text documents
- **👀 Interactive Viewers:** Custom viewers for different document types
- **🎨 Modern UI/UX:** Built with shadcn/ui components
- **📱 Responsive Design:** Works seamlessly across devices
- **🔒 PWA Support:** Install as a Progressive Web App

## 🚀 Technologies

- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **AI Integration:** Google AI Platform
- **State Management:** React Query
- **Authentication:** Firebase Auth
- **Analytics:** Vercel Analytics

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/DocuMind.git
   cd DocuMind
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the required environment variables in `.env.local`

4. Start the development server:
   ```bash
   npm run dev
   ```

## 💻 Development

- **Development Mode:**
  ```bash
  npm run dev
  ```
  Access the app at http://localhost:9002

- **Build for Production:**
  ```bash
  npm run build
  npm run start
  ```

- **Type Checking:**
  ```bash
  npm run typecheck
  ```

## 📁 Project Structure

```
DocuMind/
├── src/
│   ├── ai/          # AI flows and integrations
│   ├── app/         # Next.js app router pages
│   ├── components/  # React components
│   │   ├── documind/  # App-specific components
│   │   └── ui/        # shadcn/ui components
│   ├── hooks/       # Custom React hooks
│   ├── lib/         # Utility functions
│   └── services/    # External service integrations
├── public/         # Static assets
└── ...            # Config files
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Live Demo](https://documind.maya.im)
- [Documentation](https://documind.maya.im/docs)
- [Report Bug](https://github.com/your-username/DocuMind/issues)
- [Request Feature](https://github.com/your-username/DocuMind/issues)

- `src/app/page.tsx`: The main application page where document uploads and results are handled.
- `src/ai/flows`: Contains the definitions for the different AI analysis flows.
- `src/components`: Houses the UI components, including the document viewers and uploaders.

## Installation and Running Locally

1. Clone the repository:



1. Clone the repository:


