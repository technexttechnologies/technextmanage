import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting portal token backfill...');
  
  // Find all customers without a portal token
  const customers = await prisma.customer.findMany({
    where: {
      portalToken: null
    }
  });
  
  console.log(`Found ${customers.length} customers missing a portalToken.`);
  
  let updatedCount = 0;
  for (const customer of customers) {
    const token = crypto.randomBytes(16).toString('hex');
    await prisma.customer.update({
      where: { id: customer.id },
      data: { portalToken: token }
    });
    updatedCount++;
  }
  
  console.log(`Successfully backfilled tokens for ${updatedCount} customers.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
