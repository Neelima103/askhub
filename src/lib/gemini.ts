import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
}

const ai = new GoogleGenAI({ apiKey });

export async function askAI(question: string, context: string) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are AskHub AI, an educational assistant. 
    Your goal is to answer student questions based EXCLUSIVELY on the provided educational material context.
    If the answer is not in the context, politely inform the student that the information isn't available in the uploaded materials.
    Always cite the material if possible.
    Maintain a helpful, academic, and encouraging tone.
  `;

  const prompt = `
    Context Material:
    ---
    ${context}
    ---
    
    Student Question: ${question}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
}

export async function summarizeMaterial(content: string) {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Summarize the following educational material content into a concise 2-3 sentence overview for students.
    
    Content:
    ${content}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Summarization Error:", error);
    return "Summary unavailable.";
  }
}
