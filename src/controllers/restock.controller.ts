import { Request, Response } from "express";
import * as restockService from "../services/restock.service";

/**
 * Create a new restock (admin only)
 */
export async function createRestock(req: Request, res: Response): Promise<void> {
  try {
    const { sweetId, quantity, restockDate, notes } = req.body;

    // Validate required fields
    if (sweetId === undefined || quantity === undefined || !restockDate) {
      res.status(400).json({
        error: "Missing required fields: sweetId, quantity, restockDate",
      });
      return;
    }

    // Validate data types
    if (
      typeof sweetId !== "number" ||
      typeof quantity !== "number" ||
      typeof restockDate !== "string"
    ) {
      res.status(400).json({ error: "Invalid data types" });
      return;
    }

    // Validate quantity is positive
    if (quantity <= 0) {
      res.status(400).json({
        error: "Quantity must be a positive number",
      });
      return;
    }

    const restock = await restockService.createRestock({
      sweetId,
      quantity,
      restockDate,
      notes,
    });

    res.status(201).json(restock);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to create restock" });
    }
  }
}

/**
 * Get all restocks with optional filtering
 */
export async function getRestocks(req: Request, res: Response): Promise<void> {
  try {
    const { sweetId } = req.query;

    const filters: any = {};
    if (sweetId !== undefined) {
      const parsedSweetId = Number(sweetId);
      if (isNaN(parsedSweetId)) {
        res.status(400).json({ error: "sweetId must be a number" });
        return;
      }
      filters.sweetId = parsedSweetId;
    }

    const restocks = await restockService.getAllRestocks(filters);
    res.status(200).json(restocks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch restocks" });
  }
}
