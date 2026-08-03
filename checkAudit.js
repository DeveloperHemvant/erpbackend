const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.auditLog.count();
  console.log(`Audit logs count: ${count}`);
  
  if (count === 0) {
    // Note: If using PrismaClient directly without NestJS, $use won't trigger unless we re-implement the middleware here, OR we can just assume Prisma Client directly doesn't trigger it, but if it was in PrismaService it would.
    // Wait, the Audit logs logic is literally inside PrismaService's constructor!
    // So if we don't use PrismaService, audit logs won't be created.
    console.log("To test Audit logs, we must instantiate PrismaService.");
  }
}

check().catch(console.error).finally(() => process.exit(0));
