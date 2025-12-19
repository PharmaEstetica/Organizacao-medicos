import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, boolean, integer, decimal, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const prescribers = pgTable("prescribers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  crm: text("crm"),
  crmRequired: boolean("crm_required").notNull().default(true),
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }).notNull(),
  bondType: varchar("bond_type", { length: 1 }).notNull(),
  photoUrl: text("photo_url"),
  attachments: json("attachments").$type<{ name: string; type: string; data: string; }[]>().default([]),
  linkedPackagings: json("linked_packagings").$type<number[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPrescriberSchema = createInsertSchema(prescribers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPrescriber = z.infer<typeof insertPrescriberSchema>;
export type Prescriber = typeof prescribers.$inferSelect;

export const packagings = pgTable("packagings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  capacity: text("capacity").notNull(),
  imageUrl: text("image_url"),
  hasSticker: boolean("has_sticker").notNull().default(false),
  stickerSupplier: text("sticker_supplier"),
  labelSpecifications: text("label_specifications"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPackagingSchema = createInsertSchema(packagings).omit({
  id: true,
  createdAt: true,
});

export type InsertPackaging = z.infer<typeof insertPackagingSchema>;
export type Packaging = typeof packagings.$inferSelect;

export const formulas = pgTable("formulas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  prescriberId: integer("prescriber_id").references(() => prescribers.id, { onDelete: 'set null' }),
  packagingId: integer("packaging_id").references(() => packagings.id, { onDelete: 'set null' }),
  content: text("content").notNull(),
  pharmaceuticalForm: text("pharmaceutical_form").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFormulaSchema = createInsertSchema(formulas).omit({
  id: true,
  createdAt: true,
});

export type InsertFormula = z.infer<typeof insertFormulaSchema>;
export type Formula = typeof formulas.$inferSelect;

export const formulaPrescribers = pgTable("formula_prescribers", {
  id: serial("id").primaryKey(),
  formulaId: integer("formula_id").references(() => formulas.id, { onDelete: 'cascade' }).notNull(),
  prescriberId: integer("prescriber_id").references(() => prescribers.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFormulaPrescribersSchema = createInsertSchema(formulaPrescribers).omit({
  id: true,
  createdAt: true,
});

export type InsertFormulaPrescribers = z.infer<typeof insertFormulaPrescribersSchema>;
export type FormulaPrescribers = typeof formulaPrescribers.$inferSelect;

export const packagingPrescribers = pgTable("packaging_prescribers", {
  id: serial("id").primaryKey(),
  packagingId: integer("packaging_id").references(() => packagings.id, { onDelete: 'cascade' }).notNull(),
  prescriberId: integer("prescriber_id").references(() => prescribers.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPackagingPrescribersSchema = createInsertSchema(packagingPrescribers).omit({
  id: true,
  createdAt: true,
});

export type InsertPackagingPrescribers = z.infer<typeof insertPackagingPrescribersSchema>;
export type PackagingPrescribers = typeof packagingPrescribers.$inferSelect;

export const csvOrders = pgTable("csv_orders", {
  id: serial("id").primaryKey(),
  prescriberName: text("prescriber_name").notNull(),
  orderNumbers: text("order_numbers").notNull(),
  orderDate: timestamp("order_date").notNull(),
  status: varchar("status", { length: 30 }).notNull(),
  netValue: decimal("net_value", { precision: 10, scale: 2 }).notNull(),
  patient: text("patient"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCsvOrderSchema = createInsertSchema(csvOrders).omit({
  id: true,
  createdAt: true,
});

export type InsertCsvOrder = z.infer<typeof insertCsvOrderSchema>;
export type CsvOrder = typeof csvOrders.$inferSelect;

export const manualOrders = pgTable("manual_orders", {
  id: serial("id").primaryKey(),
  prescriberId: integer("prescriber_id").references(() => prescribers.id, { onDelete: 'cascade' }).notNull(),
  orderNumbers: text("order_numbers").notNull(),
  orderDate: timestamp("order_date").notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  netValue: decimal("net_value", { precision: 10, scale: 2 }).notNull(),
  req: text("req"),
  paymentStatus: varchar("payment_status", { length: 20 }).default('pending'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertManualOrderSchema = createInsertSchema(manualOrders).omit({
  id: true,
  createdAt: true,
});

export type InsertManualOrder = z.infer<typeof insertManualOrderSchema>;
export type ManualOrder = typeof manualOrders.$inferSelect;

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  prescriberId: integer("prescriber_id").references(() => prescribers.id, { onDelete: 'cascade' }).notNull(),
  referenceMonth: text("reference_month").notNull(),
  totalOrders: integer("total_orders").notNull(),
  effectiveOrders: integer("effective_orders").notNull(),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).notNull(),
  totalEffectiveValue: decimal("total_effective_value", { precision: 10, scale: 2 }).notNull(),
  commissionValue: decimal("commission_value", { precision: 10, scale: 2 }).notNull(),
  expenses: decimal("expenses", { precision: 10, scale: 2 }).notNull().default('0'),
  finalBalance: decimal("final_balance", { precision: 10, scale: 2 }).notNull(),
  pdfPath: text("pdf_path"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export const pharmaceuticalForms = pgTable("pharmaceutical_forms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPharmaceuticalFormSchema = createInsertSchema(pharmaceuticalForms).omit({
  id: true,
  createdAt: true,
});

export type InsertPharmaceuticalForm = z.infer<typeof insertPharmaceuticalFormSchema>;
export type PharmaceuticalForm = typeof pharmaceuticalForms.$inferSelect;

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;
