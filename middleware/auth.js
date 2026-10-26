const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'rahul_super_secret_enterprise_key_2026';

// ডিজিটাল টিকিট (টোকেন) চেক করার দারোয়ান (Middleware)
function verifyToken(req, res, next) {
  // ১. রিকোয়েস্টের হেডার থেকে টোকেন খোঁজা
  const authHeader = req.headers['authorization'];
  // টোকেন সাধারণত "Bearer <token>" আকারে আসে
  const token = authHeader && authHeader.split(' ')[1];

  // ২. টোকেন না থাকলে সরাসরি আটকে দেওয়া
  if (!token) {
    return res.status(401).json({ error: 'প্রবেশ নিষেধ! কোনো টোকেন (Token) প্রদান করা হয়নি।' });
  }

  // ৩. টোকেনটি আসল কি না যাচাই করা
  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: 'ভুয়া বা মেয়াদোত্তীর্ণ টোকেন!' });
    }

    // ৪. টোকেন সঠিক হলে ইউজারের তথ্য req.user-এ সংরক্ষণ করা
    req.user = decodedUser;
    next(); // পরের ধাপে যাওয়ার অনুমতি দেওয়া
  });
}

verifyToken.verifyToken = verifyToken;
verifyToken.authenticateToken = verifyToken;
module.exports = verifyToken;
