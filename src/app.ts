import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.router";
import sweetsRouter from "./routes/sweets.router";
import purchasesRouter from "./routes/purchases.router";
import restocksRouter from "./routes/restocks.router";

const app = express();

app.use(express.json());

// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://sweet-shop-frontend-three.vercel.app",
  "https://sweet-shop-frontend-0.vercel.app",
];

// CORS configuration with dynamic origin checking
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman or mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
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
