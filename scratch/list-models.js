const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listModels() {
  const settings = await prisma.systemSettings.findFirst();
  if (!settings || !settings.geminiApiKey) {
    console.log("No API Key found in settings");
    process.exit(1);
  }

  const apiKey = settings.geminiApiKey;
  console.log("Fetching models...");
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.error) {
      console.error("API Error:", data.error);
    } else {
      console.log("Available models:");
      data.models.forEach(m => {
        if (m.name.includes('gemini') && m.supportedGenerationMethods.includes('generateContent')) {
          console.log(`- ${m.name}`);
        }
      });
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

listModels();
