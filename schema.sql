-- ============================================================
-- 📚 রাহুল বুকস্টোর ডাটাবেজ স্কিমা (Database Schema & Sample Data)
-- TiDB Cloud / Aiven / Local MySQL এ চালানোর জন্য সম্পূর্ণ প্রস্তুত
-- ============================================================

-- ০. TiDB Cloud এর ডিফল্ট ডাটাবেজ নির্বাচন
USE test;

-- ১. ইউজার টেবিল (Users Table)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ২. বইয়ের টেবিল (Books Table)
CREATE TABLE IF NOT EXISTS books (
  Id INT AUTO_INCREMENT PRIMARY KEY,
  BookTitle VARCHAR(255) NOT NULL,
  Author VARCHAR(255) NOT NULL,
  Price DECIMAL(10,2) NOT NULL,
  CoverImage VARCHAR(255) DEFAULT NULL,
  user_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ৩. রিভিউ ও স্টার রেটিং টেবিল (Reviews Table)
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(Id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ৪. উইশলিস্ট বা প্রিয় বইয়ের টেবিল (Wishlist Table)
CREATE TABLE IF NOT EXISTS wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_book (user_id, book_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(Id) ON DELETE CASCADE
);

-- ৫. অর্ডার টেবিল (Orders Table)
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  total_items INT NOT NULL,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ৬. অর্ডারের ভেতরের বইয়ের তালিকা (Order Items Table)
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  book_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(Id) ON DELETE CASCADE
);

-- ============================================================
-- 🌟 প্রাথমিক ডাটা (Initial Data)
-- ইউজার: rahul (Password: 123456), রোল: admin
-- ============================================================
INSERT INTO users (id, username, password, role) VALUES 
(1, 'rahul', '$2a$10$vN9m3G7i6pL41sUe3J5K3Om3wzU.U7m5yVvE.l5XqPZp6t6R6n1mK', 'admin')
ON DUPLICATE KEY UPDATE username=username;

-- কিছু সেরা বইয়ের স্যাম্পল ডাটা
INSERT INTO books (Id, BookTitle, Author, Price, user_id) VALUES
(1, 'Zero to One', 'Peter Thiel', 499.00, 1),
(2, 'The 7 Habits of Highly Effective People', 'Stephen R. Covey', 550.00, 1),
(3, 'Start With Why', 'Simon Sinek', 420.00, 1),
(4, 'The Psychology of Money', 'Morgan Housel', 380.00, 1),
(5, 'Atomic Habits', 'James Clear', 450.00, 1),
(6, 'Deep Work', 'Cal Newport', 410.00, 1)
ON DUPLICATE KEY UPDATE BookTitle=BookTitle;
