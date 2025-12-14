import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";
import * as restockController from "../controllers/restock.controller";

const restocksRouter = Router();

// POST /api/restocks - Create a new restock (admin only)
restocksRouter.post(
  "/",
  authMiddleware,
  adminMiddleware,
  restockController.createRestock
);

// GET /api/restocks - List all restocks (protected)
restocksRouter.get("/", authMiddleware, restockController.getRestocks);

export default restocksRouter;
