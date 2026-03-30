import { type Response } from "express";
import { listUsersWithCardCounts } from "@workspace/db";
import { type AuthRequest } from "../middleware/auth.js";

export async function getAdminUsersController(_req: AuthRequest, res: Response) {
  const users = await listUsersWithCardCounts();

  res.json({
    users: users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      cardCount: user.cardCount ?? 0,
      createdAt: user.createdAt.toISOString(),
    })),
    total: users.length,
  });
}

