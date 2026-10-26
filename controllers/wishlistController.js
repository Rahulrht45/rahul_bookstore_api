// ============================================================
// ❤️ উইশলিস্ট কন্ট্রোলার (Wishlist / Favorites Controller)
// মেনি-টু-মেনি রিলেশনশিপ: ইউজারদের পছন্দের বই সংরক্ষণ ও পরিচালনা
// ============================================================

const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * ১. উইশলিস্ট টগল (Toggle Wishlist):
 * পছন্দের তালিকায় না থাকলে যুক্ত করবে, থাকলে মুছে ফেলবে
 * POST /api/wishlist/:bookId/toggle (🔒 Protected)
 */
const toggleWishlist = (req, res) => {
  const userId = req.user.id;
  const bookId = parseInt(req.params.bookId, 10);

  if (isNaN(bookId) || bookId <= 0) {
    return sendError(res, 'সঠিক বইয়ের আইডি প্রদান করুন!', null, 400);
  }

  // ১. বইটি ডাটাবেজে আছে কি না চেক করা
  db.query('SELECT Id, BookTitle FROM books WHERE Id = ?', [bookId], (err, books) => {
    if (err) {
      return sendError(res, 'ডাটাবেজ সমস্যা: ' + err.message, null, 500);
    }
    if (books.length === 0) {
      return sendError(res, 'বইটি খুঁজে পাওয়া যায়নি!', null, 404);
    }

    const book = books[0];

    // ২. উইশলিস্টে ইতিমধ্যে আছে কি না পরীক্ষা করা
    const checkSql = 'SELECT id FROM wishlist WHERE user_id = ? AND book_id = ?';
    db.query(checkSql, [userId, bookId], (checkErr, results) => {
      if (checkErr) {
        return sendError(res, 'উইশলিস্ট চেক করতে সমস্যা হয়েছে: ' + checkErr.message, null, 500);
      }

      if (results.length > 0) {
        // ইতিমধ্যে থাকলে: তালিকা থেকে মুছে ফেলা হবে (Remove)
        const deleteSql = 'DELETE FROM wishlist WHERE user_id = ? AND book_id = ?';
        db.query(deleteSql, [userId, bookId], (delErr) => {
          if (delErr) {
            return sendError(res, 'উইশলিস্ট থেকে সরাতে সমস্যা হয়েছে: ' + delErr.message, null, 500);
          }

          return sendSuccess(res, `"${book.BookTitle}" পছন্দের তালিকা থেকে সরানো হয়েছে 🤍`, {
            isWishlisted: false,
            bookId
          });
        });
      } else {
        // না থাকলে: তালিকায় নতুন যুক্ত করা হবে (Add)
        const insertSql = 'INSERT INTO wishlist (user_id, book_id) VALUES (?, ?)';
        db.query(insertSql, [userId, bookId], (insErr, insertResult) => {
          if (insErr) {
            return sendError(res, 'উইশলিস্টে যোগ করতে সমস্যা হয়েছে: ' + insErr.message, null, 500);
          }

          return sendSuccess(
            res,
            `"${book.BookTitle}" পছন্দের তালিকায় যুক্ত হয়েছে! ❤️`,
            {
              isWishlisted: true,
              bookId,
              wishlistId: insertResult.insertId
            },
            null,
            201
          );
        });
      }
    });
  });
};

/**
 * ২. লগইন করা ইউজারের পছন্দের বইগুলোর বিস্তারিত তালিকা পাওয়া
 * GET /api/wishlist (🔒 Protected)
 */
const getWishlist = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT 
      books.*, 
      users.username AS AddedBy,
      ROUND(AVG(reviews.rating), 1) AS avgRating,
      COUNT(reviews.id) AS totalReviews,
      wishlist.created_at AS wishlisted_at
    FROM wishlist
    JOIN books ON wishlist.book_id = books.Id
    LEFT JOIN users ON books.user_id = users.id
    LEFT JOIN reviews ON books.Id = reviews.book_id
    WHERE wishlist.user_id = ?
    GROUP BY books.Id, wishlist.id
    ORDER BY wishlist.created_at DESC
  `;

  db.query(sql, [userId], (err, books) => {
    if (err) {
      return sendError(res, 'পছন্দের তালিকা আনতে সমস্যা হয়েছে: ' + err.message, null, 500);
    }

    return sendSuccess(res, 'পছন্দের বইয়ের তালিকা সফলভাবে পাওয়া গেছে', books, {
      totalWishlist: books.length
    });
  });
};

/**
 * ৩. শুধুমাত্র পছন্দের বইগুলোর আইডি তালিকা পাওয়া (ফ্রন্টএন্ডের হার্ট আইকন লাল করার জন্য)
 * GET /api/wishlist/ids (🔒 Protected)
 */
const getWishlistBookIds = (req, res) => {
  const userId = req.user.id;

  const sql = 'SELECT book_id FROM wishlist WHERE user_id = ?';
  db.query(sql, [userId], (err, rows) => {
    if (err) {
      return sendError(res, 'আইডি তালিকা আনতে ব্যর্থ: ' + err.message, null, 500);
    }

    const ids = rows.map(r => r.book_id);
    return sendSuccess(res, 'উইশলিস্ট আইডি তালিকা', ids);
  });
};

module.exports = {
  toggleWishlist,
  getWishlist,
  getWishlistBookIds
};
