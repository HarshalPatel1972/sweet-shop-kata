import { PrismaClient } from "@prisma/client";

// Singleton Prisma instance for all tests
export const prisma = new PrismaClient();

export async function cleanDatabase() {
  await prisma.user.deleteMany({});
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
