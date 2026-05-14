CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS payment_status (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL
);

INSERT INTO payment_status (id, code, label) VALUES
  (1, 'pendiente', 'Pendiente'),
  (2, 'pagada', 'Pagada'),
  (3, 'en_deuda', 'En deuda')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT NOT NULL DEFAULT ''
);

INSERT INTO roles (nombre, descripcion) VALUES
  ('user', 'Usuario regular'),
  ('moderator', 'Moderador'),
  ('admin', 'Administrador')
ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE IF NOT EXISTS usuarios_perfil (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  creado TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usuarios_perfil_role_id ON usuarios_perfil(role_id);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_categories_user_id ON categories(user_id);

CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1'
);

CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);

CREATE TABLE IF NOT EXISTS available_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Crédito', 'Débito', 'Transferencia')),
  bank TEXT
);

CREATE TABLE IF NOT EXISTS user_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  available_card_id UUID NOT NULL REFERENCES available_cards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, available_card_id)
);

CREATE INDEX idx_user_cards_user_id ON user_cards(user_id);
CREATE INDEX idx_user_cards_available_card_id ON user_cards(available_card_id);

CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Crédito'
);

CREATE INDEX idx_cards_user_id ON cards(user_id);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  card_id UUID REFERENCES available_cards(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  purchase_date DATE NOT NULL,
  payment_status_id INTEGER NOT NULL DEFAULT 1 REFERENCES payment_status(id),
  installments_count INTEGER NOT NULL DEFAULT 1,
  first_installment_date DATE,
  month INTEGER GENERATED ALWAYS AS (EXTRACT(MONTH FROM purchase_date)) STORED,
  year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM purchase_date)) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_scheduled BOOLEAN NOT NULL DEFAULT false,
  scheduled_start_month DATE,
  scheduled_months INTEGER,
  scheduled_end_month DATE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_card_id ON expenses(card_id);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_purchase_date ON expenses(purchase_date);
CREATE INDEX idx_expenses_payment_status_id ON expenses(payment_status_id);
CREATE INDEX idx_expenses_installments_count ON expenses(installments_count);
CREATE INDEX idx_expenses_first_installment_date ON expenses(first_installment_date);
CREATE INDEX idx_expenses_is_scheduled ON expenses(is_scheduled);

CREATE TABLE IF NOT EXISTS installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  payment_status_id INTEGER NOT NULL DEFAULT 1 REFERENCES payment_status(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_installments_expense_id ON installments(expense_id);
CREATE INDEX idx_installments_due_date ON installments(due_date);
CREATE INDEX idx_installments_payment_status_id ON installments(payment_status_id);

CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  income_date DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  affects_cash_balance BOOLEAN NOT NULL DEFAULT true,
  card_id UUID REFERENCES available_cards(id) ON DELETE SET NULL,
  month INTEGER GENERATED ALWAYS AS (EXTRACT(MONTH FROM income_date)) STORED,
  year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM income_date)) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_incomes_user_id ON incomes(user_id);
CREATE INDEX idx_incomes_card_id ON incomes(card_id);
CREATE INDEX idx_incomes_income_date ON incomes(income_date);
CREATE INDEX idx_incomes_month_year ON incomes(month, year);

CREATE TABLE IF NOT EXISTS savings_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pesos', 'dolares')),
  entry_date DATE NOT NULL,
  amount_ars NUMERIC(12,2) NOT NULL DEFAULT 0,
  dollars NUMERIC(12,2),
  exchange_rate NUMERIC(12,4),
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ahorrado' CHECK (status IN ('ahorrado', 'usado')),
  direction TEXT NOT NULL DEFAULT 'in' CHECK (direction IN ('in', 'out')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_savings_records_user_id ON savings_records(user_id);
CREATE INDEX idx_savings_records_entry_date ON savings_records(entry_date);

CREATE TABLE IF NOT EXISTS revoked_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_revoked_tokens_token_hash ON revoked_tokens(token_hash);
CREATE INDEX idx_revoked_tokens_expires_at ON revoked_tokens(expires_at);

ALTER TABLE revoked_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage revoked tokens"
  ON revoked_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  transports TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);

ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webauthn credentials"
  ON webauthn_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own webauthn credentials"
  ON webauthn_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webauthn credentials"
  ON webauthn_credentials
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webauthn credentials"
  ON webauthn_credentials
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_notification_log_user_id ON notification_log(user_id);
CREATE INDEX idx_notification_log_sent_at ON notification_log(sent_at);

CREATE OR REPLACE VIEW expenses_with_installments
WITH (security_invoker = true)
AS
SELECT
  e.id,
  e.user_id,
  e.description,
  e.amount,
  e.card_id,
  e.category_id,
  e.subcategory_id,
  e.purchase_date,
  e.payment_status_id,
  e.installments_count,
  e.first_installment_date,
  e.month,
  e.year,
  e.created_at,
  e.updated_at,
  e.is_scheduled,
  e.scheduled_start_month,
  e.scheduled_months,
  e.scheduled_end_month,
  e.is_active,
  i.id AS installment_id,
  i.installment_number,
  i.due_date,
  i.amount AS installment_amount,
  i.updated_at AS installment_updated_at,
  ps.code AS installment_payment_status_code,
  ps.label AS installment_payment_status_label
FROM expenses e
LEFT JOIN installments i ON e.id = i.expense_id
LEFT JOIN payment_status ps ON i.payment_status_id = ps.id
WHERE e.is_active = true;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_expenses_updated_at') THEN
    CREATE TRIGGER set_expenses_updated_at
      BEFORE UPDATE ON expenses
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_installments_updated_at') THEN
    CREATE TRIGGER set_installments_updated_at
      BEFORE UPDATE ON installments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_savings_records_updated_at') THEN
    CREATE TRIGGER set_savings_records_updated_at
      BEFORE UPDATE ON savings_records
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_webauthn_credentials_updated_at') THEN
    CREATE TRIGGER set_webauthn_credentials_updated_at
      BEFORE UPDATE ON webauthn_credentials
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;
