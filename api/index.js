import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import contactsRouter from "./routes/contacts.js";
import historyRouter from "./routes/history.js";
import statsRouter from "./routes/stats.js";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

// Health check — includes MongoDB connection status
app.get("/api/status", async (req, res) => {
  const mongoState = mongoose.connection.readyState; // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  res.json({
    mongo: mongoState === 1 ? "connected" : mongoState === 2 ? "connecting" : "disconnected",
    online: mongoState === 1,
    timestamp: Date.now(),
  });
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
