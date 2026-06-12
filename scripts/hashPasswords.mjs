import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPasswords() {
  console.log("Hashing plaintext passwords...");
  const users = await prisma.user.findMany();
  for (const u of users) {
    if (!u.passwordHash.startsWith("$2a$") && !u.passwordHash.startsWith("$2b$")) {
      const newHash = await bcrypt.hash(u.passwordHash, 10);
      await prisma.user.update({
        where: { id: u.id },
        data: { passwordHash: newHash }
      });
      console.log(`Hashed password for ${u.email}`);
    } else {
      console.log(`Password for ${u.email} is already hashed.`);
    }
  }
  await prisma.$disconnect();
}

hashPasswords();
