// ============================================================
// 🛣️ অর্ডার রাউটস (Orders Routes)
// /api/orders
// ============================================================

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { checkoutOrder, getMyOrders } = require('../controllers/ordersController');

// সব অর্ডার রুটের জন্য লগইন আবশ্যক
router.use(verifyToken);

// ১. ইউজারের সমস্ত অর্ডারের ইতিহাস দেখা
router.get('/', getMyOrders);

// ২. কার্ট চেকআউট করে নতুন অর্ডার তৈরি করা
router.post('/', checkoutOrder);

module.exports = router;
