import express from "express";
import cors from "cors";
import contactsRouter from "./routes/contacts.js";
import historyRouter from "./routes/history.js";
import statsRouter from "./routes/stats.js";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
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
