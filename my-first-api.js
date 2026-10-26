const express = require('express');
const app = express();
app.use(express.json()); // খাম খোলার মেশিন

// 🟢 নতুন কোড ১: ডাটাবেজ তার ও কানেকশন
const mysql = require('mysql2');
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'rahul',
  waitForConnections: true,
  connectionLimit: 10
});

// ১. হোমপেজ রুট
app.get('/', (req, res) => {
  res.send('স্বাগতম রাহুল ভাই! আপনার প্রথম সার্ভার সফলভাবে চালু হয়েছে!');
});

// ২. এবাউট রুট
app.get('/about', (req, res) => {
  res.send('আমি রাহুল, একজন ফুল-স্ট্যাক ওয়েব ডেভেলপার!');
});

// ৩. প্রোফাইল রুট (JSON)
app.get('/api/profile', (req, res) => {
  res.json({
    name: 'Rahul',
    role: 'Full-Stack Developer',
    skills: ['JavaScript', 'SQL', 'Node.js'],
    isAvailable: true
  });
});

// 🟢 নতুন কোড ২: ডাটাবেজ থেকে রক্তদাতাদের এনে দেওয়া
app.get('/api/donors', (req, res) => {
  db.query('SELECT * FROM Donors', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});
app.get('/api/donors/:id', (req, res) => {
  const donorid = req.params.id;

  const sql = 'SELECT * FROM Donors WHERE DonorID=?';

  db.query(sql, [donorid], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results[0]);
  });
});

// ৫. রক্তদাতা মুছে ফেলা (DELETE রুট)
app.delete('/api/donors/:id', (req, res) => {
  const donorid = req.params.id;
  const sql = 'DELETE FROM Donors WHERE DonorID=?';
  db.query(sql, [donorid], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'এই আইডি বিশিষ্ট কোনো রক্তদাতা খুঁজে পাওয়া যায়নি!' });
    }
    res.json({ message: 'রক্তদাতার তথ্য সফলভাবে মুছে ফেলা হয়েছে!' });
  });
});

// 🟢 ৬. নতুন রক্তদাতা তৈরি করা (POST রুট)
app.post('/api/donors', (req, res) => {
  const { DonorName, BloodGroup, PhoneNumber, city } = req.body;

  // ১. ভ্যালিডেশন: নাম ও রক্তের গ্রুপ থাকা বাধ্যতামূলক
  if (!DonorName || !BloodGroup) {
    return res.status(400).json({ error: 'DonorName এবং BloodGroup দেওয়া বাধ্যতামূলক!' });
  }

  const sql = 'INSERT INTO Donors (DonorName, BloodGroup, PhoneNumber, city) VALUES (?, ?, ?, ?)';
  db.query(sql, [DonorName, BloodGroup, PhoneNumber, city || 'Dhaka'], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      message: 'অভিনন্দন! নতুন রক্তদাতা যুক্ত হয়েছে!',
      newId: result.insertId
    });
  });
});

// 🟢 ৭. রক্তদাতার তথ্য আপডেট করা (PUT রুট)
app.put('/api/donors/:id', (req, res) => {
  const donorId = req.params.id;
  const { PhoneNumber, city } = req.body;

  // ১. ভ্যালিডেশন: ফোন ও শহরের তথ্য চেক করা
  if (!PhoneNumber || !city) {
    return res.status(400).json({ error: 'PhoneNumber এবং city উভয় তথ্যই প্রদান করুন!' });
  }

  const sql = 'UPDATE Donors SET PhoneNumber=?, city=? WHERE DonorID=?';
  db.query(sql, [PhoneNumber, city, donorId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // যদি ডাটাবেজে এই আইডির কেউ না থাকে
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'এই আইডি বিশিষ্ট কোনো রক্তদাতা পাওয়া যায়নি!' });
    }
    res.json({ message: 'রক্তদাতার তথ্য সফলভাবে আপডেট হয়েছে!' });
  });
});
















// ৪. ৩০০০ নম্বর পোর্টে সার্ভার চালু করা
app.listen(3000, () => {
  console.log('🚀 Server is running: http://localhost:3000');
});
