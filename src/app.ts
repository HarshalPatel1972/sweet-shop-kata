import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.router";
import sweetsRouter from "./routes/sweets.router";
import purchasesRouter from "./routes/purchases.router";
import restocksRouter from "./routes/restocks.router";

const app = express();

app.use(express.json());

// CORS configuration
app.use(
  cors({
    origin: [
      "https://sweet-shop-frontend-three.vercel.app",
      "https://sweet-shop-frontend-0.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

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
