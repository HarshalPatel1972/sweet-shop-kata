import { Request, Response } from 'express';
import * as purchaseService from '../services/purchase.service';

/**
 * POST /api/purchases
 * Creates a new purchase with validation
 */
export async function createPurchase(req: Request, res: Response) {
  try {
    const { sweetId, quantity, customerName } = req.body;

    // Validation
    if (sweetId === undefined || sweetId === null) {
      return res.status(400).json({ message: 'sweetId is required' });
    }

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ message: 'quantity is required' });
    }

    if (!customerName) {
      return res.status(400).json({ message: 'customerName is required' });
    }

    if (typeof sweetId !== 'number' || !Number.isInteger(sweetId) || sweetId <= 0) {
      return res.status(400).json({ message: 'sweetId must be a positive integer' });
    }

    if (
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({ message: 'quantity must be a positive integer' });
    }

    if (typeof customerName !== 'string' || customerName.trim().length === 0) {
      return res.status(400).json({ message: 'customerName must be a non-empty string' });
    }

    const purchase = await purchaseService.createPurchase({
      sweetId,
      quantity,
      customerName: customerName.trim(),
    });

    return res.status(201).json(purchase);
  } catch (error: any) {
    if (error.code === 'SWEET_NOT_FOUND') {
      return res.status(404).json({ message: 'Sweet not found' });
    }

    if (error.code === 'INSUFFICIENT_QUANTITY') {
      return res.status(400).json({ message: error.message });
    }

    console.error('Error creating purchase:', error);
    return res.status(500).json({ message: 'Failed to create purchase' });
  }
}

/**
 * GET /api/purchases
 * Returns all purchases
 */
export async function getPurchases(req: Request, res: Response) {
  try {
    const purchases = await purchaseService.getAllPurchases();
    return res.status(200).json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return res.status(500).json({ message: 'Failed to fetch purchases' });
  }
}
