const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();
const catchAsyncError = require('../utils/catchAsyncError');
const CustomError = require('../utils/customError');
const { validateUser } = require('../utils/validation');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.findAll = catchAsyncError(async (req, res, next) => {
  const users = await prisma.user.findMany();
  res.status(200).json(users);
});

exports.findOne = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
  });

  res.status(200).json(user);
});

exports.updateOne = catchAsyncError(async (req, res, next) => {
  const filteredBody = filterObj(req.body, 'name', 'email', 'id');

  const updatedUser = await prisma.user.update({
    where: {
      id: filteredBody.id,
    },
    data: {
      email: filteredBody.email,
    },
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.testTwo = catchAsyncError(async (req, res, next) => {
  const { error, value } = validateUser(req.body);
  if (error) {
    return next(new CustomError(error?.message || 'Some error occured', 400));
  }
});

exports.testOne = catchAsyncError(async (req, res, next) => {
  const wallet_type = await prisma.wallet_Type.findMany({
    where: {
      status: 'active',
    },
  });

  let wallets = [];

  wallet_type.map((wallet) => {
    {
      wallets.push({ amount: 0, wallet_type_id: wallet.id });
    }
  });

  const myReferrer = 2;

  const sql = `SELECT out_placement_uid::Int, out_placement_positon::Int FROM get_next_placement_leg(${myReferrer})`;

  const [
    { out_placement_uid: placement_uid, out_placement_positon: placement_leg },
  ] = await prisma.$queryRawUnsafe(sql);

  console.log({ placement_uid, placement_leg });

  res.status(200).json(wallet_type);
});

exports.getProfile = catchAsyncError(async (req, res, next) => {
  const profile = await prisma.profile.findFirst({
    where: {
      user_id: req.user.id,
    },
  });

  if (!profile) return next(new CustomError('Invalid user', 401));

  res.status(200).json(profile);
});

exports.getRefParentByID = catchAsyncError(async (req, res, next) => {
  let { id } = req.params;

  id = Number(id);

  const profile = await prisma.user.findMany({
    where: {
      status: 'normal',
      relation_ref_id: id,
    },
    select: {
      id: true,
      username: true,
    },
  });

  if (!profile) return next(new CustomError('Invalid user', 401));

  res.status(200).json(profile);
});

exports.createOne = catchAsyncError(async (req, res, next) => {
  const { error, value } = validateUser(req.body);
  value.referrer_username = req.user.username;
  // const {
  //   username,
  //   email,
  //   password,
  //   first_name,
  //   last_name,
  //   ic_no,
  //   address,
  //   country,
  //   mobileno,
  //   referrer_username,
  // } = req.body;

  // if (
  //   !username ||
  //   !email ||
  //   !password ||
  //   !first_name ||
  //   !last_name ||
  //   !ic_no ||
  //   !address ||
  //   !country ||
  //   !mobileno ||
  //   !referrer_username
  // ) {
  //   return next(new CustomError('Please provide correct details~', 400));
  // }

  if (error) {
    const [{ message: errMsg }] = error.details;

    return next(new CustomError(errMsg, 400));
  }

  const wallet_type = await prisma.wallet_Type.findMany({
    where: {
      status: 'active',
    },
  });

  let wallets = [];

  wallet_type.map((wallet) => {
    {
      wallets.push({ amount: 0, wallet_type_id: wallet.id });
    }
  });

  const referrer = await prisma.user.findUnique({
    where: { username: value.referrer_username },
  });

  const sql = `SELECT out_placement_uid::Int, out_placement_positon::Int FROM get_next_placement_leg(${referrer.id})`;

  const [
    { out_placement_uid: placement_uid, out_placement_positon: placement_leg },
  ] = await prisma.$queryRawUnsafe(sql);

  if (!placement_uid || !placement_leg) {
    return next(new CustomError('invalid referrer', 400));
  }

  const result = await prisma.user.create({
    data: {
      username: value.username,
      email: value.email,
      status: 'normal',
      password: value.password,
      profile: {
        create: {
          first_name: value.first_name,
          last_name: value.last_name,
          ic_no: value.ic_no,
          address: value.address,
          country: value.country,
          mobileno: value.mobileno,
        },
      },
      wallet: {
        create: wallets,
      },
      relation_ref_id: referrer.id,
      relation_placement_id: placement_uid,
      placement_leg: placement_leg,
    },
  });

  res.status(200).json(result);
});
