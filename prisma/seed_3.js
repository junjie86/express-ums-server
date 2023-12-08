const { PrismaClient, Transaction_Type } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lisa004 = await prisma.user.upsert({
    where: { email: 'lisa@mlmdev.com' },
    update: {},
    create: {
      username: 'lisa004',
      email: 'lisa@mlmdev.com',
      status: 'normal',
      password: 'abc123',
      profile: {
        create: {
          first_name: 'lisa',
          last_name: '004',
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
      relation_ref_id: 2,
      relation_placement_id: 2,
      placement_leg: 1,
    },
  });

  const zoe005 = await prisma.user.upsert({
    where: { email: 'zoe@mlmdev.com' },
    update: {},
    create: {
      username: 'zoe005',
      email: 'zoe@mlmdev.com',
      status: 'normal',
      password: 'abc123',
      profile: {
        create: {
          first_name: 'zoe',
          last_name: '005',
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
      relation_placement_id: 3,
      placement_leg: 2,
    },
  });

  console.log({ lisa004, zoe005 });
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
