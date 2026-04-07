import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { csvOrders } from "@shared/schema";
import pkg from "pg";
const { Pool } = pkg;
import {
  insertPrescriberSchema,
  insertPackagingSchema,
  insertFormulaSchema,
  insertCsvOrderSchema,
  insertManualOrderSchema,
  insertReportSchema,
  insertPharmaceuticalFormSchema,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/prescribers", async (req, res) => {
    try {
      const prescribers = await storage.getPrescribers();
      res.json(prescribers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prescribers" });
    }
  });

  app.get("/api/prescribers/:id", async (req, res) => {
    try {
      const prescriber = await storage.getPrescriber(Number(req.params.id));
      if (!prescriber) {
        return res.status(404).json({ error: "Prescriber not found" });
      }
      res.json(prescriber);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prescriber" });
    }
  });

  app.post("/api/prescribers", async (req, res) => {
    try {
      const validated = insertPrescriberSchema.parse(req.body);
      const prescriber = await storage.createPrescriber(validated);
      res.status(201).json(prescriber);
    } catch (error) {
      res.status(400).json({ error: "Invalid prescriber data" });
    }
  });

  app.patch("/api/prescribers/:id", async (req, res) => {
    try {
      const prescriber = await storage.updatePrescriber(Number(req.params.id), req.body);
      if (!prescriber) {
        return res.status(404).json({ error: "Prescriber not found" });
      }
      res.json(prescriber);
    } catch (error) {
      res.status(400).json({ error: "Failed to update prescriber" });
    }
  });

  app.delete("/api/prescribers/:id", async (req, res) => {
    try {
      await storage.deletePrescriber(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete prescriber" });
    }
  });

  app.get("/api/packagings", async (req, res) => {
    try {
      const packagings = await storage.getPackagings();
      res.json(packagings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch packagings" });
    }
  });

  app.post("/api/packagings", async (req, res) => {
    try {
      const validated = insertPackagingSchema.parse(req.body);
      const packaging = await storage.createPackaging(validated);
      res.status(201).json(packaging);
    } catch (error) {
      res.status(400).json({ error: "Invalid packaging data" });
    }
  });

  app.patch("/api/packagings/:id", async (req, res) => {
    try {
      const packaging = await storage.updatePackaging(Number(req.params.id), req.body);
      if (!packaging) {
        return res.status(404).json({ error: "Packaging not found" });
      }
      res.json(packaging);
    } catch (error) {
      res.status(400).json({ error: "Failed to update packaging" });
    }
  });

  app.delete("/api/packagings/:id", async (req, res) => {
    try {
      await storage.deletePackaging(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete packaging" });
    }
  });

  app.get("/api/formulas", async (req, res) => {
    try {
      const formulas = await storage.getFormulas();
      res.json(formulas);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch formulas" });
    }
  });

  app.post("/api/formulas", async (req, res) => {
    try {
      const validated = insertFormulaSchema.parse(req.body);
      const formula = await storage.createFormula(validated);
      res.status(201).json(formula);
    } catch (error) {
      res.status(400).json({ error: "Invalid formula data" });
    }
  });

  app.patch("/api/formulas/:id", async (req, res) => {
    try {
      const formula = await storage.updateFormula(Number(req.params.id), req.body);
      if (!formula) {
        return res.status(404).json({ error: "Formula not found" });
      }
      res.json(formula);
    } catch (error) {
      res.status(400).json({ error: "Failed to update formula" });
    }
  });

  app.delete("/api/formulas/:id", async (req, res) => {
    try {
      await storage.deleteFormula(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete formula" });
    }
  });

  app.get("/api/formulas-with-prescribers", async (req, res) => {
    try {
      const formulas = await storage.getFormulasWithPrescribers();
      res.json(formulas);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch formulas with prescribers" });
    }
  });

  app.get("/api/formulas/:id/prescribers", async (req, res) => {
    try {
      const prescribers = await storage.getFormulaPrescribers(Number(req.params.id));
      res.json(prescribers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch formula prescribers" });
    }
  });

  app.put("/api/formulas/:id/prescribers", async (req, res) => {
    try {
      const { prescriberIds } = req.body;
      await storage.setFormulaPrescribers(Number(req.params.id), prescriberIds || []);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update formula prescribers" });
    }
  });

  app.get("/api/packagings-with-prescribers", async (req, res) => {
    try {
      const packagings = await storage.getPackagingsWithPrescribers();
      res.json(packagings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch packagings with prescribers" });
    }
  });

  app.get("/api/packagings/:id/prescribers", async (req, res) => {
    try {
      const prescribers = await storage.getPackagingPrescribers(Number(req.params.id));
      res.json(prescribers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch packaging prescribers" });
    }
  });

  app.put("/api/packagings/:id/prescribers", async (req, res) => {
    try {
      const { prescriberIds } = req.body;
      await storage.setPackagingPrescribers(Number(req.params.id), prescriberIds || []);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update packaging prescribers" });
    }
  });

  app.get("/api/csv-orders", async (req, res) => {
    try {
      const orders = await storage.getCsvOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch CSV orders" });
    }
  });

  app.post("/api/csv-orders", async (req, res) => {
    try {
      const body = {
        ...req.body,
        orderDate: req.body.orderDate ? new Date(req.body.orderDate) : undefined,
      };
      const validated = insertCsvOrderSchema.parse(body);
      const order = await storage.createCsvOrder(validated);
      res.status(201).json(order);
    } catch (error) {
      console.error("CSV Order validation error:", error);
      res.status(400).json({ error: "Invalid CSV order data" });
    }
  });

  app.delete("/api/csv-orders", async (req, res) => {
    try {
      await storage.deleteAllCsvOrders();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete CSV orders" });
    }
  });

  app.delete("/api/csv-orders/:id", async (req, res) => {
    try {
      await storage.deleteCsvOrder(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete CSV order" });
    }
  });

  app.get("/api/manual-orders", async (req, res) => {
    try {
      const orders = await storage.getManualOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch manual orders" });
    }
  });

  app.get("/api/manual-orders/by-prescriber/:prescriberId/:month/:year", async (req, res) => {
    try {
      const { prescriberId, month, year } = req.params;
      const orders = await storage.getManualOrdersByPrescriberAndMonth(
        Number(prescriberId),
        Number(month),
        Number(year)
      );
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch manual orders by prescriber/month" });
    }
  });

  app.post("/api/manual-orders", async (req, res) => {
    try {
      const body = {
        ...req.body,
        orderDate: req.body.orderDate ? new Date(req.body.orderDate) : undefined,
      };
      const validated = insertManualOrderSchema.parse(body);
      const order = await storage.createManualOrder(validated);
      res.status(201).json(order);
    } catch (error) {
      console.error("Manual Order validation error:", error);
      res.status(400).json({ error: "Invalid manual order data" });
    }
  });

  app.patch("/api/manual-orders/:id", async (req, res) => {
    try {
      const order = await storage.updateManualOrder(Number(req.params.id), req.body);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(400).json({ error: "Failed to update order" });
    }
  });

  app.delete("/api/manual-orders/:id", async (req, res) => {
    try {
      await storage.deleteManualOrder(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const validated = insertReportSchema.parse(req.body);
      const report = await storage.createReport(validated);

      // Auto-calculate cashback for "C" type prescribers
      try {
        const prescriber = await storage.getPrescriber(report.prescriberId);
        if (prescriber && prescriber.bondType === 'C') {
          // referenceMonth is "MM/YYYY" — convert to "YYYY-MM"
          const [mon, year] = report.referenceMonth.split('/');
          const month = `${year}-${mon.padStart(2, '0')}`;
          const startDate = new Date(Number(year), Number(mon) - 1, 1);
          const endDate   = new Date(Number(year), Number(mon), 1);

          const orders = await db
            .select()
            .from(csvOrders)
            .where(
              and(
                sql`LOWER(${csvOrders.prescriberName}) = LOWER(${prescriber.name})`,
                gte(csvOrders.orderDate, startDate),
                lt(csvOrders.orderDate, endDate),
                eq(csvOrders.status, 'Efetivado')
              )
            );

          const grossSales = orders.reduce((s, o) => s + parseFloat(o.netValue), 0);
          const cashbackPercentage = parseFloat(prescriber.commissionPercentage);
          await storage.upsertCashbackBalance(prescriber.id, month, grossSales, cashbackPercentage);
        }
      } catch (cashbackErr) {
        console.error('[cashback] auto-calculate error:', cashbackErr);
      }

      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ error: "Invalid report data" });
    }
  });

  app.delete("/api/reports/:id", async (req, res) => {
    try {
      await storage.deleteReport(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete report" });
    }
  });

  app.get("/api/reports/:id/orders", async (req, res) => {
    try {
      const orders = await storage.getReportOrders(Number(req.params.id));
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch report orders" });
    }
  });

  app.delete("/api/reports/:id/orders", async (req, res) => {
    try {
      const { orderIds } = req.body;

      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: 'Nenhum pedido selecionado' });
      }

      await storage.deleteSelectedReportOrders(Number(req.params.id), orderIds);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete report orders" });
    }
  });

  app.get("/api/pharmaceutical-forms", async (req, res) => {
    try {
      const forms = await storage.getPharmaceuticalForms();
      res.json(forms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pharmaceutical forms" });
    }
  });

  app.post("/api/pharmaceutical-forms", async (req, res) => {
    try {
      const validated = insertPharmaceuticalFormSchema.parse(req.body);
      const form = await storage.createPharmaceuticalForm(validated);
      res.status(201).json(form);
    } catch (error) {
      res.status(400).json({ error: "Invalid pharmaceutical form data" });
    }
  });

  await storage.initializeDefaultSettings();

  // ── Cashback endpoints ────────────────────────────────────────────────────
  // GET /api/cashback/all — must be registered BEFORE /:prescriberId
  app.get("/api/cashback/all", async (req, res) => {
    try {
      const summaries = await storage.getAllCashbackSummaries();
      res.json(summaries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cashback summaries" });
    }
  });

  app.get("/api/cashback/:prescriberId", async (req, res) => {
    try {
      const prescriberId = Number(req.params.prescriberId);
      if (isNaN(prescriberId)) return res.status(400).json({ error: "prescriberId inválido" });
      const summary = await storage.getCashbackSummary(prescriberId);
      res.json(summary);
    } catch (error: any) {
      if (error?.message?.includes('não encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to fetch cashback summary" });
    }
  });

  app.post("/api/cashback/calculate", async (req, res) => {
    try {
      const { prescriber_id, month } = req.body;
      if (!prescriber_id || !month) {
        return res.status(400).json({ error: "prescriber_id e month são obrigatórios" });
      }
      const prescriber = await storage.getPrescriber(Number(prescriber_id));
      if (!prescriber) return res.status(404).json({ error: "Prescritor não encontrado" });
      if (prescriber.bondType !== 'C') {
        return res.status(400).json({ error: "Prescritor não é do tipo Cashback" });
      }

      // month must be "YYYY-MM"
      const [year, mon] = month.split('-').map(Number);
      const startDate = new Date(year, mon - 1, 1);
      const endDate = new Date(year, mon, 1);

      const orders = await db
        .select()
        .from(csvOrders)
        .where(
          and(
            sql`LOWER(${csvOrders.prescriberName}) = LOWER(${prescriber.name})`,
            gte(csvOrders.orderDate, startDate),
            lt(csvOrders.orderDate, endDate),
            eq(csvOrders.status, 'Efetivado')
          )
        );

      const grossSales = orders.reduce((s, o) => s + parseFloat(o.netValue), 0);
      const cashbackPercentage = parseFloat(prescriber.commissionPercentage);
      const balance = await storage.upsertCashbackBalance(
        prescriber.id, month, grossSales, cashbackPercentage
      );
      res.json(balance);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate cashback" });
    }
  });

  app.post("/api/cashback/calculate-from-report", async (req, res) => {
    try {
      // Expects: { entries: [{ prescriberName, month, grossSales }] }
      // or: { prescriberId, month, grossSales }
      const { entries } = req.body as {
        entries: { prescriberName: string; month: string; grossSales: number }[];
      };

      if (!Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ error: "entries é obrigatório e deve ser um array" });
      }

      const allPrescribers = await storage.getPrescribers();
      const cashbackPrescribers = allPrescribers.filter(p => p.bondType === 'C');

      const results: any[] = [];
      for (const entry of entries) {
        const prescriber = cashbackPrescribers.find(
          p => p.name.toLowerCase() === entry.prescriberName.toLowerCase()
        );
        if (!prescriber) continue;

        const cashbackPercentage = parseFloat(prescriber.commissionPercentage);
        const balance = await storage.upsertCashbackBalance(
          prescriber.id, entry.month, entry.grossSales, cashbackPercentage
        );
        results.push({ prescriberName: prescriber.name, ...balance });
      }
      res.json({ processed: results.length, results });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate cashback from report" });
    }
  });

  app.post("/api/cashback/payments", async (req, res) => {
    try {
      const { prescriber_id, amount, payment_date, notes } = req.body;
      if (!prescriber_id || !amount || !payment_date) {
        return res.status(400).json({ error: "prescriber_id, amount e payment_date são obrigatórios" });
      }
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ error: "amount deve ser um número positivo" });
      }

      const availableBalance = await storage.getCashbackAvailableBalance(Number(prescriber_id));
      if (amountNum > availableBalance + 0.001) {
        return res.status(400).json({
          error: `Saldo insuficiente. Disponível: R$ ${availableBalance.toFixed(2)}, solicitado: R$ ${amountNum.toFixed(2)}`
        });
      }

      const payment = await storage.createCashbackPayment(
        Number(prescriber_id), amountNum, payment_date, notes
      );
      res.status(201).json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to register cashback payment" });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const allSettings = await storage.getSettings();
      const result: Record<string, boolean> = {};
      allSettings.forEach(s => {
        if (s.settingKey.endsWith('_protected')) {
          result[s.settingKey] = s.settingValue === 'true';
        }
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.get("/api/settings/all", async (req, res) => {
    try {
      const allSettings = await storage.getSettings();
      const result: Record<string, string> = {};
      allSettings.forEach(s => {
        if (!s.settingKey.endsWith('_password')) {
          result[s.settingKey] = s.settingValue;
        }
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const { settings: newSettings, currentPassword } = req.body;
      
      const isValid = await storage.verifyPassword('config', currentPassword);
      if (!isValid) {
        return res.status(401).json({ error: 'Senha incorreta' });
      }
      
      for (const [key, value] of Object.entries(newSettings)) {
        if (key.endsWith('_password') && value) {
          await storage.updatePassword(key.replace('_password', ''), String(value));
        } else if (!key.endsWith('_password')) {
          await storage.upsertSetting(key, String(value));
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.post("/api/settings/verify", async (req, res) => {
    try {
      const { area, password } = req.body;
      
      const protectedSetting = await storage.getSetting(`${area}_protected`);
      if (protectedSetting?.settingValue !== 'true') {
        return res.json({ valid: true });
      }
      
      const isValid = await storage.verifyPassword(area, password);
      
      if (isValid) {
        res.json({ valid: true });
      } else {
        res.status(401).json({ valid: false, error: 'Senha incorreta' });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to verify password" });
    }
  });

  app.get("/api/settings/is-protected/:area", async (req, res) => {
    try {
      const { area } = req.params;
      const protectedSetting = await storage.getSetting(`${area}_protected`);
      res.json({ isProtected: protectedSetting?.settingValue === 'true' });
    } catch (error) {
      res.status(500).json({ error: "Failed to check protection status" });
    }
  });

  // ── Sync Production → Development (development only) ────────────────────────
  app.post("/api/admin/sync-database", async (req, res) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({ error: "Only available in development environment" });
    }

    const PROD_URL = process.env.PROD_DATABASE_URL;
    const DEV_URL  = process.env.DATABASE_URL;

    if (!PROD_URL) {
      return res.status(400).json({ error: "PROD_DATABASE_URL não está definida. Configure o secret antes de sincronizar." });
    }
    if (PROD_URL === DEV_URL) {
      return res.status(400).json({ error: "PROD_DATABASE_URL e DATABASE_URL são idênticas. Sincronização abortada." });
    }

    const prod = new Pool({ connectionString: PROD_URL, ssl: { rejectUnauthorized: false } });
    const dev  = new Pool({ connectionString: DEV_URL,  ssl: { rejectUnauthorized: false } });

    function sanitizeJsonValue(value: any): any {
      if (value === null || value === undefined) return null;
      if (typeof value === "object") {
        try { return JSON.stringify(value); } catch { return null; }
      }
      if (typeof value === "string") {
        const t = value.trim();
        if (t === "" || t === "null") return null;
        try { JSON.parse(t); return t; } catch { return null; }
      }
      return value;
    }

    let prodClient: any, devClient: any;
    const errors: string[] = [];
    let totalTables  = 0;
    let totalRecords = 0;

    try {
      prodClient = await prod.connect();
      devClient  = await dev.connect();

      // Ensure cashback tables exist in production (they may not have been migrated there yet)
      await prodClient.query(`
        CREATE TABLE IF NOT EXISTS cashback_balances (
          id SERIAL PRIMARY KEY,
          prescriber_id INTEGER NOT NULL REFERENCES prescribers(id) ON DELETE CASCADE,
          month TEXT NOT NULL,
          gross_sales DECIMAL(10,2) NOT NULL DEFAULT '0',
          cashback_percentage DECIMAL(5,2) NOT NULL DEFAULT '0',
          cashback_amount DECIMAL(10,2) NOT NULL DEFAULT '0',
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      await prodClient.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS cashback_balances_prescriber_month_idx
        ON cashback_balances(prescriber_id, month)
      `);
      await prodClient.query(`
        CREATE TABLE IF NOT EXISTS cashback_payments (
          id SERIAL PRIMARY KEY,
          prescriber_id INTEGER NOT NULL REFERENCES prescribers(id) ON DELETE CASCADE,
          amount DECIMAL(10,2) NOT NULL,
          payment_date TEXT NOT NULL,
          notes TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      // List all tables from production
      const tablesRes = await prodClient.query(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
      );
      const tables: string[] = tablesRes.rows.map((r: any) => r.tablename);

      // Phase 1: truncate all at once to avoid cascade side-effects
      const tableList = tables.map((t: string) => `"${t}"`).join(", ");
      await devClient.query(`TRUNCATE ${tableList} RESTART IDENTITY CASCADE`);

      // Phase 2: disable FK checks on inserts, then copy each table
      await devClient.query("SET session_replication_role = 'replica'");

      for (const table of tables) {
        try {
          // Get column metadata
          const colRes = await prodClient.query(
            `SELECT column_name, data_type, udt_name
             FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = $1
             ORDER BY ordinal_position`,
            [table]
          );
          const colMeta: { name: string; isJson: boolean }[] = colRes.rows.map((r: any) => ({
            name:   r.column_name,
            isJson: ["json","jsonb"].includes(r.data_type) || ["json","jsonb"].includes(r.udt_name),
          }));
          if (colMeta.length === 0) continue;

          const { rows } = await prodClient.query(`SELECT * FROM "${table}"`);
          if (rows.length === 0) { totalTables++; continue; }

          const cols       = colMeta.map((c) => c.name);
          const quotedCols = cols.map((c) => `"${c}"`).join(", ");
          const BATCH      = 500;

          for (let i = 0; i < rows.length; i += BATCH) {
            const batch = rows.slice(i, i + BATCH);
            const placeholders = batch
              .map((_: any, ri: number) =>
                `(${cols.map((_: any, ci: number) => `$${ri * cols.length + ci + 1}`).join(", ")})`
              ).join(", ");
            const values = batch.flatMap((row: any) =>
              colMeta.map((col) => col.isJson ? sanitizeJsonValue(row[col.name]) : row[col.name])
            );
            await devClient.query(
              `INSERT INTO "${table}" (${quotedCols}) VALUES ${placeholders}`,
              values
            );
          }

          totalRecords += rows.length;
          totalTables++;
        } catch (err: any) {
          errors.push(`${table}: ${err.message}`);
        }
      }

      await devClient.query("SET session_replication_role = 'origin'");

      // Reset sequences
      const seqRes = await devClient.query(
        `SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'`
      );
      for (const { sequence_name } of seqRes.rows) {
        const tableName = sequence_name.replace(/_id_seq$/, "");
        try {
          await devClient.query(
            `SELECT setval('${sequence_name}', COALESCE((SELECT MAX(id) FROM "${tableName}"), 1))`
          );
        } catch { /* ignore */ }
      }

      res.json({ success: true, totalTables, totalRecords, errors });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message, errors });
    } finally {
      prodClient?.release();
      devClient?.release();
      await prod.end().catch(() => {});
      await dev.end().catch(() => {});
    }
  });

  return httpServer;
}
