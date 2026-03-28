import { Router, type IRouter } from "express";
import { eq, ilike, or, sql } from "drizzle-orm";
import { db, cardsTable } from "@workspace/db";
import { GetAdminCardsQueryParams, DeleteAdminCardParams } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../../middleware/auth.js";

const router: IRouter = Router();

router.get("/admin/cards", requireAuth, async (req: AuthRequest, res) => {
  const parsed = GetAdminCardsQueryParams.safeParse(req.query);
  const search = parsed.success ? parsed.data.search : undefined;
  const page = (parsed.success && parsed.data.page) ? Number(parsed.data.page) : 1;
  const limit = (parsed.success && parsed.data.limit) ? Number(parsed.data.limit) : 20;
  const offset = (page - 1) * limit;

  let whereClause;
  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    whereClause = or(
      ilike(cardsTable.name, q),
      ilike(cardsTable.company, q),
      sql`${cardsTable.emails}::text ILIKE ${q}`,
      sql`${cardsTable.phones}::text ILIKE ${q}`
    );
  }

  const [cards, countResult] = await Promise.all([
    db
      .select()
      .from(cardsTable)
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
      data: {
        name: c.name,
        phones: c.phones as string[],
        emails: c.emails as string[],
        company: c.company,
        designation: c.designation,
        address: c.address,
        website: c.website,
      },
      frontImageUrl: c.frontImageBase64 ? `/api/admin/cards/${c.id}/image/front` : undefined,
      backImageUrl: c.backImageBase64 ? `/api/admin/cards/${c.id}/image/back` : undefined,
      createdAt: c.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages,
  });
});

router.delete("/admin/cards/:id", requireAuth, async (req: AuthRequest, res) => {
  const parsed = DeleteAdminCardParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: "Invalid card ID" });
    return;
  }

  const id = Number(parsed.data.id);
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
