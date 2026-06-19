import { Router } from "express";
import CallRecord from "../models/CallRecord.js";
import { connectDB } from "../db.js";

const router = Router();

// GET /api/history — list with pagination
router.get("/", async (req, res) => {
  try {
    await connectDB();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      CallRecord.find().sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      CallRecord.countDocuments(),
    ]);

    res.json({ records, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/history — create a record
router.post("/", async (req, res) => {
  try {
    await connectDB();
    const record = await CallRecord.create(req.body);
    res.status(201).json({ record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/today — today's calls
router.get("/today", async (req, res) => {
  try {
    await connectDB();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const records = await CallRecord.find({
      timestamp: { $gte: startOfDay.getTime(), $lte: endOfDay.getTime() },
    }).sort({ timestamp: -1 }).lean();

    res.json({ records, total: records.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
