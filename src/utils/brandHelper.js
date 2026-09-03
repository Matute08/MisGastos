/**
 * Helper to dynamically detect bank and card brands from user-entered strings
 * and return matching fintech themes, gradients, and neon badges.
 */

const BANK_PRESETS = [
  { keywords: ['mercado pago', 'mercado credito', 'mercadopago', 'mercadocredito'], name: 'Mercado Pago', bg: 'from-sky-950/90 via-slate-900 to-sky-900/60', neon: 'ring-sky-500/30 text-sky-400', accent: '#009EE3' },
  { keywords: ['santander', 'rio'], name: 'Santander', bg: 'from-red-950/90 via-slate-900 to-red-900/60', neon: 'ring-red-500/30 text-red-400', accent: '#EC0000' },
  { keywords: ['galicia'], name: 'Galicia', bg: 'from-orange-950/90 via-slate-900 to-amber-900/60', neon: 'ring-orange-500/30 text-orange-400', accent: '#FF4800' },
  { keywords: ['bbva', 'frances'], name: 'BBVA', bg: 'from-blue-950/90 via-slate-900 to-blue-900/60', neon: 'ring-blue-500/30 text-blue-400', accent: '#004481' },
  { keywords: ['naranja', 'naranja x'], name: 'Naranja X', bg: 'from-amber-950/90 via-slate-900 to-orange-900/60', neon: 'ring-orange-500/30 text-orange-400', accent: '#FF6600' },
  { keywords: ['nacion', 'nación', 'bna', 'nativa'], name: 'Banco Nación', bg: 'from-cyan-950/90 via-slate-900 to-blue-900/60', neon: 'ring-cyan-500/30 text-cyan-400', accent: '#006699' },
  { keywords: ['brubank'], name: 'Brubank', bg: 'from-violet-950/90 via-slate-900 to-purple-900/60', neon: 'ring-violet-500/30 text-violet-400', accent: '#6833FF' },
  { keywords: ['uala', 'ualá'], name: 'Ualá', bg: 'from-rose-950/90 via-slate-900 to-pink-900/60', neon: 'ring-rose-500/30 text-rose-400', accent: '#FF3366' },
  { keywords: ['lemon'], name: 'Lemon Cash', bg: 'from-emerald-950/90 via-slate-900 to-green-900/60', neon: 'ring-emerald-500/30 text-emerald-400', accent: '#00FF7F' },
  { keywords: ['macro'], name: 'Banco Macro', bg: 'from-blue-950/90 via-slate-900 to-indigo-900/60', neon: 'ring-blue-500/30 text-blue-400', accent: '#002F6C' },
  { keywords: ['patagonia'], name: 'Patagonia', bg: 'from-teal-950/90 via-slate-900 to-cyan-900/60', neon: 'ring-teal-500/30 text-teal-400', accent: '#008080' },
  { keywords: ['icbc'], name: 'ICBC', bg: 'from-red-950/90 via-slate-900 to-rose-900/60', neon: 'ring-red-500/30 text-red-400', accent: '#C8102E' }
];

const CARD_NETWORK_PRESETS = [
  { keywords: ['mastercard', 'master'], brand: 'Mastercard', badgeColor: 'bg-amber-500/20 text-amber-300 ring-amber-500/30' },
  { keywords: ['visa'], brand: 'Visa', badgeColor: 'bg-blue-500/20 text-blue-300 ring-blue-500/30' },
  { keywords: ['amex', 'american express', 'american'], brand: 'Amex', badgeColor: 'bg-cyan-500/20 text-cyan-300 ring-cyan-500/30' },
  { keywords: ['cabal'], brand: 'Cabal', badgeColor: 'bg-indigo-500/20 text-indigo-300 ring-indigo-500/30' }
];

export function getCardBrandInfo(cardName = '', bankName = '') {
  const text = `${cardName} ${bankName}`.toLowerCase();

  // Detect bank
  const bank = BANK_PRESETS.find(b => b.keywords.some(k => text.includes(k)));

  // Detect network
  const network = CARD_NETWORK_PRESETS.find(n => n.keywords.some(k => text.includes(k)));

  return {
    bankName: bank ? bank.name : (bankName || 'Tarjeta'),
    networkName: network ? network.brand : null,
    networkBadge: network ? network.badgeColor : 'bg-slate-700/40 text-slate-300 ring-white/10',
    cardGradient: bank ? bank.bg : 'from-slate-900 via-slate-850 to-indigo-950/60',
    neonRing: bank ? bank.neon : 'ring-indigo-500/20 text-indigo-400',
    accentColor: bank ? bank.accent : '#6366F1'
  };
}
