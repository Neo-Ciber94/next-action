import { PrismaClient } from "@prisma/client";

function getPrismaClient() {
  const globalThisWithPrisma = globalThis as { __prisma?: PrismaClient };

  if (!globalThisWithPrisma.__prisma) {
    globalThisWithPrisma.__prisma = new PrismaClient();
  }

  return globalThisWithPrisma.__prisma;
}

export const prisma = getPrismaClient();
