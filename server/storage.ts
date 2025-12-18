import { db } from "./db";
import { eq, desc, sql, and, gte, lt } from "drizzle-orm";
import {
  prescribers,
  packagings,
  formulas,
  csvOrders,
  manualOrders,
  reports,
  pharmaceuticalForms,
  type Prescriber,
  type InsertPrescriber,
  type Packaging,
  type InsertPackaging,
  type Formula,
  type InsertFormula,
  type CsvOrder,
  type InsertCsvOrder,
  type ManualOrder,
  type InsertManualOrder,
  type Report,
  type InsertReport,
  type PharmaceuticalForm,
  type InsertPharmaceuticalForm,
} from "@shared/schema";

export interface IStorage {
  getPrescribers(): Promise<Prescriber[]>;
  getPrescriber(id: number): Promise<Prescriber | undefined>;
  createPrescriber(prescriber: InsertPrescriber): Promise<Prescriber>;
  updatePrescriber(id: number, prescriber: Partial<InsertPrescriber>): Promise<Prescriber | undefined>;
  deletePrescriber(id: number): Promise<void>;

  getPackagings(): Promise<Packaging[]>;
  getPackaging(id: number): Promise<Packaging | undefined>;
  createPackaging(packaging: InsertPackaging): Promise<Packaging>;
  deletePackaging(id: number): Promise<void>;

  getFormulas(): Promise<Formula[]>;
  getFormula(id: number): Promise<Formula | undefined>;
  createFormula(formula: InsertFormula): Promise<Formula>;
  updateFormula(id: number, formula: Partial<InsertFormula>): Promise<Formula | undefined>;
  deleteFormula(id: number): Promise<void>;

  getCsvOrders(): Promise<CsvOrder[]>;
  createCsvOrder(order: InsertCsvOrder): Promise<CsvOrder>;
  deleteCsvOrder(id: number): Promise<void>;
  deleteAllCsvOrders(): Promise<void>;

  getManualOrders(): Promise<ManualOrder[]>;
  getManualOrder(id: number): Promise<ManualOrder | undefined>;
  getManualOrdersByPrescriberAndMonth(prescriberId: number, month: number, year: number): Promise<ManualOrder[]>;
  createManualOrder(order: InsertManualOrder): Promise<ManualOrder>;
  updateManualOrder(id: number, order: Partial<InsertManualOrder>): Promise<ManualOrder | undefined>;
  deleteManualOrder(id: number): Promise<void>;

  getReports(): Promise<Report[]>;
  getReport(id: number): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
  deleteReport(id: number): Promise<void>;

  getPharmaceuticalForms(): Promise<PharmaceuticalForm[]>;
  createPharmaceuticalForm(form: InsertPharmaceuticalForm): Promise<PharmaceuticalForm>;
}

export class DatabaseStorage implements IStorage {
  async getPrescribers(): Promise<Prescriber[]> {
    return await db.select().from(prescribers).orderBy(desc(prescribers.createdAt));
  }

  async getPrescriber(id: number): Promise<Prescriber | undefined> {
    const result = await db.select().from(prescribers).where(eq(prescribers.id, id));
    return result[0];
  }

  async createPrescriber(prescriber: InsertPrescriber): Promise<Prescriber> {
    const result = await db.insert(prescribers).values(prescriber).returning();
    return result[0];
  }

  async updatePrescriber(id: number, prescriber: Partial<InsertPrescriber>): Promise<Prescriber | undefined> {
    const result = await db
      .update(prescribers)
      .set({ ...prescriber, updatedAt: new Date() })
      .where(eq(prescribers.id, id))
      .returning();
    return result[0];
  }

  async deletePrescriber(id: number): Promise<void> {
    await db.delete(prescribers).where(eq(prescribers.id, id));
  }

  async getPackagings(): Promise<Packaging[]> {
    return await db.select().from(packagings).orderBy(desc(packagings.createdAt));
  }

  async getPackaging(id: number): Promise<Packaging | undefined> {
    const result = await db.select().from(packagings).where(eq(packagings.id, id));
    return result[0];
  }

  async createPackaging(packaging: InsertPackaging): Promise<Packaging> {
    const result = await db.insert(packagings).values(packaging).returning();
    return result[0];
  }

  async deletePackaging(id: number): Promise<void> {
    await db.delete(packagings).where(eq(packagings.id, id));
  }

  async getFormulas(): Promise<Formula[]> {
    return await db.select().from(formulas).orderBy(desc(formulas.createdAt));
  }

  async getFormula(id: number): Promise<Formula | undefined> {
    const result = await db.select().from(formulas).where(eq(formulas.id, id));
    return result[0];
  }

  async createFormula(formula: InsertFormula): Promise<Formula> {
    const result = await db.insert(formulas).values(formula).returning();
    return result[0];
  }

  async updateFormula(id: number, formula: Partial<InsertFormula>): Promise<Formula | undefined> {
    const result = await db.update(formulas).set(formula).where(eq(formulas.id, id)).returning();
    return result[0];
  }

  async deleteFormula(id: number): Promise<void> {
    await db.delete(formulas).where(eq(formulas.id, id));
  }

  async getCsvOrders(): Promise<CsvOrder[]> {
    return await db.select().from(csvOrders).orderBy(desc(csvOrders.orderDate));
  }

  async createCsvOrder(order: InsertCsvOrder): Promise<CsvOrder> {
    const result = await db.insert(csvOrders).values(order).returning();
    return result[0];
  }

  async deleteCsvOrder(id: number): Promise<void> {
    await db.delete(csvOrders).where(eq(csvOrders.id, id));
  }

  async deleteAllCsvOrders(): Promise<void> {
    await db.delete(csvOrders);
  }

  async getManualOrders(): Promise<ManualOrder[]> {
    return await db.select().from(manualOrders).orderBy(desc(manualOrders.orderDate));
  }

  async getManualOrder(id: number): Promise<ManualOrder | undefined> {
    const result = await db.select().from(manualOrders).where(eq(manualOrders.id, id));
    return result[0];
  }

  async getManualOrdersByPrescriberAndMonth(prescriberId: number, month: number, year: number): Promise<ManualOrder[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    
    return await db.select().from(manualOrders).where(
      and(
        eq(manualOrders.prescriberId, prescriberId),
        gte(manualOrders.orderDate, startDate),
        lt(manualOrders.orderDate, endDate)
      )
    );
  }

  async createManualOrder(order: InsertManualOrder): Promise<ManualOrder> {
    const result = await db.insert(manualOrders).values(order).returning();
    return result[0];
  }

  async updateManualOrder(id: number, order: Partial<InsertManualOrder>): Promise<ManualOrder | undefined> {
    const result = await db.update(manualOrders).set(order).where(eq(manualOrders.id, id)).returning();
    return result[0];
  }

  async deleteManualOrder(id: number): Promise<void> {
    await db.delete(manualOrders).where(eq(manualOrders.id, id));
  }

  async getReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async getReport(id: number): Promise<Report | undefined> {
    const result = await db.select().from(reports).where(eq(reports.id, id));
    return result[0];
  }

  async createReport(report: InsertReport): Promise<Report> {
    const result = await db.insert(reports).values(report).returning();
    return result[0];
  }

  async deleteReport(id: number): Promise<void> {
    await db.delete(reports).where(eq(reports.id, id));
  }

  async getPharmaceuticalForms(): Promise<PharmaceuticalForm[]> {
    return await db.select().from(pharmaceuticalForms).orderBy(pharmaceuticalForms.name);
  }

  async createPharmaceuticalForm(form: InsertPharmaceuticalForm): Promise<PharmaceuticalForm> {
    const result = await db
      .insert(pharmaceuticalForms)
      .values(form)
      .onConflictDoNothing()
      .returning();
    return result[0] || (await db.select().from(pharmaceuticalForms).where(eq(pharmaceuticalForms.name, form.name)))[0];
  }
}

export const storage = new DatabaseStorage();
