# Backend de MisGastos

Backend completo para la aplicación MisGastos desarrollado con Node.js, Express y PostgreSQL. Este backend reemplaza las funciones complejas de Supabase para mejorar el rendimiento y la escalabilidad.

## 🚀 Características

- **API RESTful** completa con Express.js
- **Autenticación JWT** con Supabase Auth
- **Base de datos PostgreSQL** optimizada
- **Validación de datos** con express-validator
- **Seguridad** con helmet, CORS y rate limiting
- **Logging** con morgan
- **Compresión** de respuestas
- **Manejo de errores** centralizado
- **Transacciones** de base de datos
- **Funciones complejas** movidas desde Supabase al backend

## 📋 Requisitos

- Node.js 18+ 
- PostgreSQL 12+
- npm o yarn

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
cd backend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp env.example .env
```

Editar el archivo `.env` con tus configuraciones:

```env
# Configuración del servidor
PORT=3001
NODE_ENV=development

# Base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=misgastos
DB_USER=postgres
DB_PASSWORD=tu_password_aqui

# JWT Secret
JWT_SECRET=tu_jwt_secret_super_seguro_aqui
JWT_EXPIRES_IN=7d

# Supabase (para autenticación)
SUPABASE_URL=tu_supabase_url_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Configuración de seguridad
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Configurar la base de datos

#### Crear la base de datos PostgreSQL:
```sql
CREATE DATABASE misgastos;
```

#### Ejecutar el script de configuración:
```bash
psql -h localhost -U postgres -d misgastos -f scripts/setup-database.sql
```

### 5. Iniciar el servidor

#### Desarrollo:
```bash
npm run dev
```

#### Producción:
```bash
npm start
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil del usuario
- `PUT /api/auth/change-role/:userId` - Cambiar rol (solo admin)

### Gastos
- `GET /api/expenses` - Obtener gastos del usuario
- `GET /api/expenses/monthly` - Obtener gastos mensuales con cuotas
- `GET /api/expenses/monthly-total` - Obtener total mensual
- `POST /api/expenses` - Crear nuevo gasto
- `PUT /api/expenses/:id` - Actualizar gasto
- `DELETE /api/expenses/:id` - Eliminar gasto
- `GET /api/expenses/:id/installments` - Obtener cuotas de un gasto
- `GET /api/expenses/:id/installments-summary` - Obtener resumen de cuotas
- `PUT /api/expenses/installments/:id/status` - Actualizar estado de cuota
- `GET /api/expenses/upcoming-installments` - Obtener cuotas próximas a vencer

### Tarjetas
- `GET /api/cards` - Obtener tarjetas del usuario
- `POST /api/cards` - Crear nueva tarjeta
- `PUT /api/cards/:id` - Actualizar tarjeta
- `DELETE /api/cards/:id` - Eliminar tarjeta
- `GET /api/cards/:id/stats` - Obtener estadísticas de tarjeta
- `GET /api/cards/:id/expenses` - Obtener gastos de una tarjeta

### Categorías
- `GET /api/categories` - Obtener todas las categorías
- `GET /api/categories/with-stats` - Obtener categorías con estadísticas
- `POST /api/categories` - Crear nueva categoría
- `PUT /api/categories/:id` - Actualizar categoría
- `DELETE /api/categories/:id` - Eliminar categoría
- `GET /api/categories/:id/stats` - Obtener estadísticas de categoría
- `GET /api/categories/:id/expenses` - Obtener gastos de una categoría

## 🔧 Estructura del Proyecto

```
backend/
├── config/
│   └── database.js          # Configuración de PostgreSQL
├── middleware/
│   └── auth.js              # Middleware de autenticación
├── routes/
│   ├── auth.js              # Rutas de autenticación
│   ├── expenses.js          # Rutas de gastos
│   ├── cards.js             # Rutas de tarjetas
│   └── categories.js        # Rutas de categorías
├── services/
│   ├── authService.js       # Lógica de autenticación
│   ├── expensesService.js   # Lógica de gastos
│   ├── cardsService.js      # Lógica de tarjetas
│   └── categoriesService.js # Lógica de categorías
├── scripts/
│   └── setup-database.sql   # Script de configuración de BD
├── server.js                # Servidor principal
├── package.json
└── README.md
```

## 🔐 Seguridad

- **JWT** para autenticación
- **Helmet** para headers de seguridad
- **CORS** configurado
- **Rate limiting** para prevenir abuso
- **Validación** de datos de entrada
- **Sanitización** de consultas SQL
- **Transacciones** para operaciones críticas

## 🚀 Funciones Optimizadas

### Funciones complejas movidas desde Supabase:

1. **`getMonthlyExpensesWithInstallments`** - Obtiene gastos mensuales con cuotas
2. **`getMonthlyTotalWithInstallments`** - Calcula totales mensuales
3. **`getExpenseInstallmentsSummary`** - Resumen de cuotas por gasto
4. **`createInstallmentsForExpense`** - Creación automática de cuotas
5. **`updateExpenseInstallments`** - Actualización de cuotas

### Ventajas del backend:

- **Mejor rendimiento** - Consultas optimizadas
- **Menos latencia** - Sin llamadas a funciones remotas
- **Mayor control** - Lógica personalizada
- **Escalabilidad** - Fácil de escalar horizontalmente
- **Debugging** - Mejor trazabilidad de errores

## 🧪 Testing

```bash
npm test
```

## 📊 Monitoreo

El servidor incluye:
- **Logging** detallado con morgan
- **Health check** en `/health`
- **Manejo de errores** centralizado
- **Métricas** básicas de rendimiento

## 🔄 Migración desde Supabase

### 1. Actualizar el frontend
Reemplazar las importaciones de `supabase.js` por `api.js`:

```javascript
// Antes
import { supabase, auth, expenses } from '@/lib/supabase'

// Después
import { auth, expenses } from '@/lib/api'
```

### 2. Configurar variables de entorno
```env
VITE_API_URL=http://localhost:3001/api
```

### 3. Migrar datos (opcional)
Si tienes datos existentes en Supabase, puedes migrarlos usando las funciones de exportación/importación de PostgreSQL.

## 🚀 Despliegue

### Docker (recomendado)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Variables de entorno para producción:
```env
NODE_ENV=production
PORT=3001
DB_HOST=tu_host_produccion
DB_NAME=misgastos_prod
JWT_SECRET=secret_muy_seguro_produccion
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa los logs del servidor
2. Verifica la configuración de la base de datos
3. Asegúrate de que todas las variables de entorno estén configuradas
4. Revisa la documentación de la API

## 🔗 Enlaces Útiles

- [Documentación de Express.js](https://expressjs.com/)
- [Documentación de PostgreSQL](https://www.postgresql.org/docs/)
- [Documentación de JWT](https://jwt.io/)
- [Documentación de Supabase](https://supabase.com/docs) 