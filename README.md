# Control Gastos - Aplicación de Gestión de Gastos Personales

Una aplicación web moderna para gestionar gastos personales, tarjetas de crédito y débito, con soporte para cuotas y análisis financiero.

## 🚀 Características

### 🔐 Autenticación
- Registro e inicio de sesión con Supabase Auth
- Soporte para login biométrico (opcional con Capacitor)

### 💳 Gestión de Tarjetas
- Registro de tarjetas de crédito y débito
- Configuración de fecha de cierre para tarjetas de crédito
- Edición y eliminación de tarjetas

### 💸 Registro de Gastos
- Registro completo de gastos con monto, tarjeta, fecha y categoría
- Soporte para pagos en cuotas con cálculo automático
- Cálculo inteligente de fechas de cuotas basado en fecha de cierre
- Estado de pago por gasto

### 📊 Dashboard y Análisis
- Dashboard con gráficos de gastos por categoría y tarjeta
- Filtros avanzados por tarjeta, categoría, mes y estado
- Vista mensual con gestión de cuotas
- Estadísticas y resúmenes financieros

### 🎨 Diseño
- Interfaz moderna y responsive con TailwindCSS
- Soporte PWA para uso offline
- Diseño optimizado para móviles y tablets

## 🛠️ Tecnologías

- **Frontend**: Vue 3 (Composition API)
- **Estado**: Pinia
- **Rutas**: Vue Router
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Estilos**: TailwindCSS
- **Gráficos**: Chart.js
- **Iconos**: Lucide Vue
- **PWA**: Capacitor (opcional)

## 📦 Instalación

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd control-gastos
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Supabase

#### Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Obtén la URL y la clave anónima del proyecto

#### Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

#### Configurar la base de datos
1. Ve al SQL Editor en tu proyecto de Supabase
2. Ejecuta el contenido del archivo `database.sql`
3. Esto creará todas las tablas y políticas necesarias

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

### 5. Construir para producción
```bash
npm run build
```

## 🗄️ Estructura de la Base de Datos

### Tablas principales:
- **cards**: Tarjetas de crédito/débito
- **categories**: Categorías de gastos
- **expenses**: Gastos registrados
- **installments**: Cuotas de gastos

### Características de seguridad:
- Row Level Security (RLS) habilitado
- Políticas de acceso por usuario
- Triggers automáticos para cuotas
- Validaciones de datos

## 📱 Funcionalidades PWA

La aplicación está configurada como PWA con:
- Manifest para instalación
- Service Worker para cache
- Iconos y meta tags apropiados
- Soporte offline básico

## 🎯 Uso

### 1. Registro e Inicio de Sesión
- Registra una cuenta con email y contraseña
- Inicia sesión para acceder a la aplicación

### 2. Configurar Tarjetas
- Ve a la sección "Tarjetas"
- Agrega tus tarjetas de crédito y débito
- Para tarjetas de crédito, configura el día de cierre

### 3. Crear Categorías
- Ve a la sección "Categorías"
- Crea categorías personalizadas con colores
- Ejemplos: Supermercado, Transporte, Entretenimiento

### 4. Registrar Gastos
- Ve a la sección "Gastos"
- Completa el formulario con todos los datos
- Si es en cuotas, el sistema calculará automáticamente las fechas

### 5. Gestionar Gastos Mensuales
- Ve a la sección "Mensual"
- Visualiza todos los gastos del mes seleccionado
- Marca gastos y cuotas como pagados

### 6. Analizar en Dashboard
- Ve al Dashboard para ver gráficos y estadísticas
- Filtra gastos por diferentes criterios
- Visualiza la distribución de gastos

## 🔧 Configuración Avanzada

### Capacitor (PWA Nativa)
Para convertir en aplicación nativa:

```bash
npm install @capacitor/cli @capacitor/core
npx cap init
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
```

### Variables de Entorno Adicionales
```env
# Para desarrollo
VITE_APP_ENV=development

# Para producción
VITE_APP_ENV=production
```

## 🚀 Despliegue

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Subir la carpeta dist
```

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase init hosting
npm run build
firebase deploy
```

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o preguntas:
- Abre un issue en GitHub
- Revisa la documentación de Supabase
- Consulta la documentación de Vue 3

---

Desarrollado con ❤️ usando Vue 3 y Supabase
