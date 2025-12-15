import { PrismaClient } from "@prisma/client";

// Singleton Prisma instance for all tests
export const prisma = new PrismaClient();

export async function cleanDatabase() {
  // Disable foreign key constraints temporarily if needed
  // For SQLite, we need to delete in correct order (dependents before parents)
  try {
    await prisma.restock.deleteMany({});
    await prisma.purchase.deleteMany({});
    await prisma.sweet.deleteMany({});
    await prisma.user.deleteMany({});
  } catch (error) {
    // If there's a constraint error, it's likely from a previous test
    // Try again with same order
    await prisma.restock.deleteMany({});
    await prisma.purchase.deleteMany({});
    await prisma.sweet.deleteMany({});
    await prisma.user.deleteMany({});
  }
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
