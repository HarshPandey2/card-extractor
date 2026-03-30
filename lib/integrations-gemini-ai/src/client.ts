import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey, getGeminiBaseUrl } from "./gemini-config";

export class GeminiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiConfigError";
  }
}

let aiInstance: GoogleGenAI | null = null;

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export function getAi(): GoogleGenAI {
  if (aiInstance) {
    return aiInstance;
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new GeminiConfigError(
      "GEMINI_API_KEY must be set (or legacy AI_INTEGRATIONS_GEMINI_API_KEY).",
    );
  }

  const baseUrl = getGeminiBaseUrl();
  aiInstance = new GoogleGenAI(
    baseUrl
      ? {
          apiKey,
          httpOptions: {
            apiVersion: "",
            baseUrl,
          },
        }
      : { apiKey },
  );

  return aiInstance;
}
