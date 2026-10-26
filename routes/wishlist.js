// ============================================================
// 🛣️ উইশলিস্ট রাউটস (Wishlist Routes)
// /api/wishlist
// ============================================================

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const {
  toggleWishlist,
  getWishlist,
  getWishlistBookIds
} = require('../controllers/wishlistController');

// সব উইশলিস্ট রুটের জন্য লগইন আবশ্যক
router.use(verifyToken);

// ১. ইউজারের উইশলিস্ট করা বইয়ের বিস্তারিত তালিকা
router.get('/', getWishlist);

// ২. উইশলিস্ট করা বইয়ের আইডিগুলোর তালিকা (দ্রুত আইকন হাইলাইট করার জন্য)
router.get('/ids', getWishlistBookIds);

// ৩. বই ফেভারিট করা বা ফেভারিট থেকে বাদ দেওয়া (Toggle)
router.post('/:bookId/toggle', toggleWishlist);

module.exports = router;
