// ============================================================
// 🎮 বুকস কন্ট্রোলার (Books Controller)
// বই সংক্রান্ত সমস্ত ডাটাবেজ কুয়েরি ও বিজনেস লজিক
// ============================================================

const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * ১. বইয়ের তালিকা আনা (সার্চ, ফিল্টার ও পেজিনেশন সহ)
 * GET /api/books
 */
const getAllBooks = (req, res) => {
  const search = req.query.search ? req.query.search.trim() : null;
  const minPrice = req.query.minPrice !== undefined && req.query.minPrice !== '' ? Number(req.query.minPrice) : null;
  const maxPrice = req.query.maxPrice !== undefined && req.query.maxPrice !== '' ? Number(req.query.maxPrice) : null;

  const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
  const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 10;
  const offset = (page - 1) * limit;

  // ডায়নামিক WHERE শর্ত
  const conditions = [];
  const queryParams = [];

  if (search) {
    conditions.push('(books.BookTitle LIKE ? OR books.Author LIKE ?)');
    queryParams.push(`%${search}%`, `%${search}%`);
  }

  if (minPrice !== null && !isNaN(minPrice)) {
    conditions.push('books.Price >= ?');
    queryParams.push(minPrice);
  }

  if (maxPrice !== null && !isNaN(maxPrice)) {
    conditions.push('books.Price <= ?');
    queryParams.push(maxPrice);
  }

  const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

  const sortBy = req.query.sortBy || 'newest';
  let orderClause = 'ORDER BY books.Id DESC'; // ডিফল্ট: নতুন বই আগে

  if (sortBy === 'price_asc') {
    orderClause = 'ORDER BY CAST(books.Price AS DECIMAL(10,2)) ASC';
  } else if (sortBy === 'price_desc') {
    orderClause = 'ORDER BY CAST(books.Price AS DECIMAL(10,2)) DESC';
  } else if (sortBy === 'title_asc') {
    orderClause = 'ORDER BY books.BookTitle ASC';
  } else if (sortBy === 'rating_desc') {
    orderClause = 'ORDER BY avgRating DESC, totalReviews DESC';
  }

  // ১. মোট বই গণনা
  const countSql = `SELECT COUNT(*) AS total FROM books ${whereClause}`;

  db.query(countSql, queryParams, (err, countResult) => {
    if (err) {
      return sendError(res, 'বইয়ের সংখ্যা গণনা করতে সমস্যা হয়েছে: ' + err.message, null, 500);
    }

    const totalBooks = countResult[0].total;
    const totalPages = Math.ceil(totalBooks / limit) || 1;

    // ২. পেজিনেশন সহ বইয়ের তালিকা আনা (রিভিউ পরিসংখ্যান সহ)
    const dataSql = `
      SELECT 
        books.*, 
        users.username AS AddedBy,
        ROUND(AVG(reviews.rating), 1) AS avgRating,
        COUNT(reviews.id) AS totalReviews
      FROM books 
      LEFT JOIN users ON books.user_id = users.id 
      LEFT JOIN reviews ON books.Id = reviews.book_id 
      ${whereClause}
      GROUP BY books.Id
      ${orderClause} 
      LIMIT ? OFFSET ?
    `;

    db.query(dataSql, [...queryParams, limit, offset], (err, books) => {
      if (err) {
        return sendError(res, 'বইয়ের তালিকা আনতে সমস্যা হয়েছে: ' + err.message, null, 500);
      }

      return sendSuccess(
        res,
        'বইয়ের তালিকা সফলভাবে পাওয়া গেছে',
        books,
        {
          totalBooks,
          totalPages,
          currentPage: page,
          limit
        }
      );
    });
  });
};

/**
 * ২. নির্দিষ্ট একটি বইয়ের তথ্য পাওয়া
 * GET /api/books/:id
 */
const getBookById = (req, res) => {
  const bookId = req.params.id;
  const sql = `
    SELECT 
      books.*, 
      users.username AS AddedBy,
      ROUND(AVG(reviews.rating), 1) AS avgRating,
      COUNT(reviews.id) AS totalReviews
    FROM books 
    LEFT JOIN users ON books.user_id = users.id 
    LEFT JOIN reviews ON books.Id = reviews.book_id
    WHERE books.Id = ?
    GROUP BY books.Id
  `;

  db.query(sql, [bookId], (err, results) => {
    if (err) {
      return sendError(res, 'বইয়ের তথ্য আনতে সমস্যা হয়েছে: ' + err.message, null, 500);
    }
    if (results.length === 0) {
      return sendError(res, 'বইটি খুঁজে পাওয়া যায়নি!', null, 404);
    }

    return sendSuccess(res, 'বইয়ের বিবরণ সফলভাবে পাওয়া গেছে', results[0]);
  });
};

/**
 * ৩. নতুন বই যোগ করা
 * POST /api/books (🔒 Protected)
 */
const createBook = (req, res) => {
  const BookTitle = (req.body.BookTitle || req.body.Booktitle || req.body.booktitle || req.body.title).trim();
  const Author = (req.body.Author || req.body.author).trim();
  const Price = Number(req.body.Price !== undefined ? req.body.Price : req.body.price);
  const CoverImage = req.file ? req.file.filename : null;
  const userId = req.user.id;

  const sql = 'INSERT INTO books (BookTitle, Author, Price, CoverImage, user_id) VALUES (?, ?, ?, ?, ?)';

  db.query(sql, [BookTitle, Author, Price, CoverImage, userId], (err, result) => {
    if (err) {
      return sendError(res, 'ডাটাবেজে বই সংরক্ষণ করতে সমস্যা হয়েছে: ' + err.message, null, 500);
    }

    return sendSuccess(
      res,
      'অভিনন্দন! নতুন বই সফলভাবে যোগ হয়েছে! 🎉',
      {
        id: result.insertId,
        BookTitle,
        Author,
        Price,
        CoverImage,
        AddedBy: req.user.username,
        user_id: userId
      },
      null,
      201
    );
  });
};

/**
 * ৪. বইয়ের তথ্য আপডেট করা
 * PUT /api/books/:id (🔒 Protected)
 */
const updateBook = (req, res) => {
  const bookId = req.params.id;
  const BookTitle = (req.body.BookTitle || req.body.Booktitle || req.body.booktitle || req.body.title).trim();
  const Author = (req.body.Author || req.body.author).trim();
  const Price = Number(req.body.Price !== undefined ? req.body.Price : req.body.price);

  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  db.query('SELECT * FROM books WHERE Id = ?', [bookId], (err, books) => {
    if (err) {
      return sendError(res, 'ডাটাবেজ সমস্যা: ' + err.message, null, 500);
    }
    if (books.length === 0) {
      return sendError(res, 'বইটি খুঁজে পাওয়া যায়নি!', null, 404);
    }

    const book = books[0];
    const isAdmin = currentUserRole === 'admin';
    const isOwner = book.user_id && Number(book.user_id) === Number(currentUserId);

    if (!isOwner && !isAdmin) {
      return sendError(res, 'অনুমতি নেই! আপনি এই বইয়ের মালিক নন এবং আপনি অ্যাডমিনও নন।', null, 403);
    }

    let sql = 'UPDATE books SET BookTitle = ?, Author = ?, Price = ? WHERE Id = ?';
    let params = [BookTitle, Author, Price, bookId];

    if (req.file) {
      // পুরাতন ছবি থাকলে তা হার্ডডিস্ক থেকে মুছে ফেলা
      if (book.CoverImage) {
        const oldImgPath = path.join(__dirname, '../uploads', book.CoverImage);
        if (fs.existsSync(oldImgPath)) {
          fs.unlinkSync(oldImgPath);
        }
      }
      sql = 'UPDATE books SET BookTitle = ?, Author = ?, Price = ?, CoverImage = ? WHERE Id = ?';
      params = [BookTitle, Author, Price, req.file.filename, bookId];
    }

    db.query(sql, params, (updateErr) => {
      if (updateErr) {
        return sendError(res, 'বইয়ের তথ্য আপডেট করতে সমস্যা হয়েছে: ' + updateErr.message, null, 500);
      }

      return sendSuccess(res, 'বইয়ের তথ্য সফলভাবে আপডেট হয়েছে! ✏️');
    });
  });
};

/**
 * ৫. বই মুছে ফেলা
 * DELETE /api/books/:id (🔒 Protected)
 */
const deleteBook = (req, res) => {
  const bookId = req.params.id;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  db.query('SELECT * FROM books WHERE Id = ?', [bookId], (err, books) => {
    if (err) {
      return sendError(res, 'ডাটাবেজ সমস্যা: ' + err.message, null, 500);
    }
    if (books.length === 0) {
      return sendError(res, 'বইটি খুঁজে পাওয়া যায়নি!', null, 404);
    }

    const book = books[0];
    const isAdmin = currentUserRole === 'admin';
    const isOwner = book.user_id && Number(book.user_id) === Number(currentUserId);

    if (!isOwner && !isAdmin) {
      return sendError(res, 'অনুমতি নেই! আপনি এই বইয়ের মালিক নন এবং আপনি অ্যাডমিনও নন।', null, 403);
    }

    const sql = 'DELETE FROM books WHERE Id = ?';
    db.query(sql, [bookId], (deleteErr) => {
      if (deleteErr) {
        return sendError(res, 'বইটি মুছে ফেলতে সমস্যা হয়েছে: ' + deleteErr.message, null, 500);
      }

      // হার্ডডিস্ক থেকে কভার ইমেজ ডিলিট করা
      if (book.CoverImage) {
        const imgPath = path.join(__dirname, '../uploads', book.CoverImage);
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      }

      return sendSuccess(res, 'বই এবং এর ছবি সফলভাবে মুছে ফেলা হয়েছে! 🗑️');
    });
  });
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};
