# 📚 Rahul's Fullstack Bookstore API (লাইভ ক্লাউড এপিআই)

রাহুল ভাইয়ের প্রফেশনাল ও মডুলার ফুলস্ট্যাক বুকস্টোর REST API। এই এপিআই সম্পূর্ণ ক্লাউডে হোস্ট করা হয়েছে এবং গ্লোবালি লাইভ রয়েছে।

## 🌐 লাইভ লিংক ও রিপোজিটরি
- **লাইভ এপিআই ইউআরএল:** [https://my-first-api-zeta.vercel.app](https://my-first-api-zeta.vercel.app)
- **গিটহাব রিপোজিটরি:** [https://github.com/Rahulrht45/rahul_bookstore_api](https://github.com/Rahulrht45/rahul_bookstore_api)
- **ক্লাউড ডাটাবেজ:** TiDB Cloud Serverless (AWS Tokyo, MySQL 8 Compatible with TLSv1.2)

---

## 🚀 প্রধান এপিআই এন্ডপয়েন্টসমূহ

### ১. বই ব্যবস্থাপনা (Books CRUD & Statistics)
- `GET /api/books` - সব বইয়ের তালিকা (সার্চ, ফিল্টারিং, পেজিনেশন ও রিভিউ রেটিং সহ)
- `GET /api/books/:id` - নির্দিষ্ট বইয়ের বিস্তারিত ও গড় রেটিং
- `POST /api/books` - নতুন বই যোগ করা (🔒 JWT টোকেন ও কভার ছবি আপলোড সহ)
- `PUT /api/books/:id` - বইয়ের তথ্য বা ছবি আপডেট (🔒 শুধুমাত্র মালিক বা এডমিন)
- `DELETE /api/books/:id` - বই মুছে ফেলা (🔒 শুধুমাত্র মালিক বা এডমিন)

### ২. ইউজার অথেনটিকেশন (Authentication)
- `POST /api/register` - নতুন ইউজার অ্যাকাউন্ট তৈরি (Bcrypt পাসওয়ার্ড হ্যাশ)
- `POST /api/login` - লগইন ও ডিজিটাল JWT সিকিউর টোকেন গ্রহণ

### ৩. অ্যাডভান্সড ফিচারসমূহ
- `GET/POST /api/wishlist` - প্রিয় বইয়ের উইশলিস্ট টগল ও ভিউ
- `GET/PUT /api/profile` - ইউজার প্রোফাইল ড্যাশবোর্ড ও পাসওয়ার্ড পরিবর্তন
- `GET/POST /api/orders` - শপিং কার্ট চেকআউট ও অর্ডার হিস্টোরি

---

## 🛡️ সাইবার সিকিউরিটি ব্যবস্থা
- `helmet`: HTTP রেসপন্স হেডার সুরক্ষা ও আক্রমণকারী থেকে প্রযুক্তি গোপন রাখা
- `cors`: নিরাপদ ক্রস-অরিজিন ডোমেইন শেয়ারিং
- `express-rate-limit`: DDoS ও ব্রুট-ফোর্স হ্যাকিং প্রতিরোধে রেট লিমিটিং
