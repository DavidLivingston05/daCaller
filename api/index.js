import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import contactsRouter from "./routes/contacts.js";
import historyRouter from "./routes/history.js";
import statsRouter from "./routes/stats.js";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

// Status — actually tries connecting to MongoDB
app.get("/api/status", async (req, res) => {
  try {
    await connectDB();
    res.json({ mongo: "connected", online: true, timestamp: Date.now() });
  } catch (e) {
    res.json({
      mongo: "disconnected",
      online: false,
      error: e.message || "Unknown connection error",
      timestamp: Date.now(),
    });
  }
});

// Routes
app.use("/api/contacts", contactsRouter);
app.use("/api/history", historyRouter);
app.use("/api/stats", statsRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal server error" });
});

export default app;
