
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TranslationResult } from "../types";

const SYSTEM_INSTRUCTION = `
You are a World-Class Expert Gujarati-to-English translator with native-level proficiency in both languages. 
Your goal is to provide perfectly accurate, context-aware, and natural-sounding translations.

CRITICAL GUIDELINES:
- Capture deep linguistic nuances, cultural idioms, and proverbs correctly.
- If the input is in Gujarati script or transliterated (e.g., "Kem cho"), provide the standard English equivalent.
- Maintain the original tone (formal, casual, poetic, or technical).
- Return a strictly valid JSON object.
- Provide a brief 'context' note if the translation involves specific cultural choices or multiple possible meanings.
- Provide 'pronunciation' as a phonetic guide for the Gujarati input.
`;

export async function translateText(text: string): Promise<TranslationResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Carefully analyze and translate this Gujarati text to natural English: "${text}"`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING },
          translated: { type: Type.STRING },
          pronunciation: { type: Type.STRING, description: "Phonetic pronunciation of the original Gujarati" },
          context: { type: Type.STRING, description: "Expert insight into the translation nuances" }
        },
        required: ["original", "translated"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}') as TranslationResult;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return { original: text, translated: "An error occurred during expert analysis." };
  }
}

export async function translateAudio(base64Audio: string, mimeType: string): Promise<TranslationResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: base64Audio, mimeType } },
        { text: "Listen carefully to this Gujarati speech. Provide an exact transcription in Gujarati script and an expert English translation. Analyze the tone and context deeply." }
      ]
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING, description: "Precise transcription of the Gujarati spoken" },
          translated: { type: Type.STRING },
          pronunciation: { type: Type.STRING },
          context: { type: Type.STRING }
        },
        required: ["original", "translated"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}') as TranslationResult;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return { original: "Audio input", translated: "Error in processing audio" };
  }
}

export async function synthesizeSpeech(text: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Speak this English translation clearly and professionally: "${text}"` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' },
        },
      },
    },
  });
  
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
}
