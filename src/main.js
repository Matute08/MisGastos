import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

window.__appMounted = true;

app.mount('#app')

import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()

authStore.init().catch(error => {
  console.error('Error inicializando autenticación:', error)
})
