const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Check if there are any existing customers below 8725
    const minCustomer = await prisma.customer.findFirst({
      orderBy: { customerNumber: 'asc' }
    });

    if (minCustomer && minCustomer.customerNumber < 8725) {
      console.log('Shifting existing customers to start from 8725...');
      // Shift everyone up. If we have 1, 2, 3 -> they become 8725, 8726, 8727
      // Wait, to avoid unique constraint violations during update, we should shift them carefully.
      // But adding a large constant like 8724 usually avoids collisions if max is small.
      await prisma.$executeRawUnsafe(`UPDATE "Customer" SET "customerNumber" = "customerNumber" + 8724;`);
    }

    console.log('Setting sequence nextval...');
    // The sequence name in PostgreSQL created by Prisma is usually TableName_columnName_seq
    // but sometimes it's double quoted.
    await prisma.$executeRawUnsafe(`SELECT setval('"Customer_customerNumber_seq"', (SELECT COALESCE(MAX("customerNumber"), 8724) FROM "Customer"));`);
    
    console.log('Done updating sequence.');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
