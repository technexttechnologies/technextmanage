import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "./prisma";

export interface ParsedQuotation {
  companyName?: string;
  companyAddress?: string;
  companyGst?: string;
  expiryDate?: string;
  subtotal: number;
  gstPercentage: number;
  totalAmount: number;
  items: Array<{
    name: string;
    description: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  terms: Array<{
    content: string;
    order: number;
  }>;
  milestones: Array<{
    name: string;
    duration: string;
    order: number;
  }>;
  meta: {
    packageType?: string; // Website, SEO, Software, etc
    detectedServices?: string[];
  };
}

export async function parseQuotationPdf(base64Data: string, mimeType: string = "application/pdf"): Promise<ParsedQuotation> {
  const settings = await prisma.systemSettings.findFirst();
  if (!settings?.geminiApiKey) {
    throw new Error("Gemini API Key is missing. Please add it in Settings.");
  }

  const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
  
  // We use gemini-2.5-flash as it is extremely fast and native with document parsing
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are an expert data extraction AI. Extract the details from the provided quotation document and return them EXACTLY in this JSON format.
    Do not include any markdown blocks (like \`\`\`json) or extra text. Output ONLY raw JSON.

    {
      "companyName": "extracted company name or null",
      "companyAddress": "extracted company address or null",
      "companyGst": "extracted GST number or null",
      "expiryDate": "ISO date string or null (YYYY-MM-DD)",
      "subtotal": 1000.00,
      "gstPercentage": 18.0,
      "totalAmount": 1180.00,
      "items": [
        {
          "name": "Service name",
          "description": "Service description or null",
          "quantity": 1,
          "price": 1000.00,
          "total": 1000.00
        }
      ],
      "terms": [
        {
          "content": "Term text",
          "order": 1
        }
      ],
      "milestones": [
        {
          "name": "Phase 1: Design",
          "duration": "2 weeks",
          "order": 1
        }
      ],
      "meta": {
        "packageType": "Website|SEO|Software|Other",
        "detectedServices": ["Hosting", "Domain"]
      }
    }
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);

    const text = result.response.text();
    // Clean up potential markdown formatting if the model disobeys instructions
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
    
    return JSON.parse(cleanedText) as ParsedQuotation;
  } catch (error: any) {
    console.error("AI Parsing Error:", error);
    throw new Error(`Failed to parse quotation: ${error.message}`);
  }
}
