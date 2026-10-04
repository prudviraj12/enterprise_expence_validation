import { randomUUID } from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { type Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { authenticate } from "../middleware/auth.js";
import { analyzeReceipt } from "../services/ai.js";
import { writeAudit } from "../services/audit.js";
import { hashBuffer, saveReceipt } from "../services/storage.js";

export const receiptsRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.MAX_RECEIPT_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    callback(null, ["image/jpeg", "image/png", "application/pdf"].includes(file.mimetype));
  },
});

receiptsRouter.post("/analyze", authenticate, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "A JPG, PNG, or PDF receipt is required." });
      return;
    }
    const result = await analyzeReceipt(req.file.buffer, req.file.mimetype);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

function canManageReceipt(employeeId: string, managerId: string | null, userId: string, roles: Role[]): boolean {
  return employeeId === userId || managerId === userId || roles.includes(Role.FINANCE) || roles.includes(Role.ADMIN);
}

/** Upload, analyze, and persist a receipt against a single expense item. */
receiptsRouter.post("/items/:itemId", authenticate, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "A JPG, PNG, or PDF receipt is required." });
      return;
    }
    const item = await prisma.expenseItem.findUnique({
      where: { id: req.params.itemId },
      include: { claim: { include: { employee: { select: { managerId: true } } } } }
    });
    if (!item) {
      res.status(404).json({ error: "Expense item not found." });
      return;
    }
    if (!canManageReceipt(item.claim.employeeId, item.claim.employee.managerId, req.auth!.userId, req.auth!.roles)) {
      res.status(403).json({ error: "You cannot add a receipt to this expense item." });
      return;
    }
    const count = await prisma.receipt.count({ where: { item: { claimId: item.claimId } } });
    if (count >= config.MAX_RECEIPTS_PER_CLAIM) {
      res.status(409).json({ error: `A claim may contain at most ${config.MAX_RECEIPTS_PER_CLAIM} receipts.` });
      return;
    }

    const analysis = await analyzeReceipt(req.file.buffer, req.file.mimetype);
    const extension = req.file.mimetype === "application/pdf" ? "pdf" : req.file.mimetype === "image/png" ? "png" : "jpg";
    const storageKey = `receipts/${item.claimId}/${randomUUID()}.${extension}`;
    await saveReceipt(storageKey, req.file.buffer, req.file.mimetype);
    const extracted = analysis.extracted;
    const amount = typeof extracted.amount === "string" && /^\d+(\.\d{1,2})?$/.test(extracted.amount) ? extracted.amount : undefined;
    const receiptDate = typeof extracted.date === "string" && !Number.isNaN(Date.parse(extracted.date)) ? new Date(extracted.date) : undefined;
    const receipt = await prisma.receipt.create({
      data: {
        itemId: item.id, storageKey, fileName: req.file.originalname, mimeType: req.file.mimetype,
        fileSize: req.file.size, imageHash: analysis.imageHash || hashBuffer(req.file.buffer),
        merchant: typeof extracted.merchant === "string" ? extracted.merchant : undefined,
        invoiceNumber: typeof extracted.invoiceNumber === "string" ? extracted.invoiceNumber : undefined,
        amount, receiptDate, ocrData: extracted as Prisma.InputJsonValue,
        aiResults: { create: { claimId: item.claimId, ocrConfidence: analysis.ocrConfidence, verificationConfidence: analysis.verificationConfidence, decision: analysis.decision, reason: analysis.reason, recommendation: analysis.recommendation } },
        fraudReports: { create: analysis.flags.map((flag) => ({ claimId: item.claimId, type: flag.type, classification: flag.classification, score: flag.score, details: flag.details as Prisma.InputJsonValue })) }
      },
      include: { aiResults: true, fraudReports: true }
    });
    await writeAudit({ userId: req.auth!.userId, action: "UPLOAD_RECEIPT", entity: "Receipt", entityId: receipt.id, newValue: { itemId: item.id, fileName: receipt.fileName }, ipAddress: req.ip });
    res.status(201).json(receipt);
  } catch (error) { next(error); }
});

/** Preserve the AI original and record an employee's corrected OCR values. */
receiptsRouter.put("/:id/correction", authenticate, async (req, res, next) => {
  try {
    const correctedData = z.record(z.string(), z.unknown()).parse(req.body);
    const receipt = await prisma.receipt.findUnique({ where: { id: req.params.id }, include: { item: { include: { claim: { include: { employee: { select: { managerId: true } } } } } } } });
    if (!receipt) { res.status(404).json({ error: "Receipt not found." }); return; }
    if (!canManageReceipt(receipt.item.claim.employeeId, receipt.item.claim.employee.managerId, req.auth!.userId, req.auth!.roles)) { res.status(403).json({ error: "You cannot edit this receipt." }); return; }
    const updated = await prisma.receipt.update({ where: { id: receipt.id }, data: { correctedData: correctedData as Prisma.InputJsonValue } });
    await writeAudit({ userId: req.auth!.userId, action: "CORRECT_RECEIPT_OCR", entity: "Receipt", entityId: receipt.id, oldValue: receipt.correctedData ?? undefined, newValue: correctedData, ipAddress: req.ip });
    res.json(updated);
  } catch (error) { next(error); }
});
