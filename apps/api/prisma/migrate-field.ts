import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Convert TEAM_LEADER and SHELTER_OPERATOR to FIELD_RESPONDER before schema push
  const r1 = await prisma.$executeRawUnsafe(`UPDATE "User" SET "role" = 'CITIZEN' WHERE "role" = 'TEAM_LEADER'`);
  const r2 = await prisma.$executeRawUnsafe(`UPDATE "User" SET "role" = 'CITIZEN' WHERE "role" = 'SHELTER_OPERATOR'`);
  console.log(`Migrated ${r1 + r2} users to CITIZEN temporarily. db:push will add FIELD_RESPONDER.`);
}
main().finally(() => prisma.$disconnect());
