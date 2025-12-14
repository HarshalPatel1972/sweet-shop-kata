import express from "express";
import authRouter from "./routes/auth.router";

const app = express();

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Auth routes
app.use("/api/auth", authRouter);

export default app;
