/**
 * Resolves Gemini credentials for local/production use.
 * Prefer GEMINI_API_KEY; legacy Replit vars remain supported.
 */
export function getGeminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.AI_INTEGRATIONS_GEMINI_API_KEY?.trim() ||
    ""
  );
}

/** Optional custom API base (e.g. Replit proxy). Omit for default Google endpoint. */
export function getGeminiBaseUrl(): string | undefined {
  const v =
    process.env.GEMINI_API_BASE_URL?.trim() ||
    process.env.AI_INTEGRATIONS_GEMINI_BASE_URL?.trim();
  return v || undefined;
}
