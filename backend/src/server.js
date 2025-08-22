// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const allowed = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const app = express();
app.use(express.json());
app.use(cors({ origin: allowed.length ? allowed : true }));

// Geçici DB teşhis ucu: hangi DB'ye bağlıyım?
app.get('/api/db-check', async (_req, res) => {
  try {
    const info = await prisma.$queryRaw`select current_user, current_database()`;
    res.json({ ok: true, info });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// -------- Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// -------- AUTH
// Seed admin (sadece geçici olarak ALLOW_SEED=true iken)
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
      data: { email, password: hash }
    });
    res.json({ ok: true, id: user.id, email: user.email });
  } catch (err) { next(err); }
});

// Login → JWT
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '7d' }
    );
    res.json({ token });
  } catch (err) { next(err); }
});

// (İsteğe bağlı) korumalı örnek
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

// -------- Messages
app.post('/api/messages', async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });

    const saved = await prisma.message.create({
      data: { name, email, body: message }
    });
    res.json(saved);
  } catch (err) { next(err); }
});

app.get('/api/messages', /* requireAuth, */ async (_req, res, next) => {
  try {
    const rows = await prisma.message.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
    res.json(rows);
  } catch (err) { next(err); }
});

// -------- (opsiyonel) kök sayfa
app.get('/', (_req, res) => {
  res.type('html').send(`
    <h1>API çalışıyor ✅</h1>
    <p><a href="/api/health">/api/health</a></p>
  `);
});

// -------- error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error', detail: err.message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
