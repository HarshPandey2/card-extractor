import { pgTable, text, serial, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cardsTable = pgTable("cards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default(""),
  phones: jsonb("phones").notNull().default([]),
  emails: jsonb("emails").notNull().default([]),
  company: text("company").notNull().default(""),
  designation: text("designation").notNull().default(""),
  address: text("address").notNull().default(""),
  website: text("website").notNull().default(""),
  frontImageBase64: text("front_image_base64"),
  backImageBase64: text("back_image_base64"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCardSchema = createInsertSchema(cardsTable).omit({ id: true, createdAt: true });
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Card = typeof cardsTable.$inferSelect;
