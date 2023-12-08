const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

// prisma.$on('query', (e) => {
//   console.log('Query: ' + e.query);
//   console.log('Params: ' + e.params);
//   console.log('Duration: ' + e.duration + 'ms');
// });

const { compare } = require('bcrypt');
const { sign, verify } = require('jsonwebtoken');

const { validateSignIn } = require('../utils/validation');
const CustomError = require('../utils/customError');
const catchAsyncError = require('../utils/catchAsyncError');

exports.authenticated = catchAsyncError(async (req, res, next) => {
  return res.status(200).json({ message: 'Welcome to the API' });
});

exports.me = catchAsyncError(async (req, res, next) => {
  return res.status(200).json({ user: req.user });
});

exports.login = catchAsyncError(async (req, res, next) => {
  const { error, value } = validateSignIn(req.body);

  if (error) return next(new CustomError(error?.message, 400));

  const user = await prisma.user.findUnique({
    where: {
      email: value.email,
    },
  });

  if (!user) return next(new CustomError('Invalid email or password!', 400));
  // Check the user password.
  const verifyPassword = await compare(value.password, user.password);

  if (!verifyPassword && false)
    return next(new CustomError('Invalid email or password!', 400));

  const refreshToken = sign(
    { id: user.id, name: user.name },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.EXPIRES_IN_JWT_REFRESH_SECRET }
  );

  res.cookie('jwt', refreshToken, {
    httpOnly: false,
    sameSite: 'lax',
    maxAge:
      process.env.EXPIRES_IN_JWT_REFRESH_SECRET_COOKIE * 24 * 60 * 60 * 1000,
    secure: false,
  });

  const expiredAt = new Date();
  expiredAt.setDate(
    expiredAt.getDate() + process.env.EXPIRES_IN_JWT_REFRESH_SECRET_COOKIE
  );

  await prisma.token.create({
    data: {
      user_id: user.id,
      type: 'authentication',
      token: refreshToken,
      expiredAt,
    },
  });

  const token = sign({ id: user.id, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: process.env.EXPIRES_IN_JWT_SECRET,
  });

  return res.status(200).json({
    status: 'success',
    token,
    data: {
      username: user.username,
      role: 'user',
      status: 'authenticated',
    },
  });
});

exports.logout = catchAsyncError(async (req, res, next) => {
  const refreshToken = req.cookies.jwt;

  if (!refreshToken) return next(new CustomError('Unauthorised', 401));

  await prisma.token.deleteMany({
    where: {
      user_id: req.user.id,
      //token: refreshToken,
    },
  });

  res.clearCookie('jwt', {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 0,
    secure: false,
  });

  return res.sendStatus(204);
});

exports.refresh = catchAsyncError(async (req, res, next) => {
  const refreshToken = req.cookies.jwt;

  const payload = verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  if (!payload) return next(new CustomError('Unauthorised', 401));

  const dbToken = await prisma.token.findFirst({
    where: {
      user_id: payload.id,
      type: 'authentication',
      expiredAt: {
        gte: new Date(),
      },
    },
  });

  if (!dbToken) return next(new CustomError('Unauthorised', 401));

  const token = sign(
    { id: payload.id, name: payload.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.EXPIRES_IN_JWT_SECRET }
  );

  return res.status(200).send({ token });
});
