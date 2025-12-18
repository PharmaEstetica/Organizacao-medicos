import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertPrescriberSchema,
  insertPackagingSchema,
  insertFormulaSchema,
  insertOrderSchema,
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

  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validated = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validated);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ error: "Invalid order data" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      await storage.deleteOrder(Number(req.params.id));
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

  return httpServer;
}
