// ============================================================
// 📚 বুকস রাউটার (Books Routes)
// দায়িত্ব: ট্রাফিক নিয়ন্ত্রণ, ফাইল আপলোড ও ভ্যালিডেশন মিডলওয়্যার যুক্ত করা
// সমস্ত ডাটাবেজ কুয়েরি ও লজিক এখন controllers/booksController.js-এ
// ============================================================

const express = require('express');
const router = express.Router();
const booksController = require('../controllers/booksController');
const reviewsController = require('../controllers/reviewsController');
const upload = require('../middleware/upload');
const verifyToken = require('../middleware/auth');
const { validateBook, validateReview } = require('../middleware/validator');

// ১. সব বইয়ের তালিকা পাওয়ার রুট (GET /api/books - সবার জন্য উন্মুক্ত)
// সাপোর্ট করে: Search, Filter (minPrice, maxPrice) ও Pagination (page, limit)
router.get('/', booksController.getAllBooks);

// ২. নির্দিষ্ট একটি বইয়ের তথ্য পাওয়া (GET /api/books/:id - সবার জন্য উন্মুক্ত)
router.get('/:id', booksController.getBookById);

// ৩. নতুন বই যোগ করার রুট (POST /api/books - 🔒 টোকেন + ছবি আপলোড + ইনপুট ভ্যালিডেশন)
router.post('/', verifyToken, upload.single('CoverImage'), validateBook, booksController.createBook);

// ৪. বইয়ের তথ্য আপডেট করার রুট (PUT /api/books/:id - 🔒 টোকেন + ভ্যালিডেশন)
router.put('/:id', verifyToken, upload.single('CoverImage'), validateBook, booksController.updateBook);

// ৫. বই মুছে ফেলার রুট (DELETE /api/books/:id - 🔒 টোকেন + ওনারশিপ যাচাই)
router.delete('/:id', verifyToken, booksController.deleteBook);

// ৬. নির্দিষ্ট বইয়ের রিভিউ দেখার রুট (GET /api/books/:id/reviews - সবার জন্য উন্মুক্ত)
router.get('/:id/reviews', reviewsController.getReviewsByBook);

// ৭. নির্দিষ্ট বইয়ে রিভিউ ও রেটিং দেওয়ার রুট (POST /api/books/:id/reviews - 🔒 টোকেন আবশ্যক)
router.post('/:id/reviews', verifyToken, validateReview, reviewsController.addReview);

module.exports = router;
