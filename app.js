const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const globalErrorHandler = require('./server/controllers/error.controller');
const authController = require('./server/controllers/auth.controller');
const walletController = require('./server/controllers/wallet.controller');
const userController = require('./server/controllers/user.controller');

const { verifyToken } = require('./server/middlewares/auth.middleware');

const userRouter = require('./server/routes/user.routes');
const walletRouter = require('./server/routes/wallet.routes');

const CustomError = require('./server/utils/customError');
const app = express();

app.use(cors({ origin: true, credentials: true }));

logger.token('body', (req) => {
  return JSON.stringify(req.body);
});

app.use(logger(':method :url :body'));

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//routes
const testMiddleWare1 = (req, res, next) => {
  const o = {
    username: 'username',
    password: 'password',
    abc: 123,
    def: 456,
  };

  const { password, abc, ...loggedUser } = o;

  console.log(loggedUser);
  next();
};

app.get('/api/v1/users/hierachy/parent/:id', userController.getRefParentByID);
app.post('/api/v1/login', authController.login);
app.post('/api/v1/refresh', authController.refresh);
app.use('/api/v1/wallet', walletRouter);
app.get('/api/v1/packages', verifyToken, walletController.getActivePackages);

app.use('/api/v1/users', verifyToken, userRouter);

// A catch-all route for anything the webservice does not define.
app.all('*', (req, res, next) => {
  next(new CustomError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
