import { Router, type IRouter } from "express";
import { eq, ilike, or, sql } from "drizzle-orm";
import { db, cardsTable, usersTable } from "@workspace/db";
import { requireAdmin, type AuthRequest } from "../../middleware/auth.js";

const router: IRouter = Router();

router.get("/admin/cards", requireAdmin, async (req: AuthRequest, res) => {
  const search = String(req.query.search || "").trim();
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  let whereClause;
  if (search) {
    const q = `%${search}%`;
    whereClause = or(
      ilike(cardsTable.name, q),
      ilike(cardsTable.company, q),
      sql`${cardsTable.emails}::text ILIKE ${q}`,
      sql`${cardsTable.phones}::text ILIKE ${q}`
    );
  }

  const [cards, countResult] = await Promise.all([
    db
      .select({
        id: cardsTable.id,
        userId: cardsTable.userId,
        userName: usersTable.name,
        name: cardsTable.name,
        phones: cardsTable.phones,
        emails: cardsTable.emails,
        company: cardsTable.company,
        designation: cardsTable.designation,
        address: cardsTable.address,
        website: cardsTable.website,
        createdAt: cardsTable.createdAt,
      })
      .from(cardsTable)
      .leftJoin(usersTable, eq(cardsTable.userId, usersTable.id))
      .where(whereClause)
      .orderBy(sql`${cardsTable.createdAt} DESC`)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(cardsTable)
      .where(whereClause),
  ]);

  const total = countResult[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  res.json({
    cards: cards.map((c) => ({
      id: String(c.id),
      userId: c.userId ? String(c.userId) : undefined,
      userName: c.userName || "Unknown",
      data: {
        name: c.name,
        phones: c.phones as string[],
        emails: c.emails as string[],
        company: c.company,
        designation: c.designation,
        address: c.address,
        website: c.website,
      },
      createdAt: c.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages,
  });
});

router.delete("/admin/cards/:id", requireAdmin, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Bad Request", message: "Card ID must be a number" });
    return;
  }

  const result = await db.delete(cardsTable).where(eq(cardsTable.id, id)).returning();
  if (result.length === 0) {
    res.status(404).json({ error: "Not Found", message: "Card not found" });
    return;
  }

  res.json({ success: true, message: "Card deleted successfully" });
});

export default router;
