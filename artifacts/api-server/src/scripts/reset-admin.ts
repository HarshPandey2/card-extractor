import "dotenv/config";
import bcrypt from "bcryptjs";
import { ensureAdminUser, verifyDatabaseConnection } from "@workspace/db";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be set in artifacts/api-server/.env`);
  }
  return value;
}

async function main() {
  const adminName = process.env.ADMIN_NAME?.trim() || "Platform Admin";
  const adminEmail = requireEnv("ADMIN_EMAIL").toLowerCase();
  const adminPassword = requireEnv("ADMIN_PASSWORD");

  await verifyDatabaseConnection();

  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  const user = await ensureAdminUser({
    name: adminName,
    email: adminEmail,
    password: hashedPassword,
  });

  if (!user) {
    throw new Error("Admin reset failed: no user record was returned.");
  }

  console.log(`Admin reset complete for ${user.email}`);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
