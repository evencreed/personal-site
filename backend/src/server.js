// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Firebase Admin SDK
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const app = express();

// ---------- CORS
const allowedFromEnv = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true; // curl/Postman gibi
  try {
    const { hostname, protocol } = new URL(origin);

    // Render domainine her zaman izin ver
    if (hostname.endsWith('onrender.com')) return true;

    // ENV’de izin verilenler
    if (allowedFromEnv.includes(origin)) return true;

    // Vercel preview'larına izin
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

// ---------- Auth: seed-admin (ALLOW_SEED=true iken)
app.post('/api/auth/seed-admin', async (req, res, next) => {
  try {
    if (String(process.env.ALLOW_SEED).toLowerCase() !== 'true') {
      return res.status(403).json({ error: 'Seeding disabled' });
    }
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });

    const snapshot = await db.collection('admins').where('email', '==', email).get();
    if (!snapshot.empty) {
      return res.json({ ok: true, message: 'Already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const docRef = await db.collection('admins').add({
      email,
      password: hash,
      createdAt: new Date()
    });

    res.json({ ok: true, id: docRef.id, email });
  } catch (err) {
    next(err);
  }
});

// ---------- Auth: login → JWT
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });

    const snapshot = await db.collection('admins').where('email', '==', email).get();
    if (snapshot.empty) return res.status(401).json({ error: 'Invalid credentials' });

    const adminUser = snapshot.docs[0].data();
    const ok = await bcrypt.compare(password, adminUser.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
      return res.status(500).json({ error: 'JWT secret is not set' });
    }

    const token = jwt.sign(
      { email },
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
    const docRef = await db.collection('messages').add({
      name,
      email,
      body: message,
      createdAt: new Date()
    });
    res.json({ id: docRef.id, name, email, message });
  } catch (err) {
    next(err);
  }
});

// Admin: mesajları listeleme (korumalı)
app.get('/api/messages', requireAuth, async (_req, res, next) => {
  try {
    const snapshot = await db
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ---------- Kök sayfa (opsiyonel)
app.get('/', (_req, res) => {
  res.type('html').send(`
    <h1>API çalışıyor ✅</h1>
    <p><a href="/api/health">/api/health</a></p>
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
app.use(express.static("public"));
