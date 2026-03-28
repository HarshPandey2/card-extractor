import { Router, type IRouter } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { db, cardsTable } from "@workspace/db";
import { ExtractCardBody } from "@workspace/api-zod";

const router: IRouter = Router();

interface CardData {
  name: string;
  phones: string[];
  emails: string[];
  company: string;
  designation: string;
  address: string;
  website: string;
}

async function extractWithGemini(frontImageBase64: string, backImageBase64?: string): Promise<CardData> {
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
- Normalize phone numbers but keep country codes if present`
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

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts }],
    config: { maxOutputTokens: 8192 },
  });

  const text = response.text?.trim() || "{}";
  const cleaned = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  const parsed = JSON.parse(cleaned);

  return {
    name: String(parsed.name || ""),
    phones: Array.isArray(parsed.phones) ? parsed.phones.map(String) : [],
    emails: Array.isArray(parsed.emails) ? parsed.emails.map(String) : [],
    company: String(parsed.company || ""),
    designation: String(parsed.designation || ""),
    address: String(parsed.address || ""),
    website: String(parsed.website || ""),
  };
}

router.post("/extract", async (req, res) => {
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
  const base64Size = (s: string) => Math.ceil((s.length * 3) / 4);
  if (base64Size(frontImage) > maxSize || (backImage && base64Size(backImage) > maxSize)) {
    res.status(400).json({ error: "Bad Request", message: "Image size exceeds 5MB limit" });
    return;
  }

  const cardData = await extractWithGemini(frontImage, backImage);

  const [inserted] = await db
    .insert(cardsTable)
    .values({
      name: cardData.name,
      phones: cardData.phones,
      emails: cardData.emails,
      company: cardData.company,
      designation: cardData.designation,
      address: cardData.address,
      website: cardData.website,
      frontImageBase64: frontImage,
      backImageBase64: backImage || null,
    })
    .returning();

  res.json({
    id: String(inserted.id),
    data: cardData,
    createdAt: inserted.createdAt.toISOString(),
  });
});

export default router;
