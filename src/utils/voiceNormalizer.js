// ============================================================
// VOICE NORMALIZER
// Turns raw speech transcripts into clean field values.
// ============================================================

const normalizeText = (raw) => raw.trim();

const normalizeName = (raw) =>
  raw
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

const normalizeEmail = (raw) => {
  let s = raw.toLowerCase();
  s = s.replace(/\s+at\s+/g, '@');
  s = s.replace(/\s+dot\s+/g, '.');
  s = s.replace(/\s+dash\s+/g, '-');
  s = s.replace(/\s+underscore\s+/g, '_');
  s = s.replace(/\s+/g, '');
  return s;
};

const normalizePhone = (raw) => {
  const words = {
    zero: '0', oh: '0',
    one: '1', won: '1',
    two: '2', to: '2', too: '2',
    three: '3',
    four: '4', for: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8', ate: '8',
    nine: '9',
  };
  let s = raw.toLowerCase();
  Object.entries(words).forEach(([w, d]) => {
    s = s.replace(new RegExp(`\\b${w}\\b`, 'g'), d);
  });
  s = s.replace(/\D/g, '');
  return s;
};

const normalizeDate = (raw) => {
  const s = raw.trim().toLowerCase();

  const numeric = s.match(/(\d{1,2})[/\-\s](\d{1,2})[/\-\s](\d{2,4})/);
  if (numeric) {
    let [, d, m, y] = numeric;
    if (y.length === 2) y = '19' + y;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  const months = {
    january: '01', february: '02', march: '03', april: '04',
    may: '05', june: '06', july: '07', august: '08',
    september: '09', october: '10', november: '11', december: '12',
  };
  const words = s.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (words) {
    const [, d, monthName, y] = words;
    const m = months[monthName];
    if (m) return `${y}-${m}-${String(d).padStart(2, '0')}`;
  }

  return raw;
};

export const normalizeVoice = (fieldType, raw) => {
  if (!raw) return '';
  switch (fieldType) {
    case 'name': return normalizeName(raw);
    case 'email': return normalizeEmail(raw);
    case 'phone': return normalizePhone(raw);
    case 'date': return normalizeDate(raw);
    case 'text':
    default: return normalizeText(raw);
  }
};