import { supabase } from '@/lib/supabase'

class NotificationService {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window
    this.permission = null
  }

  // Verificar si las notificaciones están soportadas
  async checkSupport() {
    if (!this.isSupported) {
      console.warn('Notificaciones push no soportadas en este navegador')
      return false
    }
    return true
  }

  // Solicitar permisos de notificación
  async requestPermission() {
    if (!this.isSupported) return false

    try {
      this.permission = await Notification.requestPermission()
      return this.permission === 'granted'
    } catch (error) {
      console.error('Error solicitando permisos:', error)
      return false
    }
  }

  // Verificar permisos actuales
  async checkPermission() {
    if (!this.isSupported) return false
    this.permission = Notification.permission
    return this.permission === 'granted'
  }

  // Registrar suscripción push
  async subscribeToPush() {
    if (!this.isSupported) return false

    try {
      // Verificar permisos
      const hasPermission = await this.checkPermission()
      if (!hasPermission) {
        const granted = await this.requestPermission()
        if (!granted) return false
      }

      // Registrar service worker
      const registration = await navigator.serviceWorker.ready

      // Obtener suscripción existente o crear nueva
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        // Crear nueva suscripción
        const vapidPublicKey = this.urlBase64ToUint8Array(process.env.VITE_VAPID_PUBLIC_KEY || '')
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey
        })
      }

      // Guardar suscripción en Supabase
      const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          subscription: subscription,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Error guardando suscripción:', error)
        return false
      }

      console.log('Suscripción push registrada exitosamente')
      return true

    } catch (error) {
      console.error('Error registrando suscripción push:', error)
      return false
    }
  }

  // Cancelar suscripción
  async unsubscribeFromPush() {
    if (!this.isSupported) return false

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
      }

      // Eliminar de Supabase
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

      if (error) {
        console.error('Error eliminando suscripción:', error)
      }

      console.log('Suscripción push cancelada')
      return true

    } catch (error) {
      console.error('Error cancelando suscripción:', error)
      return false
    }
  }

  // Enviar notificación local (para testing)
  async sendLocalNotification(title, options = {}) {
    if (!this.isSupported) return false

    const hasPermission = await this.checkPermission()
    if (!hasPermission) return false

    const notification = new Notification(title, {
      icon: '/miwalletlogo.png',
      badge: '/miwalletlogo.png',
      vibrate: [100, 50, 100],
      ...options
    })

    return notification
  }

  // Verificar fechas de pago próximas
  async checkUpcomingPayments() {
    try {
      const { data: cards, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

      if (error) {
        console.error('Error obteniendo tarjetas:', error)
        return
      }

      const today = new Date()
      const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000))

      for (const card of cards) {
        if (card.payment_date) {
          const paymentDate = new Date(card.payment_date)
          const daysUntilPayment = Math.ceil((paymentDate - today) / (1000 * 60 * 60 * 24))

          // Notificar si el pago está próximo (3 días o menos)
          if (daysUntilPayment >= 0 && daysUntilPayment <= 3) {
            await this.sendLocalNotification(
              `Pago próximo: ${card.name}`,
              {
                body: `El pago vence en ${daysUntilPayment} día${daysUntilPayment !== 1 ? 's' : ''}`,
                tag: `payment-${card.id}`,
                requireInteraction: true,
                actions: [
                  {
                    action: 'view',
                    title: 'Ver tarjeta',
                    icon: '/miwalletlogo.png'
                  },
                  {
                    action: 'dismiss',
                    title: 'Recordar después',
                    icon: '/miwalletlogo.png'
                  }
                ]
              }
            )
          }
        }
      }
    } catch (error) {
      console.error('Error verificando pagos próximos:', error)
    }
  }

  // Convertir clave VAPID
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Inicializar servicio
  async init() {
    if (!this.isSupported) return false

    // Verificar permisos al inicializar
    const hasPermission = await this.checkPermission()
    
    if (hasPermission) {
      // Verificar pagos próximos cada hora
      setInterval(() => {
        this.checkUpcomingPayments()
      }, 60 * 60 * 1000) // 1 hora

      // Verificar inmediatamente
      await this.checkUpcomingPayments()
    }

    return hasPermission
  }
}

export const notificationService = new NotificationService() 