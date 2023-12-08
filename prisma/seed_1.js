const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const transfer = await prisma.transaction_Code.createMany({
    data: [
      { desc: 'Transfer' },
      { desc: 'Purchase' },
      { desc: 'Commission' },
      { desc: 'Withdrawal' },
    ],
  });

  const comm_code = await prisma.commission_Code.createMany({
    data: [
      { desc: 'Referral Bonus' },
      { desc: 'Pairing Bonus' },
      { desc: 'Group Bonus' },
      { desc: 'Matching Bonus' },
    ],
  });

  const x_package = await prisma.package.createMany({
    data: [
      {
        name: 'Package 500',
        status: 'active',
        cost: 500.0,
      },
      {
        name: 'Package 1000',
        status: 'active',
        cost: 1000.0,
      },
      {
        name: 'Package 2000',
        status: 'active',
        cost: 2000.0,
      },
      {
        name: 'Package 3000',
        status: 'active',
        cost: 3000.0,
      },
    ],
  });

  const x_alice001 = await prisma.user.upsert({
    where: { email: 'alice@mlmdev.com' },
    update: {},
    create: {
      username: 'alice001',
      email: 'alice@mlmdev.com',
      status: 'normal',
      password: 'abc123',
      profile: {
        create: {
          first_name: 'alice',
          last_name: '001',
          ic_no: '1133668899',
          address: '338, Jalan Emas 56000',
          country: 'Malaysia',
          mobileno: '33668899',
        },
      },
      wallet: {
        create: [
          {
            amount: 0,
            wallet_type: {
              create: {
                name: 'ewallet',
                status: 'active',
              },
            },
          },
          {
            amount: 0,
            wallet_type: {
              create: {
                name: 'epoint',
                status: 'active',
              },
            },
          },
        ],
      },
      placement_leg: 0,
    },
  });

  console.log({
    x_alice001,
  });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
