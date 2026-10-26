// 📚 রাহুল ভাইয়ের বুকস্টোর এপিআই (Main Server Entry Point)
// প্রফেশনাল মডুলার আর্কিটেকচার অনুযায়ী কোড সাজানো হয়েছে।

require('dotenv').config(); // গোপন এনভায়রনমেন্ট ভ্যারিয়েবল লোড করা
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { globalLimiter } = require('./middleware/security');

const app = express();

// ১. নিরাপত্তা বর্ম ও CORS সক্রিয় করা
app.use(helmet({ contentSecurityPolicy: false })); // হেডার সিকিউরিটি ও X-Powered-By লুকানো
app.use(cors());                                  // নিরাপদ ক্রস-অরিজিন শেয়ারিং

// ২. ক্লায়েন্ট থেকে আসা JSON ডাটা পড়ার মিডলওয়্যার
app.use(express.json());

// ৩. আপলোড করা ছবি ব্রাউজারে সরাসরি দেখার সুবিধা
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ৪. এপিআই রেট লিমিটিং (DDoS ও স্প্যাম প্রতিরোধ)
app.use('/api', globalLimiter);

// রুট মডিউলগুলো ইমপোর্ট করা
const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const wishlistRoutes = require('./routes/wishlist');
const profileRoutes = require('./routes/profile');
const orderRoutes = require('./routes/orders');

// এপিআই রুটগুলো যুক্ত করা
app.use('/api', authRoutes);         // /api/register এবং /api/login
app.use('/api/books', booksRoutes);   // /api/books এর সব CRUD ও ইমেজ আপলোড
app.use('/api/wishlist', wishlistRoutes); // /api/wishlist এর ফেভারিট ব্যবস্থাপনা
app.use('/api/profile', profileRoutes);   // /api/profile এর ড্যাশবোর্ড ও পাসওয়ার্ড চেঞ্জ
app.use('/api/orders', orderRoutes);     // /api/orders এর শপিং কার্ট চেকআউট ও হিস্টোরি

// ফ্রন্টএন্ড ওয়েবসাইট ফাইলগুলো পরিবেশন করা (Static Frontend)
app.use(express.static(path.join(__dirname, 'public')));

// হোমপেজে সরাসরি ফ্রন্টএন্ড HTML লোড করা
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// এবাউট রুট
app.get('/aboutme', (req, res) => {
  res.send('I am rahul, a full-stack developer! This is my books API.');
});

// সার্ভার চালু করা (Local ও Cloud সার্ভার উভয়ের জন্য প্রস্তুত)
const PORT = process.env.PORT || 3001;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Books API Server started: http://localhost:${PORT}`);
  });
}

module.exports = app;