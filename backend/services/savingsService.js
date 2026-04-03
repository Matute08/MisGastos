import { supabase } from '../config/database.js';
import logger from '../utils/logger.js';

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    date: row.entry_date,
    amount_ars: row.amount_ars != null ? Number(row.amount_ars) : 0,
    dollars: row.dollars != null ? Number(row.dollars) : undefined,
    exchange_rate: row.exchange_rate != null ? Number(row.exchange_rate) : undefined,
    note: row.note || '',
    status: row.status || 'ahorrado',
    direction: row.direction || 'in',
  };
}

function validatePayload(body, { isUpdate = false } = {}) {
  const type = body.type;
  if (!isUpdate || body.type !== undefined) {
    if (type !== 'pesos' && type !== 'dolares') {
      throw Object.assign(new Error('Tipo inválido (pesos o dolares)'), { statusCode: 400 });
    }
  }

  const direction = body.direction != null ? body.direction : 'in';
  if (direction !== 'in' && direction !== 'out') {
    throw Object.assign(new Error('direction inválida (in u out)'), { statusCode: 400 });
  }

  const status = body.status != null ? body.status : 'ahorrado';
  if (status !== 'ahorrado' && status !== 'usado') {
    throw Object.assign(new Error('status inválido'), { statusCode: 400 });
  }

  return { type, direction, status };
}

export class SavingsService {
  static async list(userId) {
    try {
      const { data, error } = await supabase
        .from('savings_records')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: (data || []).map(mapRow) };
    } catch (error) {
      logger.error('Error list savings:', error);
      throw error;
    }
  }

  static async create(userId, body) {
    const entryDate = body.date || body.entry_date;
    if (!entryDate || !/^\d{4}-\d{2}-\d{2}$/.test(String(entryDate))) {
      throw Object.assign(new Error('Fecha inválida (YYYY-MM-DD)'), { statusCode: 400 });
    }

    const { type, direction, status } = validatePayload(body);
    const note = body.note != null ? String(body.note) : '';

    let amount_ars;
    let dollars = null;
    let exchange_rate = null;

    if (type === 'pesos') {
      amount_ars = Number(body.amount_ars);
      if (!Number.isFinite(amount_ars) || amount_ars === 0) {
        throw Object.assign(new Error('amount_ars inválido'), { statusCode: 400 });
      }
      if (direction === 'in' && amount_ars <= 0) {
        throw Object.assign(new Error('El ahorro en pesos debe ser mayor a 0'), { statusCode: 400 });
      }
      if (direction === 'out' && amount_ars >= 0) {
        throw Object.assign(new Error('El uso en pesos debe ser un monto negativo'), { statusCode: 400 });
      }
    } else {
      dollars = Number(body.dollars);
      exchange_rate = Number(body.exchange_rate ?? body.exchangeRate);
      if (!Number.isFinite(dollars) || dollars === 0) {
        throw Object.assign(new Error('dollars inválido'), { statusCode: 400 });
      }
      if (!Number.isFinite(exchange_rate) || exchange_rate <= 0) {
        throw Object.assign(new Error('Cotización inválida'), { statusCode: 400 });
      }
      if (direction === 'in' && dollars <= 0) {
        throw Object.assign(new Error('Los dólares ahorrados deben ser mayor a 0'), { statusCode: 400 });
      }
      if (direction === 'out' && dollars >= 0) {
        throw Object.assign(new Error('El uso en dólares debe ser negativo'), { statusCode: 400 });
      }
      amount_ars = dollars * exchange_rate;
    }

    const insert = {
      user_id: userId,
      type,
      entry_date: entryDate,
      amount_ars,
      dollars,
      exchange_rate,
      note,
      status,
      direction,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('savings_records')
        .insert(insert)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: mapRow(data) };
    } catch (error) {
      logger.error('Error create savings:', error);
      throw error;
    }
  }

  static async update(userId, id, updates) {
    const patch = { updated_at: new Date().toISOString() };

    if (updates.type !== undefined) {
      if (updates.type !== 'pesos' && updates.type !== 'dolares') {
        throw Object.assign(new Error('Tipo inválido'), { statusCode: 400 });
      }
      patch.type = updates.type;
    }
    if (updates.date !== undefined || updates.entry_date !== undefined) {
      const d = updates.date || updates.entry_date;
      if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(String(d))) {
        throw Object.assign(new Error('Fecha inválida'), { statusCode: 400 });
      }
      patch.entry_date = d;
    }
    if (updates.note !== undefined) patch.note = String(updates.note);
    if (updates.status !== undefined) {
      if (updates.status !== 'ahorrado' && updates.status !== 'usado') {
        throw Object.assign(new Error('status inválido'), { statusCode: 400 });
      }
      patch.status = updates.status;
    }
    if (updates.direction !== undefined) {
      if (updates.direction !== 'in' && updates.direction !== 'out') {
        throw Object.assign(new Error('direction inválida'), { statusCode: 400 });
      }
      patch.direction = updates.direction;
    }

    const nextType = patch.type;
    if (updates.amount_ars !== undefined || updates.dollars !== undefined || updates.exchange_rate !== undefined || updates.exchangeRate !== undefined) {
      const { data: current, error: curErr } = await supabase
        .from('savings_records')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();
      if (curErr) throw curErr;
      if (!current) throw Object.assign(new Error('Registro no encontrado'), { statusCode: 404 });

      const type = nextType || current.type;
      const direction = patch.direction || current.direction;

      if (type === 'pesos') {
        const amount = updates.amount_ars !== undefined ? Number(updates.amount_ars) : Number(current.amount_ars);
        if (!Number.isFinite(amount) || amount === 0) {
          throw Object.assign(new Error('amount_ars inválido'), { statusCode: 400 });
        }
        if (direction === 'in' && amount <= 0) throw Object.assign(new Error('Monto inválido'), { statusCode: 400 });
        if (direction === 'out' && amount >= 0) throw Object.assign(new Error('Uso en pesos debe ser negativo'), { statusCode: 400 });
        patch.amount_ars = amount;
        patch.dollars = null;
        patch.exchange_rate = null;
      } else {
        const dollars = updates.dollars !== undefined ? Number(updates.dollars) : Number(current.dollars);
        const rate = Number(updates.exchange_rate ?? updates.exchangeRate ?? current.exchange_rate);
        if (!Number.isFinite(dollars) || dollars === 0) throw Object.assign(new Error('dollars inválido'), { statusCode: 400 });
        if (!Number.isFinite(rate) || rate <= 0) throw Object.assign(new Error('Cotización inválida'), { statusCode: 400 });
        if (direction === 'in' && dollars <= 0) throw Object.assign(new Error('Monto inválido'), { statusCode: 400 });
        if (direction === 'out' && dollars >= 0) throw Object.assign(new Error('Uso en USD debe ser negativo'), { statusCode: 400 });
        patch.dollars = dollars;
        patch.exchange_rate = rate;
        patch.amount_ars = dollars * rate;
      }
    }

    try {
      const { data, error } = await supabase
        .from('savings_records')
        .update(patch)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw Object.assign(new Error('Registro no encontrado'), { statusCode: 404 });
      return { success: true, data: mapRow(data) };
    } catch (error) {
      logger.error('Error update savings:', error);
      throw error;
    }
  }

  static async delete(userId, id) {
    try {
      const { error } = await supabase.from('savings_records').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      logger.error('Error delete savings:', error);
      throw error;
    }
  }
}
