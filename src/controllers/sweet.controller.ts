import { Request, Response } from "express";
import * as sweetService from "../services/sweet.service";

/**
 * Create a new sweet (admin only)
 */
export async function createSweet(req: Request, res: Response): Promise<void> {
  try {
    const { name, price, quantity, description } = req.body;

    // Validate required fields
    if (!name || price === undefined || quantity === undefined) {
      res.status(400).json({
        error: "Missing required fields: name, price, quantity",
      });
      return;
    }

    // Validate data types
    if (
      typeof name !== "string" ||
      typeof price !== "number" ||
      typeof quantity !== "number"
    ) {
      res.status(400).json({ error: "Invalid data types" });
      return;
    }

    // Validate price and quantity are positive
    if (price < 0 || quantity < 0) {
      res.status(400).json({
        error: "Price and quantity must be non-negative",
      });
      return;
    }

    const sweet = await sweetService.createSweet({
      name,
      price,
      quantity,
      description,
    });

    res.status(201).json(sweet);
  } catch (error: any) {
    if (error.message.includes("already exists")) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to create sweet" });
    }
  }
}

/**
 * Get all sweets
 */
export async function getSweets(req: Request, res: Response): Promise<void> {
  try {
    const sweets = await sweetService.getAllSweets();
    res.status(200).json(sweets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sweets" });
  }
}

/**
 * Get a sweet by ID
 */
export async function getSweetById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const sweet = await sweetService.getSweetById(parseInt(id));

    if (!sweet) {
      res.status(404).json({ error: "Sweet not found" });
      return;
    }

    res.status(200).json(sweet);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sweet" });
  }
}

/**
 * Update a sweet by ID (admin only)
 */
export async function updateSweet(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, price, quantity, description } = req.body;

    // Validate at least one field is provided
    if (
      !name &&
      price === undefined &&
      quantity === undefined &&
      !description
    ) {
      res.status(400).json({
        error: "At least one field must be provided for update",
      });
      return;
    }

    // Validate data types if provided
    if (name && typeof name !== "string") {
      res.status(400).json({ error: "Invalid name type" });
      return;
    }

    if (price !== undefined && typeof price !== "number") {
      res.status(400).json({ error: "Invalid price type" });
      return;
    }

    if (quantity !== undefined && typeof quantity !== "number") {
      res.status(400).json({ error: "Invalid quantity type" });
      return;
    }

    const sweet = await sweetService.updateSweet(parseInt(id), {
      name,
      price,
      quantity,
      description,
    });

    res.status(200).json(sweet);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes("already exists")) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to update sweet" });
    }
  }
}

/**
 * Delete a sweet by ID (admin only)
 */
export async function deleteSweet(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await sweetService.deleteSweet(parseInt(id));
    res.status(204).send();
  } catch (error: any) {
    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to delete sweet" });
    }
  }
}
