const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const staff = await prisma.staff.findUnique({ where: { email: 'admin@school.com' } });
  if (!staff) {
    console.log('No admin found');
    return;
  }
  
  console.log('Admin found:', staff.email);
  console.log('Hash in DB:', staff.passwordHash);
  
  const pw = 'SuperAdminPassword123!';
  const match = await bcrypt.compare(pw, staff.passwordHash);
  console.log('Does password match?', match);
}

main().finally(() => prisma.$disconnect());
