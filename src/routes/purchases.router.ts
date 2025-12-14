import { Router } from 'express';
import * as purchaseController from '../controllers/purchase.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// POST /api/purchases - Create a new purchase (protected)
router.post('/', authMiddleware, purchaseController.createPurchase);

// GET /api/purchases - List all purchases (protected)
router.get('/', authMiddleware, purchaseController.getPurchases);

export default router;
