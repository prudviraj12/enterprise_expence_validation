import { Router } from "express";
import multer from "multer";
import { config } from "../config.js";
import { authenticate } from "../middleware/auth.js";
import { analyzeReceipt } from "../services/ai.js";

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
