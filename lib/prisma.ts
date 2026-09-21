import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function buildClient(): PrismaClient {
  const log: Array<"error" | "warn"> = process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl) {
    const adapter = new PrismaLibSQL({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN });
    return new PrismaClient({ adapter, log });
  }
  return new PrismaClient({ log });
}

export const prisma = globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
