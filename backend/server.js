// server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { getConfig } from './config/production.js';

// Rutas
import authRoutes from './routes/auth.js';
import expensesRoutes from './routes/expenses.js';
import cardsRoutes from './routes/cards.js';
import categoriesRoutes from './routes/categories.js';
import subcategoriesRoutes from './routes/subcategories.js';
import availableCardsRoutes from './routes/availableCards.js';
import userCardsRoutes from './routes/userCards.js';
import webauthnRoutes from './routes/webauthn.js';

dotenv.config();

const app = express();

// ⚙️ Config
const cfg = getConfig();
const PORT = Number(process.env.PORT) || Number(cfg.PORT) || 8000; // Koyeb define PORT
const PUBLIC_URL = process.env.PUBLIC_URL || null;

// 🌐 CORS
const corsOrigins = new Set([
  'https://mis-gastos-phi.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
]);

if (cfg.CORS_ORIGIN && typeof cfg.CORS_ORIGIN === 'string') corsOrigins.add(cfg.CORS_ORIGIN);
if (Array.isArray(cfg.CORS_ORIGIN)) cfg.CORS_ORIGIN.forEach(o => corsOrigins.add(o));
if (process.env.CORS_ORIGIN && typeof process.env.CORS_ORIGIN === 'string') corsOrigins.add(process.env.CORS_ORIGIN);

const allowedOrigins = [...corsOrigins];
console.log('🚀 CORS Origins permitidos:', allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.options('*', cors());

// Log mínimo
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Origin: ${req.headers.origin || '-'}`);
  next();
});

// Proxy
app.set('trust proxy', 1);

// ⏳ Rate limit
const limiter = rateLimit({
  windowMs: Number(cfg.RATE_LIMIT_WINDOW_MS) || 60_000,
  max: Number(cfg.RATE_LIMIT_MAX_REQUESTS) || 120,
  message: { success: false, error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 🛡️ Seguridad + compresión
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(compression());

// 📦 Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🩺 Health checks
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    status: 'healthy'
  });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    status: 'healthy'
  });
});

app.get('/ping', (_req, res) => res.status(200).send('pong'));

// 🔬 CORS test
app.get('/api/test-cors', (req, res) => {
  res.json({ success: true, message: 'CORS funcionando correctamente', origin: req.headers.origin, timestamp: new Date().toISOString(), cors: 'OK' });
});
app.post('/api/test-cors', (req, res) => {
  res.json({ success: true, message: 'CORS POST funcionando correctamente', origin: req.headers.origin, body: req.body, timestamp: new Date().toISOString(), cors: 'OK' });
});

// 🏠 Root
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'API de MisGastos',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      expenses: '/api/expenses',
      cards: '/api/cards',
      categories: '/api/categories',
      subcategories: '/api/subcategories',
      availableCards: '/api/available-cards',
      userCards: '/api/user-cards',
      webauthn: '/api/webauthn',
    }
  });
});

// 🚦 Rutas
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/subcategories', subcategoriesRoutes);
app.use('/api/available-cards', availableCardsRoutes);
app.use('/api/user-cards', userCardsRoutes);
app.use('/api/webauthn', webauthnRoutes);

// 🧯 Error handler
app.use((err, _req, res, _next) => {
  console.error('Error no manejado:', err);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada', path: req.originalUrl });
});

const startServer = async () => {
  try {
    console.log('🚀 Iniciando servidor MisGastos...');
    console.log('📊 Puerto:', PORT);
    console.log('🌍 Entorno:', process.env.NODE_ENV || 'development');

    // Verificación no-bloqueante de Supabase
    const { supabase } = await import('./config/database.js');
    if (!supabase) {
      console.warn('⚠️ Supabase no configurado (faltan envs). El servidor arranca igual para health checks.');
    } else {
      try {
        await supabase.from('expenses').select('id').limit(1);
      } catch (e) {
        console.error('❌ Supabase:', e);
        console.error('🔎 cause:', e?.cause);
        // No cortamos el proceso para permitir health checks y reinicios controlados
      }
    }

    // Inicialización opcional
    try {
      const { initRoles } = await import('./scripts/init-roles.js');
      await initRoles();
    } catch (_) { /* silencioso */ }

    app.listen(PORT, '0.0.0.0', () => {
      console.log('✅ Servidor iniciado correctamente en puerto:', PORT);
      if (PUBLIC_URL) {
        console.log('🔗 Health check:', `${PUBLIC_URL}/health`);
        console.log('🔗 API base:', PUBLIC_URL);
      } else {
        console.log('🔗 Tip: setea PUBLIC_URL para loguear el dominio público.');
        console.log('🔗 Health local:', `http://localhost:${PORT}/health`);
        console.log('🔗 API local:', `http://localhost:${PORT}`);
      }
    });
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Señales
process.on('SIGTERM', () => { process.exit(0); });
process.on('SIGINT', () => { process.exit(0); });
process.on('uncaughtException', (err) => { console.error('❌ Error no capturado:', err); process.exit(1); });
process.on('unhandledRejection', (reason) => { console.error('❌ Promesa rechazada no manejada:', reason); process.exit(1); });

startServer();
