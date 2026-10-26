// ============================================================
// 🛡️ রিকোয়েস্ট ভ্যালিডেশন মিডলওয়্যার (Request Input Validator)
// কন্ট্রোলারে পৌঁছানোর আগেই ভুল বা ক্ষতিকর ইনপুট আটকে দেওয়া
// ============================================================

const { sendError } = require('../utils/apiResponse');

// ১. রেজিস্ট্রেশন ভ্যালিডেশন
const validateRegister = (req, res, next) => {
  const { username, password } = req.body;
  const errors = {};

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    errors.username = 'ইউজারনেম অবশ্যই কমপক্ষে ৩ অক্ষরের হতে হবে!';
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.password = 'পাসওয়ার্ড অবশ্যই কমপক্ষে ৬ অক্ষরের হতে হবে!';
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 'ভুল ইনপুট দেওয়া হয়েছে!', errors, 400);
  }

  next();
};

// ২. লগইন ভ্যালিডেশন
const validateLogin = (req, res, next) => {
  const { username, password } = req.body;
  const errors = {};

  if (!username || typeof username !== 'string' || username.trim() === '') {
    errors.username = 'ইউজারনেম দেওয়া আবশ্যক!';
  }

  if (!password || typeof password !== 'string' || password === '') {
    errors.password = 'পাসওয়ার্ড দেওয়া আবশ্যক!';
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 'ইউজারনেম এবং পাসওয়ার্ড পূরণ করুন!', errors, 400);
  }

  next();
};

// ৩. বই তৈরি বা আপডেটের ভ্যালিডেশন
const validateBook = (req, res, next) => {
  const title = (req.body.BookTitle || req.body.Booktitle || req.body.booktitle || req.body.title || '').trim();
  const author = (req.body.Author || req.body.author || '').trim();
  const priceRaw = req.body.Price !== undefined ? req.body.Price : req.body.price;

  const errors = {};

  if (!title || title.length < 2) {
    errors.BookTitle = 'বইয়ের নাম কমপক্ষে ২ অক্ষরের হতে হবে!';
  }

  if (!author || author.length < 2) {
    errors.Author = 'লেখকের নাম কমপক্ষে ২ অক্ষরের হতে হবে!';
  }

  if (priceRaw === undefined || priceRaw === null || priceRaw === '') {
    errors.Price = 'বইয়ের দাম দেওয়া আবশ্যক!';
  } else {
    const numericPrice = Number(priceRaw);
    if (isNaN(numericPrice) || numericPrice < 0) {
      errors.Price = 'বইয়ের দাম অবশ্যই শূন্য (০) বা তার বেশি সংখ্যা হতে হবে!';
    }
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 'বইয়ের তথ্য সঠিকভাবে পূরণ করা হয়নি!', errors, 400);
  }

  next();
};

// ৪. রিভিউ ও রেটিং ভ্যালিডেশন
const validateReview = (req, res, next) => {
  const rating = parseInt(req.body.rating, 10);
  const comment = (req.body.comment || '').trim();
  const errors = {};

  if (isNaN(rating) || rating < 1 || rating > 5) {
    errors.rating = 'রেটিং অবশ্যই ১ থেকে ৫ স্টারের মধ্যে হতে হবে!';
  }

  if (!comment || comment.length < 3) {
    errors.comment = 'মন্তব্য কমপক্ষে ৩ অক্ষরের হতে হবে!';
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 'রিভিউর তথ্য সঠিকভাবে পূরণ করুন!', errors, 400);
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateBook,
  validateReview
};
