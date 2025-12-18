import { db } from "./db";
import { eq, desc, sql, and, gte, lt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  prescribers,
  packagings,
  formulas,
  csvOrders,
  manualOrders,
  reports,
  pharmaceuticalForms,
  settings,
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
  type Setting,
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

  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  upsertSetting(key: string, value: string): Promise<Setting>;
  initializeDefaultSettings(): Promise<void>;
  verifyPassword(area: string, password: string): Promise<boolean>;
  updatePassword(area: string, newPassword: string): Promise<void>;
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

  async getSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const result = await db.select().from(settings).where(eq(settings.settingKey, key));
    return result[0];
  }

  async upsertSetting(key: string, value: string): Promise<Setting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const result = await db
        .update(settings)
        .set({ settingValue: value, updatedAt: new Date() })
        .where(eq(settings.settingKey, key))
        .returning();
      return result[0];
    } else {
      const result = await db
        .insert(settings)
        .values({ settingKey: key, settingValue: value })
        .returning();
      return result[0];
    }
  }

  async initializeDefaultSettings(): Promise<void> {
    const defaultPassword = 'kaedy1227';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const defaultSettings = [
      { key: 'relatorios_protected', value: 'true' },
      { key: 'relatorios_password', value: hashedPassword },
      { key: 'delete_protected', value: 'true' },
      { key: 'delete_password', value: hashedPassword },
      { key: 'config_protected', value: 'true' },
      { key: 'config_password', value: hashedPassword },
    ];

    for (const { key, value } of defaultSettings) {
      const existing = await this.getSetting(key);
      if (!existing) {
        await db.insert(settings).values({ settingKey: key, settingValue: value });
      }
    }
  }

  async verifyPassword(area: string, password: string): Promise<boolean> {
    const storedHash = await this.getSetting(`${area}_password`);
    if (!storedHash) return false;
    return bcrypt.compare(password, storedHash.settingValue);
  }

  async updatePassword(area: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.upsertSetting(`${area}_password`, hashedPassword);
  }
}

export const storage = new DatabaseStorage();
