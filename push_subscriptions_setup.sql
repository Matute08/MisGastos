-- Crear tabla para suscripciones push
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created_at ON push_subscriptions(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios solo vean sus propias suscripciones
CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_push_subscriptions_updated_at 
  BEFORE UPDATE ON push_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para enviar notificaciones push (Edge Function)
-- Esta función se ejecutará en Supabase Edge Functions
CREATE OR REPLACE FUNCTION send_push_notification(
  user_id UUID,
  title TEXT,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  -- Esta función será implementada como Edge Function
  -- Por ahora solo registra la intención
  INSERT INTO notification_log (user_id, title, body, data, status)
  VALUES (user_id, title, body, data, 'pending');
END;
$$ LANGUAGE plpgsql;

-- Tabla para log de notificaciones (opcional)
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para notification_log
CREATE INDEX IF NOT EXISTS idx_notification_log_user_id ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(status);
CREATE INDEX IF NOT EXISTS idx_notification_log_created_at ON notification_log(created_at);

-- RLS para notification_log
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification logs" ON notification_log
  FOR SELECT USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE push_subscriptions IS 'Almacena las suscripciones push de los usuarios';
COMMENT ON TABLE notification_log IS 'Registro de notificaciones enviadas';
COMMENT ON FUNCTION send_push_notification IS 'Función para enviar notificaciones push (implementada como Edge Function)'; 