const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const c = await prisma.aroniumConfig.findFirst();
  console.log(c);
  await prisma.$disconnect();
}

check();
