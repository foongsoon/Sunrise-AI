import { GoogleGenAI } from "@google/genai";

export interface Message {
  role: "user" | "model";
  text: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function* sendMessageStream(history: Message[], userInput: string) {
  const contents = [...history.map(m => ({ role: m.role, parts: [{ text: m.text }] })), { role: "user", parts: [{ text: userInput }] }];

  const response = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction: `You are a helpful assistant for Sunrise Education. 
      Your goal is to answer questions about the education center, its courses, services, and other relevant information.
      You have access to Google Search. Always use it to find the most up-to-date information about Sunrise Education and related topics.
      Be professional, informative, and friendly.`,
      tools: [{ googleSearch: {} }],
    },
  });

  for await (const chunk of response) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}
