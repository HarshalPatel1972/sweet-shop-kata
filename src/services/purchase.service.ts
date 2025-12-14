import { prisma } from '../prisma/client';

export interface CreatePurchaseInput {
  sweetId: number;
  quantity: number;
  customerName: string;
}

/**
 * Creates a new purchase for a sweet and decreases its quantity
 * @throws Error if sweet not found or insufficient quantity
 */
export async function createPurchase(data: CreatePurchaseInput) {
  const sweet = await prisma.sweet.findUnique({
    where: { id: data.sweetId },
  });

  if (!sweet) {
    const error = new Error('Sweet not found');
    (error as any).code = 'SWEET_NOT_FOUND';
    throw error;
  }

  if (sweet.quantity < data.quantity) {
    const error = new Error(
      `insufficient quantity available. Available: ${sweet.quantity}, Requested: ${data.quantity}`
    );
    (error as any).code = 'INSUFFICIENT_QUANTITY';
    throw error;
  }

  const totalPrice = sweet.price * data.quantity;

  // Create purchase and update sweet quantity in a transaction
  const purchase = await prisma.purchase.create({
    data: {
      sweetId: data.sweetId,
      quantity: data.quantity,
      customerName: data.customerName,
      totalPrice,
    },
  });

  // Update sweet quantity
  await prisma.sweet.update({
    where: { id: data.sweetId },
    data: {
      quantity: {
        decrement: data.quantity,
      },
    },
  });

  return purchase;
}

/**
 * Retrieves all purchases sorted by creation date (newest first)
 */
export async function getAllPurchases() {
  return prisma.purchase.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      sweet: true,
    },
  });
}
