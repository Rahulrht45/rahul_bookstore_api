// ============================================================
// 🎮 অথেনটিকেশন কন্ট্রোলার (Auth Controller)
// ইউজার রেজিস্ট্রেশন ও লগইন সংক্রান্ত সমস্ত বিজনেস লজিক
// ============================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'rahul_super_secret_enterprise_key_2026';

/**
 * ১. নতুন ইউজার রেজিস্ট্রেশন (POST /api/register)
 */
const register = async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';

    db.query(sql, [username, hashedPassword], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return sendError(res, 'এই ইউজারনেমটি ইতিমধ্যে নেওয়া হয়েছে!', null, 400);
        }
        return sendError(res, 'ডাটাবেজে ইউজার যুক্ত করতে সমস্যা হয়েছে: ' + err.message, null, 500);
      }

      return sendSuccess(
        res,
        'অভিনন্দন! আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।',
        { userId: result.insertId, username },
        null,
        201
      );
    });
  } catch (error) {
    return sendError(res, 'সার্ভার ইন্টারনাল এরর: ' + error.message, null, 500);
  }
};

/**
 * ২. ইউজার লগইন (POST /api/login)
 */
const login = (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM users WHERE username = ?';

  db.query(sql, [username], async (err, results) => {
    if (err) {
      return sendError(res, 'ডাটাবেজ এরর: ' + err.message, null, 500);
    }

    if (results.length === 0) {
      return sendError(res, 'এই ইউজারনেমে কোনো অ্যাকাউন্ট পাওয়া যায়নি!', null, 404);
    }

    const user = results[0];

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return sendError(res, 'ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।', null, 401);
      }

      // ১ ঘণ্টার মেয়াদে ডিজিটাল JWT টোকেন তৈরি করা
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role || 'user' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      return sendSuccess(
        res,
        'লগইন সফল হয়েছে! 🔑',
        {
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role || 'user'
          }
        }
      );
    } catch (error) {
      return sendError(res, 'সার্ভার ইন্টারনাল এরর: ' + error.message, null, 500);
    }
  });
};

module.exports = {
  register,
  login
};
