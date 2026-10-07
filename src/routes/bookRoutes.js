const express = require('express');
const router = express.Router();
const { readDb, writeDb } = require('../config/db');

// GET / - Chuyển hướng về trang danh sách sách
router.get('/', (req, res) => {
  res.redirect('/books');
});

// GET /books - Lấy danh sách sách bằng readDb
router.get('/books', async (req, res) => {
  try {
    const books = await readDb.collection('books').find().sort({ createdAt: -1 }).toArray();
    res.render('books', {
      books,
      sessionViews: req.session.views
    });
  } catch (error) {
    console.error('Lỗi khi đọc danh sách sách (readDb):', error);
    res.status(500).render('books', {
      error: 'Không thể tải danh sách sách từ cơ sở dữ liệu.'
    });
  }
});

// POST /books - Thêm sách mới bằng writeDb
router.post('/books', async (req, res) => {
  const { code, title, price } = req.body;
  const PRODUCT_PREFIX = process.env.PRODUCT_PREFIX || '231';
  const VAT_RATE = Number(process.env.VAT_RATE) || 0.07;

  // Kiểm tra dữ liệu đầu vào cơ bản
  if (!code || !title || !price) {
    const books = await readDb.collection('books').find().sort({ createdAt: -1 }).toArray();
    return res.status(400).render('books', {
      books,
      error: 'Vui lòng điền đầy đủ mã sách, tên sách và giá.',
      formData: { code, title, price }
    });
  }

  // Bộ lọc mã sản phẩm theo tiền tố MSSV (231)
  if (!String(code).startsWith(PRODUCT_PREFIX)) {
    const books = await readDb.collection('books').find().sort({ createdAt: -1 }).toArray();
    return res.status(400).render('books', {
      books,
      error: `Mã sản phẩm phải bắt đầu bằng ${PRODUCT_PREFIX}.`,
      formData: { code, title, price }
    });
  }

  try {
    const priceBeforeTax = Number(price);
    const priceAfterTax = Math.round((priceBeforeTax * (1 + VAT_RATE) + Number.EPSILON) * 100) / 100;

    await writeDb.collection('books').insertOne({
      code: String(code).trim(),
      title: String(title).trim(),
      priceBeforeTax,
      vatRate: VAT_RATE,
      priceAfterTax,
      createdAt: new Date()
    });

    res.redirect('/books');
  } catch (error) {
    console.error('Lỗi khi ghi sách mới (writeDb):', error);
    const books = await readDb.collection('books').find().sort({ createdAt: -1 }).toArray();
    res.status(500).render('books', {
      books,
      error: 'Không thể thêm sách vào cơ sở dữ liệu.',
      formData: { code, title, price }
    });
  }
});

module.exports = router;
