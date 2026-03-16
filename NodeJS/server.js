import express from 'express';
import 'dotenv/config';
import viewEngine from './configs/viewEngine.js';
import initWebRouter from './router/WebRouter.js';
import initAPIRoute from './router/apiRouter.js';
import path from 'path';
import RedisStore from 'connect-redis';
import session from 'express-session';
import { createClient } from 'redis';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import './configs/cleanup.js';

const app = express();
const port = process.env.PORT || 3000;

/* ===================== MIDDLEWARE ===================== */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/static', express.static(path.join(process.cwd(), 'public')));
app.use('/images', express.static(path.join(process.cwd(), 'images')));

viewEngine(app);

/* ===================== REDIS ===================== */
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
  },
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Error:', err);
});

await redisClient.connect();
console.log('Redis connected');

/* ===================== SESSION ===================== */
const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'myapp:',
});

app.use(
  session({
    store: redisStore,
    secret: process.env.Ad_Session_Secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60, // 1 giờ
    },
  })
);

/* ===================== CORS (ĐÃ CẬP NHẬT) ===================== */
// Danh sách cứng cũ
const hardcodedOrigins = ['http://localhost:3001', 'http://localhost:8080'];

// Lấy thêm từ ENV (nếu có)
const envOrigin = process.env.FRONTEND_URL;

// Gộp lại thành mảng cuối cùng
const finalOrigins = envOrigin ? [...hardcodedOrigins, envOrigin] : hardcodedOrigins;

app.use(
  cors({
    origin: finalOrigins,
    credentials: true,
  })
);

app.use(cookieParser());

/* ===================== ROUTER ===================== */
initAPIRoute(app);
initWebRouter(app);

/* ===================== START ===================== */
app.listen(port, () => {
  console.log(`🚀 Example app listening on port ${port}`);
});