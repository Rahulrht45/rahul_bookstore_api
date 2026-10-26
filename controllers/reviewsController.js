// ============================================================
// 💬 রিভিউ ও রেটিং কন্ট্রোলার (Reviews Controller)
// ১-টু-মেনি রিলেশনশিপ: নির্দিষ্ট বইয়ের রিভিউ দেখা ও নতুন রিভিউ যুক্ত করা
// ============================================================

const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * ১. নির্দিষ্ট একটি বইয়ের সব রিভিউ ও মন্তব্য পাওয়া
 * GET /api/books/:id/reviews
 */
const getReviewsByBook = (req, res) => {
  const bookId = req.params.id;

  const sql = `
    SELECT 
      reviews.id,
      reviews.book_id,
      reviews.rating,
      reviews.comment,
      reviews.created_at,
      users.username AS ReviewerName
    FROM reviews
    JOIN users ON reviews.user_id = users.id
    WHERE reviews.book_id = ?
    ORDER BY reviews.created_at DESC
  `;

  db.query(sql, [bookId], (err, reviews) => {
    if (err) {
      return sendError(res, 'রিভিউ আনতে সমস্যা হয়েছে: ' + err.message, null, 500);
    }

    return sendSuccess(res, 'রিভিউ তালিকা সফলভাবে পাওয়া গেছে', reviews);
  });
};

/**
 * ২. নির্দিষ্ট বইয়ে নতুন রিভিউ ও রেটিং যোগ করা
 * POST /api/books/:id/reviews (🔒 Protected: Login Required)
 */
const addReview = (req, res) => {
  const bookId = req.params.id;
  const userId = req.user.id;
  const rating = parseInt(req.body.rating, 10);
  const comment = (req.body.comment || '').trim();

  // প্রথমে বইটি ডাটাবেজে আছে কি না যাচাই করা
  db.query('SELECT Id, BookTitle FROM books WHERE Id = ?', [bookId], (bookErr, books) => {
    if (bookErr) {
      return sendError(res, 'ডাটাবেজ সমস্যা: ' + bookErr.message, null, 500);
    }
    if (books.length === 0) {
      return sendError(res, 'বইটি খুঁজে পাওয়া যায়নি!', null, 404);
    }

    const sql = 'INSERT INTO reviews (book_id, user_id, rating, comment) VALUES (?, ?, ?, ?)';
    db.query(sql, [bookId, userId, rating, comment], (err, result) => {
      if (err) {
        return sendError(res, 'রিভিউ সংরক্ষণ করতে সমস্যা হয়েছে: ' + err.message, null, 500);
      }

      return sendSuccess(
        res,
        'আপনার মূল্যবান রিভিউটি সফলভাবে যুক্ত হয়েছে! ⭐',
        {
          reviewId: result.insertId,
          bookId,
          rating,
          comment,
          ReviewerName: req.user.username,
          created_at: new Date()
        },
        null,
        201
      );
    });
  });
};

module.exports = {
  getReviewsByBook,
  addReview
};
