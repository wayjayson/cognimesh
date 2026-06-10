import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';
import diaryRoutes from './routes/diary.js';

import emotionWeatherRoutes from './routes/emotionWeather.js';
import backupRoutes from './routes/backup.js';
import logRoutes from './routes/log-error.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Validate critical env vars on startup
const requiredEnv = ['JWT_SECRET', 'REFRESH_SECRET', 'MONGODB_URI'];
for (const key of requiredEnv) {
  if (!process.env[key] || process.env[key].startsWith('your_')) {
    console.error(`[ERROR] 环境变量 ${key} 未设置或使用默认值，请修改 server/.env 文件`);
    console.error(`[ERROR] 可使用以下命令生成安全的随机值：`);
    console.error(`  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`);
    process.exit(1);
  }
}

const app = express();

// Trust Render's reverse proxy (required for rate limiting + correct client IP)
app.set('trust proxy', 1);

const isProduction = process.env.NODE_ENV === 'production';
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline styles + Vite HMR for dev
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan(isProduction ? 'combined' : 'dev'));

connectDB();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/diary', diaryRoutes);

app.use('/api/emotion-weather', emotionWeatherRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', logRoutes);

// Serve client SPA in production
if (isProduction) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  if (!isProduction) console.error(err.stack);
  else console.error(`[ERROR] ${err.message}`);
  res.status(500).json({ message: '服务器内部错误' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}${isProduction ? ' (production)' : ''}`));
