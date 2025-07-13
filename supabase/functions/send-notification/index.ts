import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Crear cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { user_id, title, body, data = {} } = await req.json()

    if (!user_id || !title) {
      throw new Error('user_id y title son requeridos')
    }

    // Obtener suscripción del usuario
    const { data: subscriptionData, error: subscriptionError } = await supabaseClient
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', user_id)
      .single()

    if (subscriptionError || !subscriptionData) {
      throw new Error('No se encontró suscripción para el usuario')
    }

    // Enviar notificación push
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: subscriptionData.subscription.endpoint,
        notification: {
          title: title,
          body: body,
          icon: '/miwalletlogo.png',
          badge: '/miwalletlogo.png',
          vibrate: [100, 50, 100],
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        priority: 'high',
      }),
    })

    if (!response.ok) {
      throw new Error(`Error enviando notificación: ${response.statusText}`)
    }

    // Registrar en el log
    await supabaseClient
      .from('notification_log')
      .insert({
        user_id: user_id,
        title: title,
        body: body,
        data: data,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })

    return new Response(
      JSON.stringify({ success: true, message: 'Notificación enviada' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error.message)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
}) 