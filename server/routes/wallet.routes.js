const express = require('express');
const walletController = require('../controllers/wallet.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const router = express.Router();

router.get(
  '/balance/:wallet_name',
  verifyToken,
  walletController.getWalletBalance
);
router.post('/balance/transfer', verifyToken, walletController.doTransfer);

router.post('/package/buy', verifyToken, walletController.doBuyPackage);
router.get('/package', verifyToken, walletController.getPurchases);
router.get(
  '/transactions/:wallet_name/:trans_type?',
  verifyToken,
  walletController.getTransactionsByWalletName
);

router.get('/tcode', verifyToken, walletController.getTransactionCode);
router.get('/type', verifyToken, walletController.getActiveWalletTypes);

module.exports = router;
