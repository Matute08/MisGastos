# Guía de Despliegue - MisGastos Backend

## Problemas Solucionados

### 1. Error de CORS ✅
- **Problema:** Frontend (Vercel) no podía comunicarse con backend (Koyeb)
- **Solución:** Reordenado middlewares, agregado manejo explícito de OPTIONS

### 2. Dependencia faltante ✅
- **Problema:** `@simplewebauthn/server` no estaba en package.json
- **Solución:** Agregada dependencia `@simplewebauthn/server@^13.1.2`

### 3. Health Checks mejorados ✅
- **Problema:** Koyeb marcaba el servicio como "Degraded"
- **Solución:** Agregados múltiples endpoints de health check

## Endpoints de Health Check

- `GET /health` - Health check principal
- `GET /api/health` - Health check alternativo
- `GET /ping` - Health check simple

## Configuración de Koyeb

### Variables de Entorno Requeridas:
```
NODE_ENV=production
PORT=8000
DATABASE_URL=tu_url_de_supabase
SUPABASE_URL=tu_url_de_supabase
SUPABASE_ANON_KEY=tu_clave_anonima
JWT_SECRET=tu_secreto_jwt
```

### Health Check Configuration:
- **Path:** `/health`
- **Port:** `8000`
- **Initial Delay:** `30 seconds`
- **Interval:** `10 seconds`
- **Timeout:** `5 seconds`

## Pasos para Desplegar

1. **Commit y push de los cambios:**
```bash
git add .
git commit -m "Fix CORS, add WebAuthn dependency, and improve health checks"
git push origin main
```

2. **Verificar en Koyeb:**
- Los cambios se desplegarán automáticamente
- Revisar logs para confirmar que el servidor inicia correctamente
- Verificar que las health checks pasen

3. **Probar endpoints:**
```bash
# Health check
curl https://fascinating-bridie-misgastos-e524faff.koyeb.app/health

# Test CORS
curl https://fascinating-bridie-misgastos-e524faff.koyeb.app/api/test-cors
```

## Troubleshooting

### Si el servicio sigue marcado como "Degraded":
1. Verificar que el puerto 8000 esté configurado correctamente
2. Confirmar que las variables de entorno estén seteadas
3. Revisar logs del servidor en Koyeb
4. Verificar que la base de datos esté accesible

### Si persisten errores de CORS:
1. Verificar que el dominio de Vercel esté en la lista de orígenes permitidos
2. Confirmar que el middleware de CORS se aplique antes que otros middlewares
3. Revisar logs del navegador para errores específicos

## Logs Esperados

Al iniciar correctamente, deberías ver:
```
🚀 CORS Origins permitidos: [...]
🚀 Iniciando servidor MisGastos...
📊 Puerto: 8000
🌍 Entorno: production
✅ Servidor iniciado correctamente en puerto: 8000
🔗 Health check disponible en: http://localhost:8000/health
🔗 API disponible en: http://localhost:8000
```
