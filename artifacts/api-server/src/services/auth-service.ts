import bcrypt from "bcryptjs";
import {
  ensureAdminUser,
  ensureClientUser,
  findUserByEmail,
  findUserById,
  type UserDocument,
} from "@workspace/db";

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly error: string,
  ) {
    super(message);
  }
}

export function toUserProfile(user: UserDocument) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt.toISOString(),
  };
}

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

export function validateSeededAccountEnv() {
  const pairs = [
    {
      label: "ADMIN",
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    },
    {
      label: "CLIENT",
      email: process.env.CLIENT_EMAIL,
      password: process.env.CLIENT_PASSWORD,
    },
  ];

  for (const pair of pairs) {
    const hasEmail = hasValue(pair.email);
    const hasPassword = hasValue(pair.password);
    if (hasEmail !== hasPassword) {
      throw new Error(
        `${pair.label}_EMAIL and ${pair.label}_PASSWORD must either both be set or both be omitted.`,
      );
    }
  }
}

export async function ensureSeededAccounts() {
  let changed = false;

  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  const adminName = process.env.ADMIN_NAME?.trim() || "Admin";

  if (adminEmail && adminPassword) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await ensureAdminUser({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
    });
    changed = true;
  }

  const clientEmail = process.env.CLIENT_EMAIL?.trim();
  const clientPassword = process.env.CLIENT_PASSWORD?.trim();
  const clientName = process.env.CLIENT_NAME?.trim() || "Client User";

  if (clientEmail && clientPassword) {
    const hashedPassword = await bcrypt.hash(clientPassword, 12);
    await ensureClientUser({
      name: clientName,
      email: clientEmail,
      password: hashedPassword,
    });
    changed = true;
  }

  return changed;
}

export async function loginVerifiedUser(input: { email: string; password: string }) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedPassword = input.password.trim();

  const user = await findUserByEmail(normalizedEmail);
  if (!user || user.role !== "user") {
    throw new AuthServiceError("Invalid email or password.", 401, "Unauthorized");
  }

  const passwordMatch = await bcrypt.compare(normalizedPassword, user.password);
  if (!passwordMatch) {
    throw new AuthServiceError("Invalid email or password.", 401, "Unauthorized");
  }

  if (!user.isVerified) {
    throw new AuthServiceError("Email not verified. Please verify your email before logging in.", 403, "Forbidden");
  }

  return user;
}

export async function loginAdmin(input: { email: string; password: string }) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedPassword = input.password.trim();

  const user = await findUserByEmail(normalizedEmail);
  if (!user || user.role !== "admin") {
    throw new AuthServiceError("Invalid admin credentials.", 401, "Unauthorized");
  }

  const passwordMatch = await bcrypt.compare(normalizedPassword, user.password);
  if (!passwordMatch) {
    throw new AuthServiceError("Invalid admin credentials.", 401, "Unauthorized");
  }

  if (!user.isVerified) {
    throw new AuthServiceError("Admin account is not verified or active.", 403, "Forbidden");
  }

  return user;
}

export async function getCurrentUser(userId: string) {
  const user = await findUserById(userId);
  if (!user) {
    throw new AuthServiceError("User not found.", 404, "Not Found");
  }
  return user;
}
