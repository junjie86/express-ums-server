const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();
const { verify } = require('jsonwebtoken');
const CustomError = require('../utils/customError');
const catchAsyncError = require('../utils/catchAsyncError');

exports.verifyToken = catchAsyncError(async (req, res, next) => {
  const { authorization } = req.headers;

  // Cut the received string and takes the token at position 1.
  const token = (authorization && authorization.split(' ')[1]) || '';

  const payload = verify(token, process.env.JWT_SECRET);

  if (!payload) {
    return next(new CustomError('Unauthorised', 401));
  }

  const refreshToken = await prisma.token.findFirst({
    where: {
      user_id: payload.id,
    },
  });

  if (!refreshToken) return next(new CustomError('Unauthorised', 401));

  const user = await prisma.user.findFirst({
    where: {
      id: payload.id,
    },
  });

  if (!user) return next(new CustomError('Unauthorised', 401));

  const { password, ...loggedUser } = user;
  req.user = loggedUser;
  next();
});
