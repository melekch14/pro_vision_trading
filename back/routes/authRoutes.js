const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register/:type', authController.register);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPasswordByEmail);
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
