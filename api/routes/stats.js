import { Router } from "express";
import Contact from "../models/Contact.js";
import CallRecord from "../models/CallRecord.js";
import { connectDB } from "../db.js";

const router = Router();

// GET /api/stats
router.get("/", async (req, res) => {
  try {
    await connectDB();

    const [total, answered, missed, pending] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ status: "Answered" }),
      Contact.countDocuments({ status: "Missed" }),
      Contact.countDocuments({ status: "Pending" }),
    ]);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayCalls = await CallRecord.countDocuments({
      timestamp: { $gte: startOfDay.getTime(), $lte: endOfDay.getTime() },
    });

    const lastCall = await CallRecord.findOne()
      .sort({ timestamp: -1 })
      .select("timestamp name outcome")
      .lean();

    const answerRate = answered + missed > 0
      ? Math.round((answered / (answered + missed)) * 100)
      : 0;

    res.json({
      total,
      answered,
      missed,
      pending,
      todayCalls,
      answerRate,
      lastCallAt: lastCall?.timestamp || null,
      lastCallName: lastCall?.name || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
