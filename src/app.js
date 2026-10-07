require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const connectMongo = require('connect-mongo');
const { engine } = require('express-handlebars');
const { connectDB } = require('./config/db');
const bookRoutes = require('./routes/bookRoutes');

const MongoStore = connectMongo.create ? connectMongo : (connectMongo.MongoStore || connectMongo.default);

const app = express();
const PORT = process.env.PORT || 3000;

// Hỗ trợ reverse proxy khi deploy lên PaaS (Render)
app.set('trust proxy', 1);

// Middleware phân tích body request
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Phục vụ static files từ thư mục public
app.use(express.static(path.join(__dirname, '../public')));

// Cấu hình template engine Handlebars
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, '../views/layouts')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '../views'));

// Cấu hình express-session với store tập trung trên MongoDB Atlas (tài khoản writer)
app.use(session({
  secret: process.env.SESSION_SECRET || '23IT231-midterm-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.WRITE_MONGO_URI,
    dbName: process.env.DB_NAME || 'DB_23IT231',
    collectionName: 'sessions'
  }),
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Middleware ghi nhận session (phục vụ chứng minh session hoạt động trên Atlas)
app.use((req, res, next) => {
  req.session.views = (req.session.views || 0) + 1;
  req.session.lastVisit = new Date();
  next();
});

// Điều hướng routes
app.use('/', bookRoutes);

// Khởi chạy server sau khi kết nối cơ sở dữ liệu
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Ứng dụng đang chạy tại: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Không thể kết nối cơ sở dữ liệu MongoDB:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
