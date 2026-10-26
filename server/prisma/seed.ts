import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const a = await prisma.user.upsert({
    where: { openid: 'mock_a' },
    update: {},
    create: {
      id: 'seed_a',
      openid: 'mock_a',
      uid: '10000001',
      nickname: 'A',
      adult: true,
      minorMode: false,
    },
  });
  const b = await prisma.user.upsert({
    where: { openid: 'mock_b' },
    update: {},
    create: {
      id: 'seed_b',
      openid: 'mock_b',
      uid: '10000002',
      nickname: 'B',
      adult: true,
      minorMode: false,
    },
  });
  await prisma.couple.upsert({
    where: { id: 'seed_couple' },
    update: {},
    create: {
      id: 'seed_couple',
      name: '我们的小岛',
      memberA: a.id,
      memberB: b.id,
      persona: 'sweet',
      inviteCode: '88888888',
    },
  });
  console.log(
    `seed done -> coupleId=seed_couple, userIdA=${a.id}, userIdB=${b.id}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
