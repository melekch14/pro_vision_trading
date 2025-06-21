const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register/:type', authController.register);
router.post('/login', authController.login);
router.post('/reset-password-email', authController.resetPasswordByEmail);
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', (req, res, next) => {
  console.log('Router received POST /reset-password');
  next();
}, authController.resetPassword);

module.exports = router;
