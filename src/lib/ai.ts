import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "./prisma";

export async function draftEmailWithAI(prompt: string, tone: string = "professional") {
  const settings = await prisma.systemSettings.findFirst();
  if (!settings?.geminiApiKey) {
    throw new Error("Gemini API Key is missing. Please add it in Settings.");
  }

  const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const fullPrompt = `Write an email or message body based on the following instruction.
  Tone: ${tone}
  Instruction: ${prompt}
  Do not include the subject line or placeholders like [Your Name]. Just write the body text. If it looks like an email, format with simple HTML like <p> and <br> tags.`;

  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}
