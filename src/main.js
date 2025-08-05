import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Marcar la app como montada antes de montar
window.__appMounted = true;

app.mount('#app')

// Inicializar el store de autenticación después de montar la app
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()

// Inicializar autenticación de forma asíncrona
authStore.init().then(() => {
  console.log('Autenticación inicializada')
}).catch(error => {
  console.error('Error inicializando autenticación:', error)
})
