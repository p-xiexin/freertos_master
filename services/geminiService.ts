import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const askGemini = async (question: string, context: string): Promise<string> => {
  if (!apiKey) {
    return "API Key is missing. Please configure the environment variable.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert Embedded Systems Engineer and FreeRTOS instructor. 
      The user is currently learning about: "${context}".
      
      Answer the following question briefly and technically, focusing on FreeRTOS implementation details.
      
      Question: ${question}`,
    });

    return response.text || "No response generated.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `Error: ${error.message || "Failed to fetch response."}`;
  }
};