# 🚀 Despliegue en Koyeb - Backend MisGastos

## 📋 Configuración Requerida

### Variables de Entorno en Koyeb

Configura las siguientes variables de entorno en tu proyecto de Koyeb:

```bash
# Configuración del servidor
NODE_ENV=production
PORT=3001

# Configuración de CORS
CORS_ORIGIN=https://mis-gastos-phi.vercel.app

# Configuración de base de datos (Supabase)
SUPABASE_URL=https://xxpupjiubkrhsdxcszth.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_42k03q2qEb202xiQmKA3PA_0HvMdiud
SUPABASE_SECRET_KEY=sb_secret_lqVGZA6jZsahMUQN-upruw_nDBtilnp

# Configuración de JWT
JWT_SECRET=LKL4HAIG+ZZjnC6/JnAcaPOwXXYlgpeo3nhXgmmMwktefDrCnpCWhvKZhYVIq3Kcx0N3WJFlbmquvcSt6yBiiA==

# Configuración de rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100000
```

### Configuración de Build

1. **Build Command:**
```bash
npm install
```

2. **Run Command:**
```bash
npm start
```

3. **Source Directory:**
```
backend/
```

## 🔧 Pasos de Despliegue

1. **Conectar repositorio de GitHub**
2. **Configurar variables de entorno**
3. **Configurar build y run commands**
4. **Desplegar**

## 🌐 URLs

- **Backend (Koyeb):** `https://fascinating-bridie-misgastos-e524faff.koyeb.app`
- **Frontend (Vercel):** `https://mis-gastos-phi.vercel.app`

## ✅ Verificación

Después del despliegue, verifica que el endpoint de salud funcione:

```bash
curl https://fascinating-bridie-misgastos-e524faff.koyeb.app/health
```

Deberías recibir:
```json
{
  "success": true,
  "message": "Servidor funcionando correctamente",
  "timestamp": "2025-01-XX...",
  "environment": "production"
}
```

## 🚨 Solución de Problemas

### Error de CORS
- Verifica que `CORS_ORIGIN` esté configurado correctamente
- Asegúrate de que no haya barras al final de la URL

### Error de Base de Datos
- Verifica que las variables de Supabase estén configuradas
- Asegúrate de que la base de datos esté accesible desde Koyeb

### Error de JWT
- Verifica que `JWT_SECRET` esté configurado
- Asegúrate de que sea una cadena segura y única
