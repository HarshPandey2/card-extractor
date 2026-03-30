import "dotenv/config";
import bcrypt from "bcryptjs";
import { ensureClientUser, verifyDatabaseConnection } from "@workspace/db";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be set in artifacts/api-server/.env`);
  }
  return value;
}

async function main() {
  const clientName = process.env.CLIENT_NAME?.trim() || "Client User";
  const clientEmail = requireEnv("CLIENT_EMAIL").toLowerCase();
  const clientPassword = requireEnv("CLIENT_PASSWORD");

  await verifyDatabaseConnection();

  const hashedPassword = await bcrypt.hash(clientPassword, 12);
  const user = await ensureClientUser({
    name: clientName,
    email: clientEmail,
    password: hashedPassword,
  });

  if (!user) {
    throw new Error("Client reset failed: no user record was returned.");
  }

  console.log(`Client reset complete for ${user.email}`);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
