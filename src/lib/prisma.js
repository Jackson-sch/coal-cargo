import { PrismaClient } from "../../prisma/src/generated/prisma/client/index.js";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;

  // Graceful shutdown para desarrollo
  process.on("beforeExit", async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {}
  });

  process.on("SIGINT", async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {}
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {}
    process.exit(0);
  });
}
