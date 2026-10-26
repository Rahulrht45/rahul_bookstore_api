// ============================================================
// 📦 এপিআই রেসপন্স ইউটিলিটি (Standard API Response Envelope)
// সব কন্ট্রোলারের রেসপন্স যাতে একটি নির্দিষ্ট ও প্রফেশনাল ছাঁচে বের হয়
// ============================================================

/**
 * ১. সফল রেসপন্স (Success Response)
 * @param {Object} res - Express Response অবজেক্ট
 * @param {String} message - ব্যবহারকারীকে দেখানোর মেসেজ
 * @param {*} data - মূল ডাটা (অ্যারে বা অবজেক্ট)
 * @param {Object|null} meta - পেজিনেশন বা অতিরিক্ত তথ্য (যেমন: total, page, limit)
 * @param {Number} statusCode - HTTP স্ট্যাটাস কোড (ডিফল্ট ২০০)
 */
const sendSuccess = (res, message = 'সফল হয়েছে', data = null, meta = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * ২. ব্যর্থ বা এরর রেসপন্স (Error Response)
 * @param {Object} res - Express Response অবজেক্ট
 * @param {String} message - ভুলের প্রধান কারণ বা বার্তা
 * @param {*} errors - বিস্তারিত ভুল বা ভ্যালিডেশন এরর তালিকা
 * @param {Number} statusCode - HTTP স্ট্যাটাস কোড (ডিফল্ট ৫০০)
 */
const sendError = (res, message = 'কিছু একটা সমস্যা হয়েছে!', errors = null, statusCode = 500) => {
  const response = {
    success: false,
    message,
  };

  if (errors !== null) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError
};
