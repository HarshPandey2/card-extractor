import { type Response } from "express";
import {
  deleteCardForUser,
  getCardData,
  isValidObjectId,
  listCardsByUser,
} from "@workspace/db";
import { type AuthRequest } from "../middleware/auth.js";

export async function getUserCardsController(req: AuthRequest, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const userId = req.user!.id;

  const { items: cards, total } = await listCardsByUser(userId, { page, limit });
  const totalPages = Math.ceil(total / limit);

  res.json({
    cards: cards.map((card) => ({
      id: card._id.toString(),
      userId: card.userId.toString(),
      data: getCardData(card),
      createdAt: card.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages,
  });
}

export async function deleteUserCardController(req: AuthRequest, res: Response) {
  const id = String(req.params.id);
  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "Bad Request", message: "Card ID must be a valid identifier" });
    return;
  }

  const result = await deleteCardForUser(id, req.user!.id);
  if (!result) {
    res.status(404).json({ error: "Not Found", message: "Card not found or not yours" });
    return;
  }

  res.json({ success: true, message: "Card deleted successfully" });
}

