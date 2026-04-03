// server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { getConfig } from './config/production.js';
import { logError, getErrorResponse } from './utils/errorHandler.js';
import logger from './utils/logger.js';

// Rutas
import authRoutes from './routes/auth.js';
import expensesRoutes from './routes/expenses.js';
import cardsRoutes from './routes/cards.js';
import categoriesRoutes from './routes/categories.js';
import subcategoriesRoutes from './routes/subcategories.js';
import availableCardsRoutes from './routes/availableCards.js';
import userCardsRoutes from './routes/userCards.js';
import incomesRoutes from './routes/incomes.js';
import savingsRoutes from './routes/savings.js';

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
logger.info('🚀 CORS Origins permitidos:', { origins: allowedOrigins });

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
  logger.info(`${req.method} ${req.path}`, { 
    origin: req.headers.origin || '-',
    timestamp: new Date().toISOString()
  });
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

// 🚫 Cache-Control para API: evita caché en navegador/CDN
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
  }
  next();
});

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
      incomes: '/api/incomes',
      savings: '/api/savings',
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
app.use('/api/incomes', incomesRoutes);
app.use('/api/savings', savingsRoutes);

// 🧯 Error handler
app.use((err, req, res, next) => {
  // Log seguro del error
  logError(err, {
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });

  // Obtener respuesta segura
  const { response, statusCode } = getErrorResponse(err);
  
  res.status(statusCode).json(response);
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada', path: req.originalUrl });
});

const startServer = async () => {
  try {
    logger.info('🚀 Iniciando servidor MisGastos...');
    logger.info('📊 Puerto:', { port: PORT });
    logger.info('🌍 Entorno:', { environment: process.env.NODE_ENV || 'development' });

    // Verificación no-bloqueante de Supabase
    const { supabase } = await import('./config/database.js');
    if (!supabase) {
      logger.warn('⚠️ Supabase no configurado (faltan envs). El servidor arranca igual para health checks.');
    } else {
      try {
        await supabase.from('expenses').select('id').limit(1);
      } catch (e) {
        logError(e, { path: 'startServer', method: 'supabase-check' });
        // No cortamos el proceso para permitir health checks y reinicios controlados
      }
    }

    // Inicialización opcional
    try {
      const { initRoles } = await import('./scripts/init-roles.js');
      await initRoles();
    } catch (_) { /* silencioso */ }

    app.listen(PORT, '0.0.0.0', () => {
      logger.info('✅ Servidor iniciado correctamente', { port: PORT });
      if (PUBLIC_URL) {
        logger.info('🔗 Health check:', { url: `${PUBLIC_URL}/health` });
        logger.info('🔗 API base:', { url: PUBLIC_URL });
      } else {
        logger.info('🔗 Tip: setea PUBLIC_URL para loguear el dominio público.');
        logger.info('🔗 Health local:', { url: `http://localhost:${PORT}/health` });
        logger.info('🔗 API local:', { url: `http://localhost:${PORT}` });
      }
    });
  } catch (error) {
    logError(error, { path: 'startServer', method: 'startServer' });
    process.exit(1);
  }
};

// Señales
process.on('SIGTERM', () => { process.exit(0); });
process.on('SIGINT', () => { process.exit(0); });
// Manejo seguro de errores no capturados
process.on('uncaughtException', (err) => {
  logError(err, { path: 'process', method: 'uncaughtException' });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logError(error, { path: 'process', method: 'unhandledRejection' });
  process.exit(1);
});

startServer();
