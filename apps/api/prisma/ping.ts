import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.user.count()
  .then(n => console.log('DB awake! Total users:', n))
  .catch(e => console.error('DB error:', e.message))
  .finally(() => p.$disconnect());
