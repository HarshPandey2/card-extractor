import { type Response } from "express";
import {
  deleteAdminCard,
  getCardData,
  isValidObjectId,
  listAdminCards,
} from "@workspace/db";
import { type AuthRequest } from "../middleware/auth.js";

export async function getAdminCardsController(req: AuthRequest, res: Response) {
  const search = String(req.query.search || "").trim();
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const { items: cards, total } = await listAdminCards({ search, page, limit });
  const totalPages = Math.ceil(total / limit);

  res.json({
    cards: cards.map((card) => ({
      id: card._id.toString(),
      userId: card.userId?.toString(),
      userName: card.user?.[0]?.name || "Unknown",
      data: getCardData(card),
      createdAt: card.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages,
  });
}

export async function deleteAdminCardController(req: AuthRequest, res: Response) {
  const id = String(req.params.id);
  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "Bad Request", message: "Card ID must be a valid identifier" });
    return;
  }

  const result = await deleteAdminCard(id);
  if (!result) {
    res.status(404).json({ error: "Not Found", message: "Card not found" });
    return;
  }

  res.json({ success: true, message: "Card deleted successfully" });
}

