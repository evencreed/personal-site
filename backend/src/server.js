// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();

// ---------- CORS (preflight dahil, Vercel preview'ları da kapsar)
const allowedFromEnv = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true; // curl/Postman vb.
  try {
    const { hostname, protocol } = new URL(origin);
    if (allowedFromEnv.includes(origin)) return true;
    // *.vercel.app (https) otomatik izin (istersen kaldırabilirsin)
    if (hostname.endsWith('.vercel.app') && protocol === 'https:') return true;
  } catch (_) {}
  return false;
}

const corsOptions = {
  origin: (origin, cb) => (isAllowedOrigin(origin) ? cb(null, true) : cb(new Error('CORS blocked'))),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// ---------- Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// ---------- Geçici DB teşhis ucu
app.get('/api/db-check', async (_req, res) => {
  const info = {};
  try {
    const u = new URL(process.env.DATABASE_URL);
    info.dialect = u.protocol.replace(':', '');
    info.host = u.hostname;
    info.db = u.pathname.replace(/^\//, '');
  } catch (e) {
    info.parseError = e.message;
  }

  try {
    // PostgreSQL denemesi
    const pg = await prisma.$queryRaw`select current_user, current_database()`;
    return res.json({ ok: true, engine: 'postgres', info, pg });
  } catch (e1) {
    try {
      // SQLite denemesi
      const s = await prisma.$queryRaw`select sqlite_version() as version`;
      return res.json({ ok: true, engine: 'sqlite', info, s });
    } catch (e2) {
      return res.status(500).json({ ok: false, info, detail: e1.message });
    }
  }
});

// ---------- Auth: seed-admin (yalnızca ALLOW_SEED=true iken)
app.post('/api/auth/seed-admin', async (req, res, next) => {
  try {
    if (String(process.env.ALLOW_SEED).toLowerCase() !== 'true') {
      return res.status(403).json({ error: 'Seeding disabled' });
    }
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.json({ ok: true, message: 'Already exists' });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hash },
    });
    res.json({ ok: true, id: user.id, email: user.email });
  } catch (err) {
    next(err);
  }
});

// ---------- Auth: login → JWT
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
      return res.status(500).json({ error: 'JWT secret is not set' });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '7d' }
    );
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

// ---------- Auth middleware
function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(m[1], process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ---------- Messages
// Public: formdan mesaj bırakma
app.post('/api/messages', async (req, res, next) => {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const saved = await prisma.message.create({
      data: { name, email, body: message },
    });
    res.json(saved);
  } catch (err) {
    next(err);
  }
});

// Admin: mesajları listeleme (korumalı)
app.get('/api/messages', requireAuth, async (_req, res, next) => {
  try {
    const rows = await prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ---------- Kök sayfa (opsiyonel)
app.get('/', (_req, res) => {
  res.type('html').send(`
    <h1>API çalışıyor ✅</h1>
    <p><a href="/api/health">/api/health</a> · <a href="/api/db-check">/api/db-check</a></p>
  `);
});

// ---------- Hata yakalayıcı
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error', detail: err.message });
});

// ---------- Sunucu
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
