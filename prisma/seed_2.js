const { PrismaClient, Transaction_Type } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const x_bob002 = await prisma.user.upsert({
    where: { email: 'bob@mlmdev.com' },
    update: {},
    create: {
      username: 'bob002',
      email: 'bob@mlmdev.com',
      status: 'normal',
      password: 'abc123',
      profile: {
        create: {
          first_name: 'bob',
          last_name: '002',
          ic_no: '2233668899',
          address: '138, Jalan Emas 56000',
          country: 'Malaysia',
          mobileno: '233668899',
        },
      },
      wallet: {
        create: [
          {
            amount: 0,
            wallet_type: {
              connect: {
                id: 1,
              },
            },
            transactions: {
              create: {
                amount: 1000,
                balance: 1000,
                type: Transaction_Type.CREDIT,
                tcode: {
                  connect: {
                    id: 3,
                  },
                },
              },
            },
          },
          {
            amount: 0,
            wallet_type: {
              connect: {
                id: 2,
              },
            },
            transactions: {
              create: {
                amount: 1000,
                balance: 1000,
                type: Transaction_Type.CREDIT,
                tcode: {
                  connect: {
                    id: 1,
                  },
                },
              },
            },
          },
        ],
      },
      relation_ref_id: 1,
      relation_placement_id: 1,
      placement_leg: 1,
    },
  });

  const x_tony003 = await prisma.user.upsert({
    where: { email: 'tony@mlmdev.com' },
    update: {},
    create: {
      username: 'tony003',
      email: 'tony@mlmdev.com',
      status: 'normal',
      password: 'abc123',
      profile: {
        create: {
          first_name: 'tony',
          last_name: '003',
          ic_no: '3333668899',
          address: '638, Jalan Emas 56000',
          country: 'Malaysia',
          mobileno: '333668899',
        },
      },
      purchase: {},
      wallet: {
        create: [
          {
            amount: 1000,
            wallet_type: {
              connect: {
                id: 1,
              },
            },
            transactions: {
              create: {
                amount: 1000,
                balance: 1000,
                type: Transaction_Type.CREDIT,
                tcode: {
                  connect: {
                    id: 3,
                  },
                },
              },
            },
          },
          {
            amount: 0,
            wallet_type: {
              connect: {
                id: 2,
              },
            },
            transactions: {
              create: {
                amount: 1000,
                balance: 1000,
                type: Transaction_Type.CREDIT,
                tcode: {
                  connect: {
                    id: 2,
                  },
                },
              },
            },
          },
        ],
      },
      relation_ref_id: 1,
      relation_placement_id: 1,
      placement_leg: 2,
    },
  });

  const alice001 = await prisma.user.findUnique({
    where: {
      username: 'alice001',
    },
  });

  const bob002 = await prisma.user.findUnique({
    where: {
      username: 'bob002',
    },
  });

  const tony003 = await prisma.user.findUnique({
    where: {
      username: 'tony003',
    },
  });

  const package = await prisma.package.findMany({
    where: {
      status: 'active',
    },
  });
  const [package500] = package
    .filter((i) => Number(i.cost) === 500)
    .map((a) => a.id);
  const [package1000] = package
    .filter((i) => Number(i.cost) === 1000)
    .map((a) => a.id);
  const [package2000] = package
    .filter((i) => Number(i.cost) === 2000)
    .map((a) => a.id);

  const purchase = await prisma.purchase.createMany({
    data: [
      {
        user_id: alice001.id,
        status: 'active',
        package_id: package500,
      },
      {
        user_id: bob002.id,
        status: 'active',
        package_id: package1000,
      },
      {
        user_id: tony003.id,
        status: 'active',
        package_id: package2000,
      },
      {
        user_id: alice001.id,
        status: 'active',
        package_id: package500,
      },
      {
        user_id: bob002.id,
        status: 'active',
        package_id: package1000,
      },
      {
        user_id: tony003.id,
        status: 'active',
        package_id: package2000,
      },
    ],
  });

  const commission = await prisma.commission.createMany({
    data: [
      { user_id: 1, comm_code_id: 3, amount: 300, purchase_id: 1 },
      { user_id: 2, comm_code_id: 3, amount: 300, purchase_id: 2 },
      { user_id: 3, comm_code_id: 3, amount: 300, purchase_id: 3 },
      { user_id: 1, comm_code_id: 3, amount: 300, purchase_id: 1 },
      { user_id: 2, comm_code_id: 3, amount: 300, purchase_id: 2 },
      { user_id: 3, comm_code_id: 3, amount: 300, purchase_id: 3 },
    ],
  });

  console.log({ x_bob002, x_tony003, purchase, commission });
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
