import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { normalizeSku } from "../src/lib/validation";

const prisma = new PrismaClient();

async function main() {
  const pwd = await bcrypt.hash("Passw0rd!", 10);
  await prisma.user.upsert({ where: { email: "admin@example.com" }, update: {}, create: { email: "admin@example.com", name: "Admin", role: Role.ADMIN, passwordHash: pwd } });
  await prisma.user.upsert({ where: { email: "editor@example.com" }, update: {}, create: { email: "editor@example.com", name: "Editor", role: Role.EDITOR, passwordHash: pwd } });
  await prisma.user.upsert({ where: { email: "viewer@example.com" }, update: {}, create: { email: "viewer@example.com", name: "Viewer", role: Role.VIEWER, passwordHash: pwd } });

  const sample = [
    { sku: "SKU-001", name: "Urban Shell", color: "Black", fabric: "Nylon", lining: "Poly", stock: 10, weightKg: 0.8, waterproof: true, eco: true },
    { sku: "SKU-002", name: "Daily Tote", color: "Beige", fabric: "Canvas", lining: "Cotton", stock: 0, weightKg: 0.4, waterproof: false, eco: true }
  ];

  for (const item of sample) {
    await prisma.product.upsert({
      where: { skuNormalized: normalizeSku(item.sku) },
      update: {},
      create: { ...item, skuNormalized: normalizeSku(item.sku) }
    });
  }
}

main().finally(() => prisma.$disconnect());
