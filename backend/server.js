import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
// import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { getConfig } from './config/production.js';

import authRoutes from './routes/auth.js';
import expensesRoutes from './routes/expenses.js';
import cardsRoutes from './routes/cards.js';
import categoriesRoutes from './routes/categories.js';
import subcategoriesRoutes from './routes/subcategories.js';
import availableCardsRoutes from './routes/availableCards.js';
import userCardsRoutes from './routes/userCards.js';
import webauthnRoutes from './routes/webauthn.js';

dotenv.config();

const config = getConfig();

const app = express();
const PORT = config.PORT || 8000;

const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression());
// Silenciar logs HTTP en producción/desarrollo
// app.use(morgan('combined'));

app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de log manual deshabilitado para evitar ruido en consola
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
//   next();
// });

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
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
      userCards: '/api/user-cards'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/subcategories', subcategoriesRoutes);
app.use('/api/available-cards', availableCardsRoutes);
app.use('/api/user-cards', userCardsRoutes);
app.use('/api/webauthn', webauthnRoutes);

app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

const startServer = async () => {
  try {
    const { supabase } = await import('./config/database.js');
    
    try {
      const { error } = await supabase.from('expenses').select('id').limit(1);
      if (error) throw error;
      // Conexión verificada
    } catch (e) {
      console.error('❌ Supabase:', e);
      console.error('🔎 cause:', e?.cause);
      process.exit(1);
    }

    try {
      const { initRoles } = await import('./scripts/init-roles.js');
      await initRoles();
      // Roles inicializados correctamente
    } catch (roleError) {
      // Silenciado: error inicializando roles
    }

    app.listen(PORT, () => {});
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => { process.exit(0); });

process.on('SIGINT', () => { process.exit(0); });

process.on('uncaughtException', (err) => {
  console.error('❌ Error no capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  process.exit(1);
});

startServer();
