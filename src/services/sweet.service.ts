import { prisma } from "../prisma/client";

export interface CreateSweetInput {
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

export interface UpdateSweetInput {
  name?: string;
  price?: number;
  quantity?: number;
  description?: string;
}

/**
 * Create a new sweet in the database
 * @throws Error if sweet with same name already exists
 */
export async function createSweet(data: CreateSweetInput) {
  try {
    return await prisma.sweet.create({
      data: {
        name: data.name,
        price: data.price,
        quantity: data.quantity,
        description: data.description,
      },
    });
  } catch (error: any) {
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      throw new Error("Sweet with this name already exists");
    }
    throw error;
  }
}

/**
 * Get all sweets with optional filtering
 */
export async function getAllSweets() {
  return await prisma.sweet.findMany();
}

/**
 * Get a sweet by ID
 */
export async function getSweetById(id: number) {
  return await prisma.sweet.findUnique({
    where: { id },
  });
}

/**
 * Update a sweet by ID
 */
export async function updateSweet(id: number, data: UpdateSweetInput) {
  try {
    return await prisma.sweet.update({
      where: { id },
      data,
    });
  } catch (error: any) {
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      throw new Error("Sweet with this name already exists");
    }
    if (error.code === "P2025") {
      throw new Error("Sweet not found");
    }
    throw error;
  }
}

/**
 * Delete a sweet by ID
 */
export async function deleteSweet(id: number) {
  try {
    return await prisma.sweet.delete({
      where: { id },
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      throw new Error("Sweet not found");
    }
    throw error;
  }
}

export interface SearchSweetsInput {
  name?: string;
  minPrice?: number;
  maxPrice?: number;
  minQty?: number;
  maxQty?: number;
}

/**
 * Search and filter sweets based on criteria
 * @param filters - Search filters for name, price range, and quantity range
 */
export async function searchSweets(filters: SearchSweetsInput) {
  const where: any = {};

  // For numeric filters only initially
  // Add price range filter
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) {
      where.price.gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      where.price.lte = filters.maxPrice;
    }
  }

  // Add quantity range filter
  if (filters.minQty !== undefined || filters.maxQty !== undefined) {
    where.quantity = {};
    if (filters.minQty !== undefined) {
      where.quantity.gte = filters.minQty;
    }
    if (filters.maxQty !== undefined) {
      where.quantity.lte = filters.maxQty;
    }
  }

  // Get all results matching numeric filters
  const results = await prisma.sweet.findMany({
    where,
  });

  // Apply case-insensitive name filtering in JavaScript
  // (SQLite doesn't support case-insensitive mode in Prisma)
  if (filters.name) {
    const nameLower = filters.name.toLowerCase();
    return results.filter(sweet =>
      sweet.name.toLowerCase().includes(nameLower)
    );
  }

  return results;
}
