/**
 * ONYX MUN — rate-limited application submission proxy
 * IP + email throttling before Supabase insert
 */

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://pmqbfmgjazlbtdtnlvez.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcWJmbWdqYXpsYnRkdG5sdmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTQ5MzgsImV4cCI6MjA5MjIzMDkzOH0.XjmK1DhqyJJaTcBXso0IdkFrcK4C2f0MqxexDqzdrwQ';

const ALLOWED_TABLES = new Set([
  'delegate_applications',
  'oc_applications',
  'eb_applications',
  'priority_applications',
]);

const ALLOWED_ORIGINS = new Set([
  'https://onyxmunhyd.in',
  'https://www.onyxmunhyd.in',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

const LIMITS = {
  ipPerHour: 15,
  emailPerHour: 3,
  phonePerHour: 3,
  windowMs: 60 * 60 * 1000,
};

function getStore() {
  if (!globalThis.__onyxRateBuckets) {
    globalThis.__onyxRateBuckets = new Map();
  }
  return globalThis.__onyxRateBuckets;
}

function pruneStore() {
  const store = getStore();
  const now = Date.now();
  for (const [key, bucket] of store.entries()) {
    if (now - bucket.start > LIMITS.windowMs) store.delete(key);
  }
}

function rateLimit(key, max) {
  const store = getStore();
  const now = Date.now();
  let bucket = store.get(key);
  if (!bucket || now - bucket.start > LIMITS.windowMs) {
    bucket = { start: now, count: 0 };
    store.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count <= max;
}

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

module.exports = async (req, res) => {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  pruneStore();

  const ip = clientIp(req);
  if (!rateLimit(`ip:${ip}`, LIMITS.ipPerHour)) {
    res.setHeader('Retry-After', '3600');
    return res.status(429).json({
      error: 'Too many requests from your network. Please try again in an hour.',
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { table, data, hp, minElapsed } = body || {};

  if (hp) {
    return res.status(200).json({ ok: true });
  }

  if (typeof minElapsed === 'number' && minElapsed < 8) {
    return res.status(400).json({
      error: 'Please review your application before submitting.',
    });
  }

  if (!ALLOWED_TABLES.has(table)) {
    return res.status(400).json({ error: 'Invalid submission type' });
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({ error: 'Missing application data' });
  }

  const email = normalizeEmail(data.email);
  const phone = normalizePhone(data.phone);

  if (email && !rateLimit(`email:${email}:${table}`, LIMITS.emailPerHour)) {
    res.setHeader('Retry-After', '3600');
    return res.status(429).json({
      error: 'Too many applications from this email. Please wait before trying again.',
    });
  }

  if (phone && phone.length >= 10 && !rateLimit(`phone:${phone}:${table}`, LIMITS.phonePerHour)) {
    res.setHeader('Retry-After', '3600');
    return res.status(429).json({
      error: 'Too many applications from this phone number. Please wait before trying again.',
    });
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const detail = await response.text();
    let message = 'Submission failed. Please try again.';

    if (detail.includes('Rate limit exceeded') || detail.includes('duplicate')) {
      message =
        detail.includes('duplicate') || detail.includes('unique')
          ? 'An application with these details already exists.'
          : 'Please wait before submitting again.';
    }

    const status = response.status >= 400 && response.status < 500 ? response.status : 502;
    return res.status(status).json({ error: message });
  }

  return res.status(200).json({ ok: true });
};
