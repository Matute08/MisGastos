<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Notificaciones</h3>
        <p class="text-sm text-gray-600">Gestiona las notificaciones de la aplicación</p>
      </div>
      <Bell class="h-6 w-6 text-primary-600" />
    </div>

    <!-- Estado de soporte -->
    <div v-if="!isSupported" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <div class="flex">
        <AlertTriangle class="h-5 w-5 text-yellow-400" />
        <div class="ml-3">
          <h4 class="text-sm font-medium text-yellow-800">Notificaciones no soportadas</h4>
          <p class="text-sm text-yellow-700 mt-1">
            Tu navegador no soporta notificaciones push. Usa Chrome, Firefox o Safari.
          </p>
        </div>
      </div>
    </div>

    <!-- Configuraciones -->
    <div v-else class="space-y-6">
      <!-- Permisos -->
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-md">
        <div>
          <h4 class="text-sm font-medium text-gray-900">Permisos de notificación</h4>
          <p class="text-sm text-gray-600">
            Estado: 
            <span :class="{
              'text-green-600': permission === 'granted',
              'text-yellow-600': permission === 'default',
              'text-red-600': permission === 'denied'
            }">
              {{ permissionText }}
            </span>
          </p>
        </div>
        <button
          v-if="permission === 'default'"
          @click="requestPermission"
          class="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors duration-200"
        >
          Habilitar
        </button>
        <button
          v-else-if="permission === 'denied'"
          @click="openSettings"
          class="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-200"
        >
          Configurar
        </button>
      </div>

      <!-- Notificaciones de pagos -->
      <div class="border border-gray-200 rounded-md p-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h4 class="text-sm font-medium text-gray-900">Recordatorios de pago</h4>
            <p class="text-sm text-gray-600">Recibe notificaciones cuando se acerquen las fechas de pago</p>
          </div>
          <Switch v-model="paymentNotifications" />
        </div>

        <div v-if="paymentNotifications" class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-700">Notificar 3 días antes</span>
            <input
              v-model="notificationDays"
              type="number"
              min="1"
              max="7"
              class="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div class="text-xs text-gray-500">
            Se verificará automáticamente cada hora
          </div>
        </div>
      </div>

      <!-- Notificaciones de gastos -->
      <div class="border border-gray-200 rounded-md p-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h4 class="text-sm font-medium text-gray-900">Resúmenes semanales</h4>
            <p class="text-sm text-gray-600">Recibe un resumen de tus gastos semanalmente</p>
          </div>
          <Switch v-model="weeklyReports" />
        </div>
      </div>

      <!-- Botón de prueba -->
      <div class="flex justify-center">
        <button
          @click="sendTestNotification"
          :disabled="permission !== 'granted'"
          class="bg-gray-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Enviar notificación de prueba
        </button>
      </div>

      <!-- Información adicional -->
      <div class="text-xs text-gray-500 text-center">
        <p>Las notificaciones funcionan incluso cuando la app está cerrada</p>
        <p>Puedes desactivarlas en cualquier momento desde la configuración del navegador</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Bell, AlertTriangle } from 'lucide-vue-next'
import { notificationService } from '@/services/notifications'
import Switch from './Switch.vue'

// Eliminar la definición inline del componente Switch

const isSupported = ref(false)
const permission = ref('default')
const paymentNotifications = ref(true)
const weeklyReports = ref(false)
const notificationDays = ref(3)

const permissionText = computed(() => {
  switch (permission.value) {
    case 'granted': return 'Habilitado'
    case 'denied': return 'Denegado'
    default: return 'Pendiente'
  }
})

onMounted(async () => {
  isSupported.value = await notificationService.checkSupport()
  permission.value = await notificationService.checkPermission()
  
  // Inicializar servicio de notificaciones
  if (isSupported.value) {
    await notificationService.init()
  }
})

const requestPermission = async () => {
  const granted = await notificationService.requestPermission()
  if (granted) {
    permission.value = 'granted'
    await notificationService.subscribeToPush()
  } else {
    permission.value = 'denied'
  }
}

const openSettings = () => {
  // Abrir configuración del navegador
  if (navigator.permissions) {
    navigator.permissions.query({ name: 'notifications' })
  }
}

const togglePaymentNotifications = async (enabled) => {
  if (enabled && permission.value !== 'granted') {
    const granted = await requestPermission()
    if (!granted) {
      paymentNotifications.value = false
      return
    }
  }
  
  // Guardar preferencia en localStorage
  localStorage.setItem('paymentNotifications', enabled.toString())
}

const toggleWeeklyReports = async (enabled) => {
  if (enabled && permission.value !== 'granted') {
    const granted = await requestPermission()
    if (!granted) {
      weeklyReports.value = false
      return
    }
  }
  
  localStorage.setItem('weeklyReports', enabled.toString())
}

const sendTestNotification = async () => {
  await notificationService.sendLocalNotification(
    'Notificación de prueba',
    {
      body: '¡Las notificaciones están funcionando correctamente!',
      tag: 'test-notification',
      requireInteraction: true
    }
  )
}

// Cargar preferencias guardadas
onMounted(() => {
  const savedPaymentNotifications = localStorage.getItem('paymentNotifications')
  if (savedPaymentNotifications !== null) {
    paymentNotifications.value = savedPaymentNotifications === 'true'
  }
  
  const savedWeeklyReports = localStorage.getItem('weeklyReports')
  if (savedWeeklyReports !== null) {
    weeklyReports.value = savedWeeklyReports === 'true'
  }
})
</script> 