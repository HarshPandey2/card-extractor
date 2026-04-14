import { type Response } from "express";
import ExcelJS from "exceljs";
import {
  deleteAdminCard,
  exportAdminCards,
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

export async function exportAdminCardsController(req: AuthRequest, res: Response) {
  const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : undefined;
  const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : undefined;
  const search = String(req.query.search || "").trim();

  if (startDate && isNaN(startDate.getTime())) {
    res.status(400).json({ error: "Bad Request", message: "Invalid startDate" });
    return;
  }
  if (endDate && isNaN(endDate.getTime())) {
    res.status(400).json({ error: "Bad Request", message: "Invalid endDate" });
    return;
  }

  const cards = await exportAdminCards({ startDate, endDate, search });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Cards");

  // Add headers
  worksheet.columns = [
    { header: "ID", key: "id", width: 25 },
    { header: "User Name", key: "userName", width: 20 },
    { header: "Name", key: "name", width: 25 },
    { header: "Company", key: "company", width: 25 },
    { header: "Designation", key: "designation", width: 25 },
    { header: "Phones", key: "phones", width: 30 },
    { header: "Emails", key: "emails", width: 30 },
    { header: "Address", key: "address", width: 40 },
    { header: "Website", key: "website", width: 25 },
    { header: "Created At", key: "createdAt", width: 20 },
  ];

  // Add data
  cards.forEach((card) => {
    const data = getCardData(card);
    worksheet.addRow({
      id: card._id.toString(),
      userName: card.user?.[0]?.name || "Unknown",
      name: data.name,
      company: data.company,
      designation: data.designation,
      phones: data.phones.join(", "),
      emails: data.emails.join(", "),
      address: data.address,
      website: data.website,
      createdAt: card.createdAt.toISOString().split("T")[0], // Date only
    });
  });

  // Style the header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE6E6FA" },
  };

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=cards-export-${new Date().toISOString().split("T")[0]}.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();
}

