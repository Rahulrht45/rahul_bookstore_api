// ============================================================
// 🛣️ প্রোফাইল রাউটস (Profile Routes)
// /api/profile
// ============================================================

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { getProfile, changePassword } = require('../controllers/profileController');

// সব প্রোফাইল রুটের জন্য লগইন আবশ্যক
router.use(verifyToken);

// ১. প্রোফাইল ও পরিসংখ্যান দেখা
router.get('/', getProfile);

// ২. পাসওয়ার্ড পরিবর্তন করা
router.put('/change-password', changePassword);

module.exports = router;
