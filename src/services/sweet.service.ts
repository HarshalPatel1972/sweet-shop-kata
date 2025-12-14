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
