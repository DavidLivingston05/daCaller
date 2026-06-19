import { Router } from "express";
import Contact from "../models/Contact.js";
import { connectDB } from "../db.js";

const router = Router();

// POST /api/contacts/sync — full sync (upsert by phone + delete missing)
router.post("/sync", async (req, res) => {
  try {
    await connectDB();
    const { contacts } = req.body;
    if (!Array.isArray(contacts)) {
      return res.status(400).json({ error: "contacts must be an array" });
    }

    const incomingPhones = new Set();
    const operations = contacts.map((c) => {
      const core = c.phone?.replace(/[^0-9]/g, "").slice(-10);
      if (core) incomingPhones.add(core);
      return {
        updateOne: {
          filter: { phoneCore: core },
          update: { $set: { ...c, phoneCore: core, updatedAt: new Date() } },
          upsert: true,
        },
      };
    });

    if (operations.length > 0) {
      await Contact.bulkWrite(operations);
    }

    // Remove contacts not in incoming list
    if (incomingPhones.size > 0) {
      await Contact.deleteMany({ phoneCore: { $nin: Array.from(incomingPhones) } });
    }

    const synced = await Contact.find({}).sort({ status: 1, name: 1 }).lean();
    res.json({ contacts: synced, total: synced.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contacts — list all with optional filters
router.get("/", async (req, res) => {
  try {
    await connectDB();
    const { status, search, sort, group } = req.query;
    let filter = {};

    if (status && status !== "All") filter.status = status;
    if (group) filter.group = group;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    let sortOption = {};
    if (sort === "Name") sortOption = { name: 1 };
    else if (sort === "Recent") sortOption = { createdAt: -1 };
    else sortOption = { status: 1, name: 1 };

    const contacts = await Contact.find(filter).sort(sortOption).lean();
    res.json({ contacts, total: contacts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contacts — create one or bulk
router.post("/", async (req, res) => {
  try {
    await connectDB();
    const body = req.body;

    if (Array.isArray(body)) {
      const contacts = await Contact.insertMany(body, { ordered: false });
      return res.status(201).json({ contacts, total: contacts.length });
    }

    const contact = await Contact.create(body);
    res.status(201).json({ contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contacts/:id
router.get("/:id", async (req, res) => {
  try {
    await connectDB();
    const contact = await Contact.findById(req.params.id).lean();
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    res.json({ contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/contacts/:id
router.put("/:id", async (req, res) => {
  try {
    await connectDB();
    const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    res.json({ contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/contacts/:id
router.delete("/:id", async (req, res) => {
  try {
    await connectDB();
    const contact = await Contact.findByIdAndDelete(req.params.id).lean();
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/contacts — bulk delete
router.delete("/", async (req, res) => {
  try {
    await connectDB();
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: "ids must be an array" });
    }
    await Contact.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, deleted: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contacts/dedup — deduplicate by phone
router.post("/dedup", async (req, res) => {
  try {
    await connectDB();
    const pipeline = [
      { $group: { _id: "$phone", ids: { $push: "$_id" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ];
    const duplicates = await Contact.aggregate(pipeline);
    let removed = 0;
    for (const dup of duplicates) {
      const [keep, ...rest] = dup.ids;
      await Contact.deleteMany({ _id: { $in: rest } });
      removed += rest.length;
    }
    res.json({ success: true, removed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contacts/reset — reset all to Pending
router.post("/reset", async (req, res) => {
  try {
    await connectDB();
    const result = await Contact.updateMany(
      { status: { $ne: "Pending" } },
      { $set: { status: "Pending", lastCalledAt: null } }
    );
    res.json({ success: true, modified: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
