import { PrismaClient } from '@prisma/client';

// Prisma 客户端单例（仅在 STORE=prisma 时使用）
let prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}
