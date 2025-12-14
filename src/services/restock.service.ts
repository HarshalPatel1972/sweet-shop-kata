import { prisma } from "../prisma/client";

export interface CreateRestockInput {
  sweetId: number;
  quantity: number;
  restockDate: string;
  notes?: string;
}

export interface ListRestocksFilters {
  sweetId?: number;
}

/**
 * Create a new restock and increase sweet quantity
 * @throws Error if sweet not found
 */
export async function createRestock(data: CreateRestockInput) {
  try {
    // Verify sweet exists
    const sweet = await prisma.sweet.findUnique({
      where: { id: data.sweetId },
    });

    if (!sweet) {
      throw new Error("SWEET_NOT_FOUND");
    }

    // Create restock record
    const restock = await prisma.restock.create({
      data: {
        sweetId: data.sweetId,
        quantity: data.quantity,
        restockDate: data.restockDate,
        notes: data.notes,
      },
    });

    // Update sweet quantity
    await prisma.sweet.update({
      where: { id: data.sweetId },
      data: {
        quantity: {
          increment: data.quantity,
        },
      },
    });

    return restock;
  } catch (error: any) {
    if (error.message === "SWEET_NOT_FOUND") {
      throw new Error("Sweet not found");
    }
    throw error;
  }
}

/**
 * Get all restocks with optional filtering
 */
export async function getAllRestocks(filters?: ListRestocksFilters) {
  const where: any = {};

  if (filters?.sweetId !== undefined) {
    where.sweetId = filters.sweetId;
  }

  return await prisma.restock.findMany({
    where,
    orderBy: {
      restockDate: "desc",
    },
  });
}
