import { Router, Request, Response } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";
import * as sweetController from "../controllers/sweet.controller";

const sweetsRouter = Router();

// POST /api/sweets - Create a new sweet (admin only)
sweetsRouter.post(
  "/",
  authMiddleware,
  adminMiddleware,
  sweetController.createSweet
);

// GET /api/sweets - List all sweets (protected)
sweetsRouter.get("/", authMiddleware, sweetController.getSweets);

// GET /api/sweets/:id - Get a specific sweet (protected)
sweetsRouter.get("/:id", authMiddleware, sweetController.getSweetById);

// PUT /api/sweets/:id - Update a sweet (admin only)
sweetsRouter.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  sweetController.updateSweet
);

// DELETE /api/sweets/:id - Delete a sweet (admin only)
sweetsRouter.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  sweetController.deleteSweet
);

export default sweetsRouter;
