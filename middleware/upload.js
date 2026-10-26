const multer = require('multer');

// Multer Storage কনফিগারেশন: ছবি কোথায় ও কী নামে সেভ হবে
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // প্রতিটা ছবির নাম ইউনিক করার জন্য সময়ের সাথে মূল নাম যোগ করা
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

module.exports = upload;
