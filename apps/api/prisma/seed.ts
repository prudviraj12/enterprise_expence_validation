import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertUser(input: { name: string; email: string; password: string; role: Role; departmentId?: string; managerId?: string }) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  return prisma.user.upsert({
    where: { email: input.email },
    update: { name: input.name, passwordHash, departmentId: input.departmentId, managerId: input.managerId, roles: { deleteMany: {}, create: [{ role: input.role }] } },
    create: { name: input.name, email: input.email, passwordHash, departmentId: input.departmentId, managerId: input.managerId, roles: { create: [{ role: input.role }] } }
  });
}

async function main() {
  const sales = await prisma.department.upsert({ where: { name: "Sales" }, update: { costCenter: "CC-101" }, create: { name: "Sales", costCenter: "CC-101" } });
  const financeDepartment = await prisma.department.upsert({ where: { name: "Finance" }, update: { costCenter: "CC-201" }, create: { name: "Finance", costCenter: "CC-201" } });
  const manager = await upsertUser({ name: "Arjun Mehta", email: "manager@ledgerly.in", password: "Manager@123", role: Role.MANAGER, departmentId: sales.id });
  await upsertUser({ name: "Riya Sharma", email: "employee@ledgerly.in", password: "Employee@123", role: Role.EMPLOYEE, departmentId: sales.id, managerId: manager.id });
  await upsertUser({ name: "Ananya Kapoor", email: "finance@ledgerly.in", password: "Finance@123", role: Role.FINANCE, departmentId: financeDepartment.id });
  await upsertUser({ name: "Dev Malhotra", email: "admin@ledgerly.in", password: "Admin@123", role: Role.ADMIN });
  await prisma.policy.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: { active: true },
    create: { id: "00000000-0000-4000-8000-000000000001", name: "Company meals limit", ruleType: "MAX_AMOUNT", scope: "COMPANY", parameters: { category: "Meals", currency: "INR", maxAmount: 2500 }, active: true }
  });
  console.log("Seeded Ledgerly demo users and baseline policy.");
}

main().finally(() => prisma.$disconnect());
