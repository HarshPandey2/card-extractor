import { type Response } from "express";
import { createCard, type ExtractedCardData } from "@workspace/db";
import { ExtractCardBody } from "@workspace/api-zod";
import { GeminiConfigError, getAi } from "@workspace/integrations-gemini-ai";
import { type AuthRequest } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";

class GeminiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiResponseError";
  }
}

async function extractWithGemini(frontImageBase64: string, backImageBase64?: string): Promise<ExtractedCardData> {
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  parts.push({
    text: `You are an expert at extracting information from visiting/business cards.
Extract the structured information from the provided visiting card image(s) and return ONLY a valid JSON object with this exact structure:
{
  "name": "full name of the person",
  "phones": ["phone1", "phone2"],
  "emails": ["email1", "email2"],
  "company": "company or organization name",
  "designation": "job title or position",
  "address": "full address",
  "website": "website URL"
}

Rules:
- Return ONLY the JSON object, no other text, no markdown code blocks
- If a field is not found, use empty string "" for text fields and [] for arrays
- For phones and emails, include all numbers/emails found
- Merge information intelligently if multiple card sides are provided
- Clean up any OCR noise or formatting artifacts
- Normalize phone numbers but keep country codes if present`,
  });

  const addImagePart = (dataUrl: string, label: string) => {
    const [header, data] = dataUrl.split(",");
    const mimeType = header.match(/data:([^;]+)/)?.[1] || "image/jpeg";
    if (backImageBase64) {
      parts.push({ text: label });
    }
    parts.push({ inlineData: { mimeType, data } });
  };

  addImagePart(frontImageBase64, "Front of card:");
  if (backImageBase64) {
    addImagePart(backImageBase64, "Back of card:");
  }

  const response = await getAi().models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts }],
    config: { maxOutputTokens: 8192 },
  });

  const text = response.text?.trim() || "{}";
  const cleaned = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    throw new GeminiResponseError("Gemini returned an invalid JSON response.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new GeminiResponseError("Gemini returned an unexpected response shape.");
  }

  const data = parsed as Record<string, unknown>;

  return {
    name: String(data.name || ""),
    phones: Array.isArray(data.phones) ? data.phones.map(String) : [],
    emails: Array.isArray(data.emails) ? data.emails.map(String) : [],
    company: String(data.company || ""),
    designation: String(data.designation || ""),
    address: String(data.address || ""),
    website: String(data.website || ""),
  };
}

export async function extractCardController(req: AuthRequest, res: Response) {
  const parsed = ExtractCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: "Invalid request body" });
    return;
  }

  const { frontImage, backImage } = parsed.data;

  if (!frontImage || !frontImage.startsWith("data:image/")) {
    res.status(400).json({ error: "Bad Request", message: "frontImage must be a valid base64 data URL" });
    return;
  }

  if (backImage && !backImage.startsWith("data:image/")) {
    res.status(400).json({ error: "Bad Request", message: "backImage must be a valid base64 data URL" });
    return;
  }

  const maxSize = 5 * 1024 * 1024;
  const base64Size = (value: string) => Math.ceil((value.length * 3) / 4);
  if (base64Size(frontImage) > maxSize || (backImage && base64Size(backImage) > maxSize)) {
    res.status(400).json({ error: "Bad Request", message: "Image size exceeds 5MB limit" });
    return;
  }

  try {
    const extractedData = await extractWithGemini(frontImage, backImage);
    const inserted = await createCard({
      userId: req.user!.id,
      extractedData,
      frontImageBase64: frontImage,
      backImageBase64: backImage || null,
    });

    res.json({
      id: inserted._id.toString(),
      data: extractedData,
      createdAt: inserted.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, "Card extraction failed");

    if (error instanceof GeminiConfigError) {
      res.status(503).json({
        error: "Service Unavailable",
        message: "Card extraction is not configured. Set GEMINI_API_KEY on the server.",
      });
      return;
    }

    if (error instanceof GeminiResponseError) {
      res.status(502).json({
        error: "Bad Gateway",
        message: "The AI provider returned an invalid extraction response. Please try again.",
      });
      return;
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: "Card extraction failed.",
    });
  }
}
