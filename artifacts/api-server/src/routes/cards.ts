import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, cardsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router: IRouter = Router();

router.get("/cards", requireAuth, async (req: AuthRequest, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const userId = req.user!.id;

  const [cards, countResult] = await Promise.all([
    db
      .select()
      .from(cardsTable)
      .where(eq(cardsTable.userId, userId))
      .orderBy(sql`${cardsTable.createdAt} DESC`)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(cardsTable)
      .where(eq(cardsTable.userId, userId)),
  ]);

  const total = countResult[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  res.json({
    cards: cards.map((c) => ({
      id: String(c.id),
      userId: String(c.userId),
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

router.delete("/cards/:id", requireAuth, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Bad Request", message: "Card ID must be a number" });
    return;
  }

  const result = await db
    .delete(cardsTable)
    .where(and(eq(cardsTable.id, id), eq(cardsTable.userId, req.user!.id)))
    .returning();

  if (result.length === 0) {
    res.status(404).json({ error: "Not Found", message: "Card not found or not yours" });
    return;
  }

  res.json({ success: true, message: "Card deleted successfully" });
});

export default router;
