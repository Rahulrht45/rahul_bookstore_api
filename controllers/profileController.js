// ============================================================
// 👤 প্রোফাইল কন্ট্রোলার (User Profile & Security Controller)
// ব্যবহারকারীর নিজস্ব তথ্য, পরিসংখ্যান ও পাসওয়ার্ড পরিবর্তন
// ============================================================

const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * ১. প্রোফাইল ও ড্যাশবোর্ড পরিসংখ্যান পাওয়া
 * GET /api/profile (🔒 Protected)
 */
const getProfile = (req, res) => {
  const userId = req.user.id;

  // ইউজারের তথ্য আনা
  const userSql = 'SELECT id, username, role, created_at FROM users WHERE id = ?';
  db.query(userSql, [userId], (err, users) => {
    if (err) {
      return sendError(res, 'প্রোফাইল লোড করতে সমস্যা হয়েছে: ' + err.message, null, 500);
    }
    if (users.length === 0) {
      return sendError(res, 'ইউজার খুঁজে পাওয়া যায়নি!', null, 404);
    }

    const user = users[0];

    // ইউজারের ৩টি পরিসংখ্যান গণনা করা (আপলোড, রিভিউ, উইশলিস্ট)
    const statsSql = `
      SELECT 
        (SELECT COUNT(*) FROM books WHERE user_id = ?) AS uploadedBooks,
        (SELECT COUNT(*) FROM reviews WHERE user_id = ?) AS totalReviews,
        (SELECT COUNT(*) FROM wishlist WHERE user_id = ?) AS totalWishlist
    `;

    db.query(statsSql, [userId, userId, userId], (statsErr, statsResult) => {
      if (statsErr) {
        return sendError(res, 'পরিসংখ্যান আনতে সমস্যা হয়েছে: ' + statsErr.message, null, 500);
      }

      const stats = statsResult[0] || { uploadedBooks: 0, totalReviews: 0, totalWishlist: 0 };

      return sendSuccess(res, 'প্রোফাইল সফলভাবে পাওয়া গেছে', {
        user,
        stats
      });
    });
  });
};

/**
 * ২. পাসওয়ার্ড পরিবর্তন করা (Change Password)
 * PUT /api/profile/change-password (🔒 Protected)
 */
const changePassword = (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;
  const errors = {};

  if (!currentPassword || typeof currentPassword !== 'string' || currentPassword.trim() === '') {
    errors.currentPassword = 'বর্তমান পাসওয়ার্ড প্রদান করা আবশ্যক!';
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    errors.newPassword = 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে!';
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.newPassword = 'নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ডের মতো একই হতে পারবে না!';
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 'পাসওয়ার্ড পরিবর্তনের তথ্য সঠিক নয়!', errors, 400);
  }

  // ডাটাবেজ থেকে বর্তমান পাসওয়ার্ড হ্যাশ আনা
  db.query('SELECT password FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      return sendError(res, 'ডাটাবেজ সমস্যা: ' + err.message, null, 500);
    }
    if (results.length === 0) {
      return sendError(res, 'ইউজার পাওয়া যায়নি!', null, 404);
    }

    const currentHash = results[0].password;

    // বর্তমান পাসওয়ার্ড যাচাই করা
    bcrypt.compare(currentPassword, currentHash, (compErr, isMatch) => {
      if (compErr) {
        return sendError(res, 'পাসওয়ার্ড পরীক্ষা করতে সমস্যা হয়েছে!', null, 500);
      }
      if (!isMatch) {
        return sendError(res, 'বর্তমান পাসওয়ার্ড সঠিক নয়!', { currentPassword: 'ভুল পাসওয়ার্ড দিয়েছেন!' }, 400);
      }

      // নতুন পাসওয়ার্ড হ্যাশ করা
      bcrypt.hash(newPassword, 10, (hashErr, newHash) => {
        if (hashErr) {
          return sendError(res, 'নতুন পাসওয়ার্ড হ্যাশ করতে সমস্যা হয়েছে!', null, 500);
        }

        // ডাটাবেজে নতুন পাসওয়ার্ড সংরক্ষণ
        db.query('UPDATE users SET password = ? WHERE id = ?', [newHash, userId], (updateErr) => {
          if (updateErr) {
            return sendError(res, 'পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে: ' + updateErr.message, null, 500);
          }

          return sendSuccess(res, 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে! 🔑');
        });
      });
    });
  });
};

module.exports = {
  getProfile,
  changePassword
};
