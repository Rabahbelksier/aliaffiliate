import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const aliaffiliate = pgTable("aliaffiliate", {
  text_ar: text("text_ar").notNull().default(""),
  text_en: text("text_en").notNull().default(""),
  btn_ar: text("btn_ar").notNull().default(""),
  btn_en: text("btn_en").notNull().default(""),
  link: text("link").notNull().default(""),
  version: text("version").notNull().default("0.0.0"),
  baner: text("baner").notNull().default("off"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type AliAffiliateConfig = typeof aliaffiliate.$inferSelect;
