const { PrismaClient, Prisma, Transaction_Type } = require('@prisma/client');
const prisma = new PrismaClient();
const catchAsyncError = require('../utils/catchAsyncError');
const CustomError = require('./../utils/customError');

const buyPackage = async (username, package_id, wallet_name, next) => {
  package_id = Number(package_id);
  const package = await getPackage(package_id, next);
  const [{ cost }] = package;
  const user = await getUserDetails(username, next);
  const deduct = await deductBalance(user.username, cost, wallet_name, 2, next);

  const purchase = await prisma.purchase.create({
    data: {
      status: 'active',
      user: {
        connect: {
          id: user.id,
        },
      },
      package: {
        connect: {
          id: package_id,
        },
      },
    },
  });

  return purchase;
};

const getActivePackages = async (next) => {
  const packages = await prisma.package.findMany({
    where: { status: 'active' },
  });

  if (!packages) return next(new CustomError('Invalid package', 401));

  return packages;
};

const getPackage = async (package_id, next) => {
  const package = await prisma.package.findMany({
    where: { status: 'active', id: package_id },
  });

  if (!package) return next(new CustomError('Invalid package', 401));

  return package;
};

const getUserDetails = async (username, next) => {
  const user = await prisma.user.findUnique({
    where: { username: username },
  });

  if (!user) return next(new CustomError('Invalid user', 401));

  return user;
};

const getUserPurchase = async (username, next) => {
  const user = await getUserDetails(username, next);

  const purchases = await prisma.purchase.findMany({
    where: {
      user_id: user.id,
    },
    orderBy: {
      id: 'desc',
    },
  });

  if (!purchases)
    return next(new CustomError('User has no active purchases', 401));

  return purchases;
};

exports.getActiveWalletTypes = catchAsyncError(async (req, res, next) => {
  const wallets = await prisma.wallet_Type.findMany();

  if (!wallets) return next(new CustomError('Invalid wallet name', 401));

  res.status(200).json(wallets);
});

const getWalletBalance = async (username, wallet_name, next) => {
  const user = await getUserDetails(username, next);

  const wallets = await prisma.wallet_Type.findFirst({
    where: {
      name: wallet_name,
    },
    include: {
      wallet: {
        select: {
          amount: true,
        },
        where: {
          user_id: user.id,
        },
      },
    },
  });

  if (!wallets) return next(new CustomError('Invalid wallet name', 401));

  let [{ amount: balance }] = wallets.wallet;
  let wal = { [wallet_name]: balance };

  return wal;
};

const addBalance = async (username, amount, wallet_name, tcode, next) => {
  //let { username, amount, wallet_name } = req.body;
  amount = Number(amount);
  const user = await prisma.user.findUnique({
    where: { username: username },
  });

  if (!user) return next(new CustomError('Invalid user', 401));

  const wallets = await prisma.wallet_Type.findFirst({
    where: {
      name: wallet_name,
      status: 'active',
    },
    include: {
      wallet: {
        select: {
          amount: true,
          id: true,
        },
        where: {
          user_id: user.id,
        },
      },
    },
  });

  if (!wallets) return next(new CustomError('User wallet inactive', 401));

  let wal = {};
  let [b] = wallets.wallet;
  let { amount: wallet_amount, id: wallet_id } = b;
  wal[wallets.name] = wallet_amount;

  let balance = wallet_amount + amount;

  const updated_wallet = await prisma.wallet.update({
    where: {
      id: wallet_id,
    },
    data: {
      amount: {
        increment: amount,
      },
      transactions: {
        create: {
          amount: amount,
          balance: balance,
          tcode: {
            connect: {
              id: tcode,
            },
          },
          type: Transaction_Type.CREDIT,
        },
      },
    },
  });

  if (!updated_wallet)
    return next(new CustomError(`Add balance failed for ${username}`, 401));

  return updated_wallet;
};

const deductBalance = async (username, amount, wallet_name, tcode, next) => {
  //let { username, amount, wallet_name } = req.body;
  amount = Number(amount);
  const user = await prisma.user.findUnique({
    where: { username: username },
  });

  if (!user) return next(new CustomError('Invalid user', 401));

  const wallets = await prisma.wallet_Type.findFirst({
    where: {
      name: wallet_name,
      status: 'active',
    },
    include: {
      wallet: {
        select: {
          amount: true,
          id: true,
        },
        where: {
          user_id: user.id,
        },
      },
    },
  });

  if (!wallets) return next(new CustomError('User wallet inactive', 401));

  let wal = {};
  let [b] = wallets.wallet;
  let { amount: wallet_amount, id: wallet_id } = b;
  wal[wallets.name] = wallet_amount;

  if (amount > wallet_amount)
    return next(
      new CustomError(
        'Insufficient sender wallet balance(' + wallet_amount + ')',
        401
      )
    );

  let balance = wallet_amount - amount;

  const updated_wallet = await prisma.wallet.update({
    where: {
      id: wallet_id,
    },
    data: {
      amount: {
        decrement: amount,
      },
      transactions: {
        create: {
          amount: amount,
          balance: balance,
          tcode: {
            connect: {
              id: tcode,
            },
          },
          type: Transaction_Type.DEBIT,
        },
      },
    },
  });

  if (!updated_wallet)
    return next(new CustomError(`Deduct balance failed for ${username}`, 401));

  return updated_wallet;
};

exports.doBuyPackage = catchAsyncError(async (req, res, next) => {
  const buy = await buyPackage(
    req.user.username,
    req.body.package_id,
    req.body.wallet_name,
    next
  );

  res.status(200).json(buy);
});

exports.getPurchases = catchAsyncError(async (req, res, next) => {
  const purchases = await getUserPurchase(req.user.username, next);

  res.status(200).json(purchases);
});

exports.getActivePackages = catchAsyncError(async (req, res, next) => {
  const packages = await getActivePackages(next);

  res.status(200).json(packages);
});

exports.getWalletBalance = catchAsyncError(async (req, res, next) => {
  const { wallet_name } = req.params;
  const balance = await getWalletBalance(req.user.username, wallet_name, next);

  res.status(200).json(balance);
});

exports.doTransfer = catchAsyncError(async (req, res, next) => {
  let { receiver_username, transfer_amount, wallet_name } = req.body;

  transfer_amount = Number(transfer_amount);

  const status1 = await deductBalance(
    req.user.username,
    transfer_amount,
    wallet_name,
    next
  );
  const status2 = await addBalance(
    receiver_username,
    transfer_amount,
    wallet_name,
    next
  );
  console.log({ status1, status2 });

  res.status(200).json({ sender_balance: status1, receiver_balance: status2 });
});

exports.getTransactionCode = catchAsyncError(async (req, res, next) => {
  const tcode = await prisma.transaction_Code.findMany();

  if (!tcode) return next(new CustomError('Invalid tcode', 401));

  res.status(200).json(tcode);
});

exports.getTransactionsByWalletName = catchAsyncError(
  async (req, res, next) => {
    const { wallet_name, trans_type } = req.params;
    const wallets = await prisma.wallet_Type.findFirst({
      where: {
        name: wallet_name,
        status: 'active',
      },
      orderBy: {
        created_at: 'asc',
      },
      include: {
        wallet: {
          select: {
            id: true,
          },
          where: {
            user_id: req.user.id,
          },
        },
      },
    });

    if (!wallets) return next(new CustomError('Invalid wallet name', 401));

    let [b] = wallets.wallet;
    let { id: s_wallet_id } = b;

    const transactions = await prisma.transaction.findMany({
      where: {
        wallet_id: s_wallet_id,
        ...(trans_type && { type: trans_type.toUpperCase() }),
      },
    });

    if (!transactions)
      return next(new CustomError('Error retrieving transactions', 401));

    res.status(200).json(transactions);
  }
);
