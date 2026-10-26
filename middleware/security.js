// ============================================================
// 🛡️ সাইবার সিকিউরিটি ও রেট লিমিটিং মিডলওয়্যার (Security Middleware)
// Brute-force আক্রমণ, DDoS স্প্যাম ও বট প্রতিরোধ
// ============================================================

const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/apiResponse');

/**
 * ১. সাধারণ এপিআই রেট লিমিটার (Global API Rate Limiter)
 * প্রতিটি আইপি থেকে ১৫ মিনিটে সর্বোচ্চ ৩০০ রিকোয়েস্ট অনুমতি দেবে
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ১৫ মিনিট
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'আপনি অত্যন্ত ঘন ঘন রিকোয়েস্ট পাঠাচ্ছেন! সার্ভার সুরক্ষার জন্য ১৫ মিনিট পর আবার চেষ্টা করুন।',
      null,
      429
    );
  }
});

/**
 * ২. লগইন ও রেজিস্ট্রেশন লিমিটার (Brute-Force Protection)
 * পাসওয়ার্ড হ্যাকিং ঠেকাতে ১৫ মিনিটে সর্বোচ্চ ১০ বার চেষ্টার সুযোগ
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ১৫ মিনিট
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'অতিরিক্ত লগইন চেষ্টার কারণে আপনার আইপি ১৫ মিনিটের জন্য সাময়িকভাবে লক করা হয়েছে!',
      { security: 'ব্রুট-ফোর্স আক্রমণ প্রতিরোধ সক্রিয়।' },
      429
    );
  }
});

module.exports = {
  globalLimiter,
  authLimiter
};
