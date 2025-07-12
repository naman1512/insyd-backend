import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding database...');

  // Create sample users
  const users = [
    {
      id: uuidv4(),
      username: 'alice_architect',
      email: 'alice@insyd.com'
    },
    {
      id: uuidv4(),
      username: 'bob_designer',
      email: 'bob@insyd.com'
    },
    {
      id: uuidv4(),
      username: 'charlie_engineer',
      email: 'charlie@insyd.com'
    }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user
    });
  }

  console.log('Database seeded successfully!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
