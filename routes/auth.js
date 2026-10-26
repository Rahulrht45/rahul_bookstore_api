// ============================================================
// 🛣️ অথেনটিকেশন রাউটার (Auth Routes)
// দায়িত্ব: শুধুমাত্র ট্রাফিক নিয়ন্ত্রণ ও ভ্যালিডেশন মিডলওয়্যার যুক্ত করা
// ============================================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validator');
const { authLimiter } = require('../middleware/security');

// ১. ব্যবহারকারী রেজিস্ট্রেশন বা সাইনআপ (POST /api/register)
router.post('/register', authLimiter, validateRegister, authController.register);

// ২. ব্যবহারকারী লগইন ও JWT টোকেন গ্রহণ (POST /api/login)
router.post('/login', authLimiter, validateLogin, authController.login);

module.exports = router;
