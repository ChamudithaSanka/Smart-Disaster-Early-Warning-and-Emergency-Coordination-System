import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Only update role — isVolunteer column doesn't exist in DB yet (added by db:push after this)
  await prisma.$executeRawUnsafe(
    `UPDATE "User" SET "role" = 'CITIZEN' WHERE "role" = 'VOLUNTEER'`
  );
  console.log('Migrated VOLUNTEER → CITIZEN. Now run db:push to add isVolunteer column.');
}
main().finally(() => prisma.$disconnect());
