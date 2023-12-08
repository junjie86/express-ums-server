const express = require('express');
const userController = require('../controllers/user.controller');
const authController = require('../controllers/auth.controller');
const router = express.Router();

router.post('/logout', authController.logout);

router.get('/check', authController.authenticated);
router.get('/me', authController.me);

//router.get('/', userController.findAll);
//router.get('/:id', userController.findOne);
//router.get('/test', userController.testOne);
router.get('/profile', userController.getProfile);
//router.get('/hierachy/parent/:id', userController.getRefParentByID);
router.post('/validate', userController.testTwo);
router.post('/create', userController.createOne);

router.patch('/:id', userController.updateOne);

module.exports = router;
