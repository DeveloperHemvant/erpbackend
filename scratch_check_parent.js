const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { equals: 'parents@gmail.com', mode: 'insensitive' } }
  });
  console.log("User:", user);
  if (user) {
    const parent = await prisma.parent.findFirst({
      where: { userId: user.id }
    });
    console.log("Parent:", parent);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
