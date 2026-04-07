import { db } from "./db";
import { eq, desc, sql, and, gte, lt, ne, or, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  prescribers,
  packagings,
  formulas,
  formulaPrescribers,
  packagingPrescribers,
  csvOrders,
  manualOrders,
  reports,
  pharmaceuticalForms,
  settings,
  cashbackBalances,
  cashbackPayments,
  type Prescriber,
  type InsertPrescriber,
  type Packaging,
  type InsertPackaging,
  type Formula,
  type InsertFormula,
  type FormulaPrescribers,
  type InsertFormulaPrescribers,
  type PackagingPrescribers,
  type InsertPackagingPrescribers,
  type CsvOrder,
  type InsertCsvOrder,
  type ManualOrder,
  type InsertManualOrder,
  type Report,
  type InsertReport,
  type PharmaceuticalForm,
  type InsertPharmaceuticalForm,
  type Setting,
  type CashbackBalance,
  type CashbackPayment,
} from "@shared/schema";

export interface CashbackSummary {
  prescriber_id: number;
  name: string;
  specialty: string;
  total_cashback_earned: number;
  total_deductions: number;
  total_net_cashback: number;
  total_available: number;
  total_pending: number;
  total_paid: number;
  balance: number;
  monthly_breakdown: {
    id: number;
    month: string;
    gross_sales: number;
    cashback_percentage: number;
    cashback_amount: number;
    deductions: number;
    net_cashback: number;
    status: string;
  }[];
  payments_history: {
    id: number;
    amount: number;
    payment_date: string;
    notes: string | null;
  }[];
}

export interface IStorage {
  getPrescribers(): Promise<Prescriber[]>;
  getPrescriber(id: number): Promise<Prescriber | undefined>;
  createPrescriber(prescriber: InsertPrescriber): Promise<Prescriber>;
  updatePrescriber(id: number, prescriber: Partial<InsertPrescriber>): Promise<Prescriber | undefined>;
  deletePrescriber(id: number): Promise<void>;

  getPackagings(): Promise<Packaging[]>;
  getPackaging(id: number): Promise<Packaging | undefined>;
  createPackaging(packaging: InsertPackaging): Promise<Packaging>;
  updatePackaging(id: number, packaging: Partial<InsertPackaging>): Promise<Packaging | undefined>;
  deletePackaging(id: number): Promise<void>;

  getFormulas(): Promise<Formula[]>;
  getFormula(id: number): Promise<Formula | undefined>;
  createFormula(formula: InsertFormula): Promise<Formula>;
  updateFormula(id: number, formula: Partial<InsertFormula>): Promise<Formula | undefined>;
  deleteFormula(id: number): Promise<void>;

  getFormulaPrescribers(formulaId: number): Promise<FormulaPrescribers[]>;
  setFormulaPrescribers(formulaId: number, prescriberIds: number[]): Promise<void>;
  getFormulasWithPrescribers(): Promise<(Formula & { prescribers: Prescriber[] })[]>;

  getPackagingPrescribers(packagingId: number): Promise<PackagingPrescribers[]>;
  setPackagingPrescribers(packagingId: number, prescriberIds: number[]): Promise<void>;
  getPackagingsWithPrescribers(): Promise<(Packaging & { prescribers: Prescriber[] })[]>;

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
  getReportOrders(reportId: number): Promise<CsvOrder[]>;
  deleteSelectedReportOrders(reportId: number, orderIds: number[]): Promise<void>;

  getPharmaceuticalForms(): Promise<PharmaceuticalForm[]>;
  createPharmaceuticalForm(form: InsertPharmaceuticalForm): Promise<PharmaceuticalForm>;

  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  upsertSetting(key: string, value: string): Promise<Setting>;
  initializeDefaultSettings(): Promise<void>;
  verifyPassword(area: string, password: string): Promise<boolean>;
  updatePassword(area: string, newPassword: string): Promise<void>;

  upsertCashbackBalance(prescriberId: number, month: string, grossSales: number, cashbackPercentage: number, deductions?: number): Promise<CashbackBalance>;
  getCashbackSummary(prescriberId: number): Promise<CashbackSummary>;
  getAllCashbackSummaries(): Promise<Omit<CashbackSummary, 'monthly_breakdown' | 'payments_history'>[]>;
  createCashbackPayment(prescriberId: number, amount: number, paymentDate: string, notes?: string): Promise<CashbackPayment>;
  getCashbackAvailableBalance(prescriberId: number): Promise<number>;
  deleteCashbackBalance(id: number): Promise<void>;
  deleteCashbackPayment(id: number): Promise<void>;
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

  async updatePackaging(id: number, packaging: Partial<InsertPackaging>): Promise<Packaging | undefined> {
    const result = await db.update(packagings).set(packaging).where(eq(packagings.id, id)).returning();
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

  async getFormulaPrescribers(formulaId: number): Promise<FormulaPrescribers[]> {
    return await db.select().from(formulaPrescribers).where(eq(formulaPrescribers.formulaId, formulaId));
  }

  async setFormulaPrescribers(formulaId: number, prescriberIds: number[]): Promise<void> {
    await db.delete(formulaPrescribers).where(eq(formulaPrescribers.formulaId, formulaId));
    if (prescriberIds.length > 0) {
      await db.insert(formulaPrescribers).values(
        prescriberIds.map(prescriberId => ({ formulaId, prescriberId }))
      );
    }
  }

  async getFormulasWithPrescribers(): Promise<(Formula & { prescribers: Prescriber[] })[]> {
    const allFormulas = await db.select().from(formulas).orderBy(desc(formulas.createdAt));
    const allPrescribers = await db.select().from(prescribers);
    const allFormulaPrescribers = await db.select().from(formulaPrescribers);
    
    return allFormulas.map(formula => {
      const linkedPrescriberIds = allFormulaPrescribers
        .filter(fp => fp.formulaId === formula.id)
        .map(fp => fp.prescriberId);
      
      const linkedPrescribers = allPrescribers.filter(p => 
        linkedPrescriberIds.includes(p.id) || 
        (formula.prescriberId === p.id)
      );
      
      return { ...formula, prescribers: linkedPrescribers };
    });
  }

  async getPackagingPrescribers(packagingId: number): Promise<PackagingPrescribers[]> {
    return await db.select().from(packagingPrescribers).where(eq(packagingPrescribers.packagingId, packagingId));
  }

  async setPackagingPrescribers(packagingId: number, prescriberIds: number[]): Promise<void> {
    await db.delete(packagingPrescribers).where(eq(packagingPrescribers.packagingId, packagingId));
    if (prescriberIds.length > 0) {
      await db.insert(packagingPrescribers).values(
        prescriberIds.map(prescriberId => ({ packagingId, prescriberId }))
      );
    }
  }

  async getPackagingsWithPrescribers(): Promise<(Packaging & { prescribers: Prescriber[] })[]> {
    const allPackagings = await db.select().from(packagings).orderBy(desc(packagings.createdAt));
    const allPrescribers = await db.select().from(prescribers);
    const allPackagingPrescribers = await db.select().from(packagingPrescribers);
    
    return allPackagings.map(packaging => {
      const linkedPrescriberIds = allPackagingPrescribers
        .filter(pp => pp.packagingId === packaging.id)
        .map(pp => pp.prescriberId);
      
      const linkedPrescribers = allPrescribers.filter(p => 
        linkedPrescriberIds.includes(p.id)
      );
      
      return { ...packaging, prescribers: linkedPrescribers };
    });
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
        lt(manualOrders.orderDate, endDate),
        or(isNull(manualOrders.paymentStatus), ne(manualOrders.paymentStatus, 'paid'))
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

  async getReportOrders(reportId: number): Promise<CsvOrder[]> {
    const report = await this.getReport(reportId);
    if (!report) return [];

    const prescriber = (await db.select().from(prescribers).where(eq(prescribers.id, report.prescriberId)))[0];
    if (!prescriber) return [];

    const [month, year] = report.referenceMonth.split('/').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    return await db.select().from(csvOrders).where(
      and(
        sql`LOWER(${csvOrders.prescriberName}) = LOWER(${prescriber.name})`,
        gte(csvOrders.orderDate, startDate),
        lt(csvOrders.orderDate, endDate)
      )
    );
  }

  async deleteSelectedReportOrders(reportId: number, orderIds: number[]): Promise<void> {
    if (orderIds.length === 0) return;

    const report = await this.getReport(reportId);
    if (!report) return;

    const prescriber = (await db.select().from(prescribers).where(eq(prescribers.id, report.prescriberId)))[0];
    if (!prescriber) return;

    const [month, year] = report.referenceMonth.split('/').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    for (const id of orderIds) {
      await db.delete(csvOrders).where(eq(csvOrders.id, id));
    }

    const remaining = await db.select().from(csvOrders).where(
      and(
        sql`LOWER(${csvOrders.prescriberName}) = LOWER(${prescriber.name})`,
        gte(csvOrders.orderDate, startDate),
        lt(csvOrders.orderDate, endDate)
      )
    );

    const effectiveOrders = remaining.filter(o => o.status === 'Efetivado');
    const totalOrders = remaining.length;
    const effectiveCount = effectiveOrders.length;
    const totalEffectiveValue = effectiveOrders.reduce((sum, o) => sum + parseFloat(o.netValue), 0);
    const commissionRate = parseFloat(prescriber.commissionPercentage);
    const commissionValue = totalEffectiveValue * (commissionRate / 100);
    const expenses = parseFloat(report.expenses) || 0;
    const finalBalance = commissionValue - expenses;
    const conversionRate = totalOrders > 0 ? (effectiveCount / totalOrders) * 100 : 0;

    await db.update(reports).set({
      totalOrders,
      effectiveOrders: effectiveCount,
      conversionRate: conversionRate.toFixed(2),
      totalEffectiveValue: totalEffectiveValue.toFixed(2),
      commissionValue: commissionValue.toFixed(2),
      finalBalance: finalBalance.toFixed(2),
    }).where(eq(reports.id, reportId));

    await db.delete(csvOrders).where(
      and(
        sql`LOWER(${csvOrders.prescriberName}) = LOWER(${prescriber.name})`,
        gte(csvOrders.orderDate, startDate),
        lt(csvOrders.orderDate, endDate)
      )
    );
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
      { key: 'excluir_protected', value: 'true' },
      { key: 'excluir_password', value: hashedPassword },
      { key: 'config_protected', value: 'true' },
      { key: 'config_password', value: hashedPassword },
      { key: 'editar_relatorio_protected', value: 'true' },
      { key: 'editar_relatorio_password', value: hashedPassword },
    ];

    for (const { key, value } of defaultSettings) {
      const existing = await this.getSetting(key);
      if (!existing) {
        await db.insert(settings).values({ settingKey: key, settingValue: value });
      }
    }
  }

  async verifyPassword(area: string, password: string): Promise<boolean> {
    // Try area-specific password first; fall back to delete_password for areas that share it
    let storedHash = await this.getSetting(`${area}_password`);
    if (!storedHash) {
      storedHash = await this.getSetting('delete_password');
    }
    if (!storedHash) return false;
    return bcrypt.compare(password, storedHash.settingValue);
  }

  async updatePassword(area: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.upsertSetting(`${area}_password`, hashedPassword);
  }

  async upsertCashbackBalance(
    prescriberId: number,
    month: string,
    grossSales: number,
    cashbackPercentage: number,
    deductions: number = 0
  ): Promise<CashbackBalance> {
    const cashbackAmount = parseFloat((grossSales * cashbackPercentage / 100).toFixed(2));
    const netCashback = parseFloat(Math.max(0, cashbackAmount - deductions).toFixed(2));
    const existing = await db
      .select()
      .from(cashbackBalances)
      .where(and(eq(cashbackBalances.prescriberId, prescriberId), eq(cashbackBalances.month, month)));

    if (existing.length > 0) {
      const result = await db
        .update(cashbackBalances)
        .set({
          grossSales: grossSales.toFixed(2),
          cashbackPercentage: cashbackPercentage.toFixed(2),
          cashbackAmount: cashbackAmount.toFixed(2),
          deductions: deductions.toFixed(2),
          netCashback: netCashback.toFixed(2),
          updatedAt: new Date(),
        })
        .where(and(eq(cashbackBalances.prescriberId, prescriberId), eq(cashbackBalances.month, month)))
        .returning();
      return result[0];
    } else {
      const result = await db
        .insert(cashbackBalances)
        .values({
          prescriberId,
          month,
          grossSales: grossSales.toFixed(2),
          cashbackPercentage: cashbackPercentage.toFixed(2),
          cashbackAmount: cashbackAmount.toFixed(2),
          deductions: deductions.toFixed(2),
          netCashback: netCashback.toFixed(2),
          status: 'available',
        })
        .returning();
      return result[0];
    }
  }

  async getCashbackSummary(prescriberId: number): Promise<CashbackSummary> {
    const prescriber = await this.getPrescriber(prescriberId);
    if (!prescriber) throw new Error('Prescritor não encontrado');

    const balances = await db
      .select()
      .from(cashbackBalances)
      .where(eq(cashbackBalances.prescriberId, prescriberId))
      .orderBy(desc(cashbackBalances.month));

    const payments = await db
      .select()
      .from(cashbackPayments)
      .where(eq(cashbackPayments.prescriberId, prescriberId))
      .orderBy(desc(cashbackPayments.paymentDate));

    const total_cashback_earned = balances.reduce((s, b) => s + parseFloat(b.cashbackAmount), 0);
    const total_deductions = balances.reduce((s, b) => s + parseFloat(b.deductions ?? '0'), 0);
    const total_net_cashback = balances.reduce((s, b) => s + parseFloat(b.netCashback ?? '0'), 0);
    const total_available = balances
      .filter(b => b.status === 'available')
      .reduce((s, b) => s + parseFloat(b.netCashback ?? '0'), 0);
    const total_pending = balances
      .filter(b => b.status === 'pending')
      .reduce((s, b) => s + parseFloat(b.netCashback ?? '0'), 0);
    const total_paid = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
    const balance = parseFloat((total_net_cashback - total_paid).toFixed(2));

    return {
      prescriber_id: prescriberId,
      name: prescriber.name,
      specialty: prescriber.specialty,
      total_cashback_earned: parseFloat(total_cashback_earned.toFixed(2)),
      total_deductions: parseFloat(total_deductions.toFixed(2)),
      total_net_cashback: parseFloat(total_net_cashback.toFixed(2)),
      total_available: parseFloat(total_available.toFixed(2)),
      total_pending: parseFloat(total_pending.toFixed(2)),
      total_paid: parseFloat(total_paid.toFixed(2)),
      balance,
      monthly_breakdown: balances.map(b => ({
        id: b.id,
        month: b.month,
        gross_sales: parseFloat(b.grossSales),
        cashback_percentage: parseFloat(b.cashbackPercentage),
        cashback_amount: parseFloat(b.cashbackAmount),
        deductions: parseFloat(b.deductions ?? '0'),
        net_cashback: parseFloat(b.netCashback ?? '0'),
        status: b.status,
      })),
      payments_history: payments.map(p => ({
        id: p.id,
        amount: parseFloat(p.amount),
        payment_date: p.paymentDate,
        notes: p.notes,
      })),
    };
  }

  async getAllCashbackSummaries(): Promise<Omit<CashbackSummary, 'monthly_breakdown' | 'payments_history'>[]> {
    const cashbackPrescribers = await db
      .select()
      .from(prescribers)
      .where(eq(prescribers.bondType, 'C'));

    const results = [];
    for (const p of cashbackPrescribers) {
      const balances = await db
        .select()
        .from(cashbackBalances)
        .where(eq(cashbackBalances.prescriberId, p.id));

      const payments = await db
        .select()
        .from(cashbackPayments)
        .where(eq(cashbackPayments.prescriberId, p.id));

      const total_cashback_earned = balances.reduce((s, b) => s + parseFloat(b.cashbackAmount), 0);
      const total_deductions = balances.reduce((s, b) => s + parseFloat(b.deductions ?? '0'), 0);
      const total_net_cashback = balances.reduce((s, b) => s + parseFloat(b.netCashback ?? '0'), 0);
      const total_available = balances
        .filter(b => b.status === 'available')
        .reduce((s, b) => s + parseFloat(b.netCashback ?? '0'), 0);
      const total_pending = balances
        .filter(b => b.status === 'pending')
        .reduce((s, b) => s + parseFloat(b.netCashback ?? '0'), 0);
      const total_paid = payments.reduce((s, pmt) => s + parseFloat(pmt.amount), 0);
      const balance = parseFloat((total_net_cashback - total_paid).toFixed(2));

      results.push({
        prescriber_id: p.id,
        name: p.name,
        specialty: p.specialty,
        total_cashback_earned: parseFloat(total_cashback_earned.toFixed(2)),
        total_deductions: parseFloat(total_deductions.toFixed(2)),
        total_net_cashback: parseFloat(total_net_cashback.toFixed(2)),
        total_available: parseFloat(total_available.toFixed(2)),
        total_pending: parseFloat(total_pending.toFixed(2)),
        total_paid: parseFloat(total_paid.toFixed(2)),
        balance,
      });
    }
    return results;
  }

  async createCashbackPayment(
    prescriberId: number,
    amount: number,
    paymentDate: string,
    notes?: string
  ): Promise<CashbackPayment> {
    const result = await db
      .insert(cashbackPayments)
      .values({
        prescriberId,
        amount: amount.toFixed(2),
        paymentDate,
        notes: notes ?? null,
      })
      .returning();
    return result[0];
  }

  async getCashbackAvailableBalance(prescriberId: number): Promise<number> {
    const balances = await db
      .select()
      .from(cashbackBalances)
      .where(eq(cashbackBalances.prescriberId, prescriberId));
    const payments = await db
      .select()
      .from(cashbackPayments)
      .where(eq(cashbackPayments.prescriberId, prescriberId));

    const total_net_cashback = balances.reduce((s, b) => s + parseFloat(b.netCashback ?? '0'), 0);
    const total_paid = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
    return parseFloat((total_net_cashback - total_paid).toFixed(2));
  }

  async deleteCashbackBalance(id: number): Promise<void> {
    await db.delete(cashbackBalances).where(eq(cashbackBalances.id, id));
  }

  async deleteCashbackPayment(id: number): Promise<void> {
    await db.delete(cashbackPayments).where(eq(cashbackPayments.id, id));
  }
}

export const storage = new DatabaseStorage();
