import { Router, Request, Response } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";

const sweetsRouter = Router();

// GET /api/sweets - List all sweets (protected)
sweetsRouter.get("/", authMiddleware, (req: Request, res: Response) => {
  // For now, return empty list
  res.json([]);
});

// DELETE /api/sweets/:id - Delete a sweet (admin only)
sweetsRouter.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  (req: Request, res: Response) => {
    // For now, return 404 (sweet doesn't exist)
    res.status(404).json({ error: "Sweet not found" });
  }
);

export default sweetsRouter;
