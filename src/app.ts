import express from "express";
import authRouter from "./routes/auth.router";
import sweetsRouter from "./routes/sweets.router";
import purchasesRouter from "./routes/purchases.router";
import restocksRouter from "./routes/restocks.router";

const app = express();

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Auth routes
app.use("/api/auth", authRouter);

// Sweets routes (protected)
app.use("/api/sweets", sweetsRouter);

// Purchases routes (protected)
app.use("/api/purchases", purchasesRouter);

// Restocks routes (protected)
app.use("/api/restocks", restocksRouter);

export default app;
