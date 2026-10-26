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
  if (status !== 'ahorrado' && status !== 'usado' && status !== 'retirado') {
    throw Object.assign(new Error('status inválido'), { statusCode: 400 });
  }

  return { type, direction, status };
}

export function extractJarId(note) {
  if (!note) return null;
  const match = String(note).match(/\[frasco:([^\]]+)\]/);
  return match ? match[1] : null;
}

export function cleanNote(note) {
  if (!note) return '';
  return String(note).replace(/\[frasco:[^\]]+\]\s*/, '').trim();
}

function recordMatchesJar(record, jar) {
  const jarIdInNote = extractJarId(record.note);
  if (jarIdInNote) {
    return jarIdInNote === jar.id;
  }
  if (jar.name && record.note) {
    const normNote = record.note.toLowerCase().trim();
    const normName = jar.name.toLowerCase().trim();
    return normNote.includes(normName);
  }
  return false;
}

async function getUserJarsMetadata(userId) {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data?.user) return [];
  const meta = data.user.user_metadata || {};
  return Array.isArray(meta.savings_jars) ? meta.savings_jars : [];
}

async function saveUserJarsMetadata(userId, jars) {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data?.user) throw new Error('Usuario no encontrado');
  const meta = { ...(data.user.user_metadata || {}), savings_jars: jars };
  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { user_metadata: meta });
  if (updateError) throw updateError;
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
    const isWithdrawal = status === 'retirado';

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
      if (direction === 'out' && !isWithdrawal && amount_ars >= 0) {
        throw Object.assign(new Error('El uso en pesos debe ser un monto negativo'), { statusCode: 400 });
      }
      if (direction === 'out' && isWithdrawal && amount_ars <= 0) {
        throw Object.assign(new Error('El retiro en pesos debe ser mayor a 0'), { statusCode: 400 });
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
      if (direction === 'out' && !isWithdrawal && dollars >= 0) {
        throw Object.assign(new Error('El uso en dólares debe ser negativo'), { statusCode: 400 });
      }
      if (direction === 'out' && isWithdrawal && dollars <= 0) {
        throw Object.assign(new Error('El retiro en dólares debe ser mayor a 0'), { statusCode: 400 });
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
      if (updates.status !== 'ahorrado' && updates.status !== 'usado' && updates.status !== 'retirado') {
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

  static async listJars(userId) {
    try {
      let jars = await getUserJarsMetadata(userId);
      const { data: recordsData, error: recordsError } = await supabase
        .from('savings_records')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false });

      if (recordsError) throw recordsError;
      const records = (recordsData || []).map(mapRow);

      // Auto-initialize default jars if none exist and user has active savings
      if (jars.length === 0) {
        const activeSavings = records.filter(r => (r.status || 'ahorrado') === 'ahorrado' && (r.direction || 'in') === 'in');
        const defaultJars = [];
        const seenNames = new Set();

        for (const item of activeSavings) {
          const rawName = cleanNote(item.note) || (item.type === 'dolares' ? 'Ahorro USD' : 'Ahorro General');
          const trimmedName = rawName.trim();
          const key = trimmedName.toLowerCase();
          if (!seenNames.has(key)) {
            seenNames.add(key);
            defaultJars.push({
              id: 'jar-' + key.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '-' + Math.random().toString(36).slice(2, 6),
              name: trimmedName,
              currency: item.type === 'dolares' ? 'USD' : 'ARS',
              color: trimmedName.toLowerCase().includes('iphone') ? '#6366f1' : '#10b981',
              icon: trimmedName.toLowerCase().includes('iphone') ? 'Smartphone' : 'PiggyBank',
              target_amount: null,
              created_at: item.date ? new Date(item.date).toISOString() : new Date().toISOString()
            });
          }
        }

        if (defaultJars.length > 0) {
          jars = defaultJars;
          try {
            await saveUserJarsMetadata(userId, jars);
          } catch (e) {
            logger.warn('Error saving auto-initialized jars:', e.message);
          }
        }
      }

      // Calculate real-time balance for each jar
      const enrichedJars = jars.map(jar => {
        const matching = records.filter(r => recordMatchesJar(r, jar));
        const isUsd = jar.currency === 'USD';

        const deposits = matching
          .filter(r => (r.direction === 'in' || !r.direction) && r.status === 'ahorrado')
          .reduce((sum, r) => sum + (isUsd ? (Number(r.dollars) || 0) : Number(r.amount_ars)), 0);

        const withdrawals = matching
          .filter(r => r.direction === 'out' && r.status === 'retirado')
          .reduce((sum, r) => sum + (isUsd ? (Number(r.dollars) || 0) : Number(r.amount_ars)), 0);

        const balance = Math.max(0, deposits - withdrawals);
        const target = Number(jar.target_amount) || null;
        const progress = target && target > 0 ? Math.min(100, Math.round((balance / target) * 100)) : null;

        return {
          ...jar,
          balance,
          deposits_total: deposits,
          withdrawals_total: withdrawals,
          progress,
          movements_count: matching.length,
          last_movement_date: matching[0]?.date || jar.created_at
        };
      });

      return { success: true, data: enrichedJars };
    } catch (error) {
      logger.error('Error listJars:', error);
      throw error;
    }
  }

  static async createJar(userId, { name, currency = 'ARS', target_amount = null, color = '#6366f1', icon = 'PiggyBank', initial_deposit = 0, entry_date }) {
    if (!name || !name.trim()) {
      throw Object.assign(new Error('El nombre del frasco es obligatorio'), { statusCode: 400 });
    }

    const jars = await getUserJarsMetadata(userId);
    const id = 'jar-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const newJar = {
      id,
      name: name.trim(),
      currency: currency === 'USD' ? 'USD' : 'ARS',
      target_amount: target_amount && Number(target_amount) > 0 ? Number(target_amount) : null,
      color: color || '#6366f1',
      icon: icon || 'PiggyBank',
      created_at: new Date().toISOString()
    };

    jars.push(newJar);
    await saveUserJarsMetadata(userId, jars);

    const initialAmt = Number(initial_deposit);
    if (initialAmt > 0) {
      const d = entry_date || new Date().toISOString().slice(0, 10);
      const isUsd = newJar.currency === 'USD';
      await SavingsService.create(userId, {
        type: isUsd ? 'dolares' : 'pesos',
        date: d,
        amount_ars: isUsd ? (initialAmt * 1000) : initialAmt,
        dollars: isUsd ? initialAmt : undefined,
        exchange_rate: isUsd ? 1000 : undefined,
        direction: 'in',
        status: 'ahorrado',
        note: `[frasco:${id}] Depósito inicial`
      });
    }

    return {
      success: true,
      data: {
        ...newJar,
        balance: initialAmt > 0 ? initialAmt : 0,
        deposits_total: initialAmt > 0 ? initialAmt : 0,
        withdrawals_total: 0,
        progress: newJar.target_amount ? Math.min(100, Math.round(((initialAmt || 0) / newJar.target_amount) * 100)) : null,
        movements_count: initialAmt > 0 ? 1 : 0
      }
    };
  }

  static async updateJar(userId, jarId, updates) {
    const jars = await getUserJarsMetadata(userId);
    const idx = jars.findIndex(j => j.id === jarId);
    if (idx === -1) {
      throw Object.assign(new Error('Frasco no encontrado'), { statusCode: 404 });
    }

    if (updates.name !== undefined) {
      if (!updates.name.trim()) throw Object.assign(new Error('El nombre no puede estar vacío'), { statusCode: 400 });
      jars[idx].name = updates.name.trim();
    }
    if (updates.target_amount !== undefined) {
      jars[idx].target_amount = updates.target_amount && Number(updates.target_amount) > 0 ? Number(updates.target_amount) : null;
    }
    if (updates.color !== undefined) jars[idx].color = updates.color;
    if (updates.icon !== undefined) jars[idx].icon = updates.icon;

    await saveUserJarsMetadata(userId, jars);
    return { success: true, data: jars[idx] };
  }

  static async deleteJar(userId, jarId) {
    const jars = await getUserJarsMetadata(userId);
    const jar = jars.find(j => j.id === jarId);
    if (!jar) {
      throw Object.assign(new Error('Frasco no encontrado'), { statusCode: 404 });
    }

    const { data: recordsData } = await supabase
      .from('savings_records')
      .select('*')
      .eq('user_id', userId);

    const records = (recordsData || []).map(mapRow);
    const matching = records.filter(r => recordMatchesJar(r, jar));
    const isUsd = jar.currency === 'USD';
    const deposits = matching
      .filter(r => (r.direction === 'in' || !r.direction) && r.status === 'ahorrado')
      .reduce((s, r) => s + (isUsd ? (Number(r.dollars) || 0) : Number(r.amount_ars)), 0);
    const withdrawals = matching
      .filter(r => r.direction === 'out' && r.status === 'retirado')
      .reduce((s, r) => s + (isUsd ? (Number(r.dollars) || 0) : Number(r.amount_ars)), 0);
    const balance = deposits - withdrawals;

    if (balance > 0) {
      throw Object.assign(new Error(`No podés eliminar este frasco porque tiene un saldo de ${isUsd ? 'USD ' : '$ '} ${balance.toLocaleString('es-AR')}. Retirá el dinero antes de eliminarlo.`), { statusCode: 400 });
    }

    const filtered = jars.filter(j => j.id !== jarId);
    await saveUserJarsMetadata(userId, filtered);
    return { success: true };
  }

  static async depositToJar(userId, jarId, { amount, date, note, dollars, exchange_rate }) {
    const jars = await getUserJarsMetadata(userId);
    const jar = jars.find(j => j.id === jarId);
    if (!jar) throw Object.assign(new Error('Frasco no encontrado'), { statusCode: 404 });

    const isUsd = jar.currency === 'USD';
    const entryDate = date || new Date().toISOString().slice(0, 10);
    const customNote = note ? note.trim() : `Ingreso a ${jar.name}`;

    const record = await SavingsService.create(userId, {
      type: isUsd ? 'dolares' : 'pesos',
      date: entryDate,
      amount_ars: isUsd ? (Number(dollars) * Number(exchange_rate)) : Number(amount),
      dollars: isUsd ? Number(dollars) : undefined,
      exchange_rate: isUsd ? Number(exchange_rate) : undefined,
      direction: 'in',
      status: 'ahorrado',
      note: `[frasco:${jarId}] ${customNote}`
    });

    return { success: true, data: record.data };
  }

  static async withdrawFromJar(userId, jarId, { amount, date, note, dollars, exchange_rate }) {
    const jars = await getUserJarsMetadata(userId);
    const jar = jars.find(j => j.id === jarId);
    if (!jar) throw Object.assign(new Error('Frasco no encontrado'), { statusCode: 404 });

    const isUsd = jar.currency === 'USD';
    const withdrawAmt = isUsd ? Number(dollars) : Number(amount);
    if (!Number.isFinite(withdrawAmt) || withdrawAmt <= 0) {
      throw Object.assign(new Error('El monto a retirar debe ser mayor a 0'), { statusCode: 400 });
    }

    // Check balance
    const { data: recordsData } = await supabase
      .from('savings_records')
      .select('*')
      .eq('user_id', userId);

    const records = (recordsData || []).map(mapRow);
    const matching = records.filter(r => recordMatchesJar(r, jar));
    const deposits = matching
      .filter(r => (r.direction === 'in' || !r.direction) && r.status === 'ahorrado')
      .reduce((s, r) => s + (isUsd ? (Number(r.dollars) || 0) : Number(r.amount_ars)), 0);
    const withdrawals = matching
      .filter(r => r.direction === 'out' && r.status === 'retirado')
      .reduce((s, r) => s + (isUsd ? (Number(r.dollars) || 0) : Number(r.amount_ars)), 0);
    const currentBalance = deposits - withdrawals;

    if (withdrawAmt > currentBalance + 0.01) {
      throw Object.assign(new Error(`El monto a retirar (${withdrawAmt}) supera el saldo disponible en este frasco (${currentBalance})`), { statusCode: 400 });
    }

    const entryDate = date || new Date().toISOString().slice(0, 10);
    const customNote = note ? note.trim() : `Retiro de ${jar.name}`;

    const record = await SavingsService.create(userId, {
      type: isUsd ? 'dolares' : 'pesos',
      date: entryDate,
      amount_ars: isUsd ? (withdrawAmt * Number(exchange_rate || 1)) : withdrawAmt,
      dollars: isUsd ? withdrawAmt : undefined,
      exchange_rate: isUsd ? Number(exchange_rate || 1) : undefined,
      direction: 'out',
      status: 'retirado',
      note: `[frasco:${jarId}] ${customNote}`
    });

    return { success: true, data: record.data };
  }

  static async getJarMovements(userId, jarId) {
    const jars = await getUserJarsMetadata(userId);
    const jar = jars.find(j => j.id === jarId);
    if (!jar) throw Object.assign(new Error('Frasco no encontrado'), { statusCode: 404 });

    const { data: recordsData, error } = await supabase
      .from('savings_records')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    const records = (recordsData || []).map(mapRow);
    const matching = records.filter(r => recordMatchesJar(r, jar)).map(r => ({
      ...r,
      clean_note: cleanNote(r.note),
      jar_id: jar.id,
      jar_name: jar.name
    }));

    return { success: true, data: matching };
  }
}

export const listJars = SavingsService.listJars.bind(SavingsService);
export const createJar = SavingsService.createJar.bind(SavingsService);
export const updateJar = SavingsService.updateJar.bind(SavingsService);
export const deleteJar = SavingsService.deleteJar.bind(SavingsService);
export const depositToJar = SavingsService.depositToJar.bind(SavingsService);
export const withdrawFromJar = SavingsService.withdrawFromJar.bind(SavingsService);
export const getJarMovements = SavingsService.getJarMovements.bind(SavingsService);
