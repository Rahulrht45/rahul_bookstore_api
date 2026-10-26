// ============================================================
// 🛒 অর্ডার কন্ট্রোলার (Orders & Checkout Controller)
// শপিং কার্ট থেকে অর্ডার তৈরি ও পূর্ববর্তী অর্ডারের হিস্টোরি
// ============================================================

const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * ১. নতুন অর্ডার তৈরি করা (Checkout)
 * POST /api/orders (🔒 Protected)
 * Body: { items: [ { bookId: 10, quantity: 2 }, ... ] }
 */
const checkoutOrder = (req, res) => {
  const userId = req.user.id;
  const items = req.body.items;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return sendError(res, 'কার্টে কমপক্ষে একটি বই থাকা আবশ্যক!', null, 400);
  }

  // আইটেমগুলো ভ্যালিডেট করা
  const bookIds = [];
  const qtyMap = {};

  for (const item of items) {
    const bookId = parseInt(item.bookId, 10);
    const quantity = parseInt(item.quantity, 10);

    if (isNaN(bookId) || bookId <= 0 || isNaN(quantity) || quantity <= 0) {
      return sendError(res, 'কার্টের বই বা পরিমাণের তথ্য সঠিক নয়!', null, 400);
    }

    bookIds.push(bookId);
    qtyMap[bookId] = (qtyMap[bookId] || 0) + quantity;
  }

  // সিকিউরিটি: ফ্রন্টএন্ডের দাম বিশ্বাস না করে ডাটাবেজ থেকে আসল দাম আনা
  const placeholders = bookIds.map(() => '?').join(',');
  const booksSql = `SELECT Id, BookTitle, Price FROM books WHERE Id IN (${placeholders})`;

  db.query(booksSql, bookIds, (err, books) => {
    if (err) {
      return sendError(res, 'ডাটাবেজ সমস্যা: ' + err.message, null, 500);
    }

    if (books.length === 0) {
      return sendError(res, 'কার্টের কোনো বই ডাটাবেজে পাওয়া যায়নি!', null, 404);
    }

    let totalAmount = 0;
    let totalItems = 0;
    const orderItemsData = [];

    for (const book of books) {
      const qty = qtyMap[book.Id] || 1;
      const unitPrice = parseFloat(book.Price) || 0;
      const subtotal = unitPrice * qty;

      totalAmount += subtotal;
      totalItems += qty;

      orderItemsData.push({
        bookId: book.Id,
        title: book.BookTitle,
        quantity: qty,
        unitPrice,
        subtotal
      });
    }

    // ১. orders টেবিলে মূল অর্ডার সংরক্ষণ
    const orderSql = 'INSERT INTO orders (user_id, total_amount, total_items) VALUES (?, ?, ?)';
    db.query(orderSql, [userId, totalAmount, totalItems], (orderErr, orderResult) => {
      if (orderErr) {
        return sendError(res, 'অর্ডার সংরক্ষণ করতে সমস্যা হয়েছে: ' + orderErr.message, null, 500);
      }

      const orderId = orderResult.insertId;

      // ২. order_items টেবিলে প্রতিটি বইয়ের বিবরণ সংরক্ষণ
      const itemValues = orderItemsData.map(item => [
        orderId,
        item.bookId,
        item.quantity,
        item.unitPrice,
        item.subtotal
      ]);

      const itemsSql = 'INSERT INTO order_items (order_id, book_id, quantity, unit_price, subtotal) VALUES ?';
      db.query(itemsSql, [itemValues], (itemsErr) => {
        if (itemsErr) {
          return sendError(res, 'অর্ডারের বিবরণ সংরক্ষণ ব্যর্থ: ' + itemsErr.message, null, 500);
        }

        return sendSuccess(
          res,
          'আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে! 🛍️',
          {
            orderId,
            totalAmount,
            totalItems,
            items: orderItemsData,
            status: 'completed',
            created_at: new Date()
          },
          null,
          201
        );
      });
    });
  });
};

/**
 * ২. ইউজারের সমস্ত অর্ডারের ইতিহাস পাওয়া
 * GET /api/orders (🔒 Protected)
 */
const getMyOrders = (req, res) => {
  const userId = req.user.id;

  const ordersSql = `
    SELECT id, total_amount, total_items, status, created_at 
    FROM orders 
    WHERE user_id = ? 
    ORDER BY id DESC
  `;

  db.query(ordersSql, [userId], (err, orders) => {
    if (err) {
      return sendError(res, 'অর্ডার তালিকা আনতে সমস্যা হয়েছে: ' + err.message, null, 500);
    }

    if (orders.length === 0) {
      return sendSuccess(res, 'কোনো পূর্ববর্তী অর্ডার পাওয়া যায়নি', []);
    }

    const orderIds = orders.map(o => o.id);
    const placeholders = orderIds.map(() => '?').join(',');

    const itemsSql = `
      SELECT 
        oi.id, oi.order_id, oi.book_id, oi.quantity, oi.unit_price, oi.subtotal,
        b.BookTitle, b.Author, b.CoverImage
      FROM order_items oi
      JOIN books b ON oi.book_id = b.Id
      WHERE oi.order_id IN (${placeholders})
    `;

    db.query(itemsSql, orderIds, (itemsErr, items) => {
      if (itemsErr) {
        return sendError(res, 'অর্ডারের আইটেম আনতে সমস্যা হয়েছে: ' + itemsErr.message, null, 500);
      }

      // অর্ডার অনুযায়ী আইটেম গুছিয়ে ফেলা
      const itemsByOrder = {};
      items.forEach(item => {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
        itemsByOrder[item.order_id].push(item);
      });

      const fullOrders = orders.map(order => ({
        ...order,
        items: itemsByOrder[order.id] || []
      }));

      return sendSuccess(res, 'অর্ডার ইতিহাস সফলভাবে পাওয়া গেছে', fullOrders);
    });
  });
};

module.exports = {
  checkoutOrder,
  getMyOrders
};
