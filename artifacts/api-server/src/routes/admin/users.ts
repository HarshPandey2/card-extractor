import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, usersTable, cardsTable } from "@workspace/db";
import { requireAdmin, type AuthRequest } from "../../middleware/auth.js";

const router: IRouter = Router();

router.get("/admin/users", requireAdmin, async (_req: AuthRequest, res) => {
  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
      cardCount: sql<number>`count(${cardsTable.id})::int`,
    })
    .from(usersTable)
    .leftJoin(cardsTable, sql`${cardsTable.userId} = ${usersTable.id}`)
    .groupBy(usersTable.id)
    .orderBy(sql`${usersTable.createdAt} DESC`);

  res.json({
    users: users.map((u) => ({
      id: String(u.id),
      name: u.name,
      email: u.email,
      role: u.role,
      cardCount: u.cardCount ?? 0,
      createdAt: u.createdAt.toISOString(),
    })),
    total: users.length,
  });
});

export default router;
