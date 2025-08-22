// admin.js
const API_BASE = window.__API_BASE__ || "https://evencreed.onrender.com/api";

// Mini yardımcılar
const qs = (s) => document.querySelector(s);
const statusEl = () => qs('#admin-status');
const outEl = () => qs('#admin-output');

function setStatus(msg, ok = true) {
  const el = statusEl(); if (!el) return;
  el.textContent = msg;
  el.className = ok ? 'ok' : 'err';
}
function showOut(obj) {
  const el = outEl(); if (!el) return;
  el.textContent = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
}
function authHeaders() {
  const t = localStorage.getItem('token');
  return t ? { 'Authorization': `Bearer ${t}` } : {};
}

// Sayfa yüklendiğinde formu bağla
document.addEventListener('DOMContentLoaded', () => {
  console.log('[admin.js] loaded. API_BASE =', API_BASE);

  const form = qs('#admin-login-form');
  if (!form) {
    console.warn('Form bulunamadı: #admin-login-form');
    setStatus('Form bulunamadı (#admin-login-form).', false);
    return;
  } else {
    setStatus('Form hazır. Giriş yapabilirsiniz.', true);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = qs('#login-btn');
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    try {
      btn && (btn.disabled = true);
      setStatus('Giriş yapılıyor…');

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text(); // önce text al ki hata HTML ise görelim
      console.log('LOGIN response:', res.status, text);

      if (!res.ok) throw new Error(`HTTP ${res.status} - ${text}`);

      // JSON bekliyoruz
      let data;
      try { data = JSON.parse(text); }
      catch { throw new Error('Geçersiz JSON: ' + text.slice(0, 200)); }

      if (!data.token) throw new Error('Token alınamadı');
      localStorage.setItem('token', data.token);
      setStatus('Giriş başarılı!', true);

      await loadMessages();
    } catch (err) {
      console.error('[LOGIN ERROR]', err);
      setStatus('Giriş başarısız: ' + err.message, false);
    } finally {
      btn && (btn.disabled = false);
    }
  });

  // Listeleme butonu
  qs('#btn-list-messages')?.addEventListener('click', () => {
    loadMessages().catch(err => {
      console.error('[LIST ERROR]', err);
      setStatus('Mesajlar alınamadı: ' + err.message, false);
    });
  });

  // Çıkış
  qs('#admin-logout')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    setStatus('Çıkış yapıldı', true);
    showOut('Henüz veri yok.');
    qs('#messages-list').innerHTML = '';
  });

  // Sayfa açıldığında token varsa otomatik listele
  if (localStorage.getItem('token')) {
    loadMessages().catch(console.error);
  }
});

async function loadMessages() {
  setStatus('Mesajlar yükleniyor…');
  const res = await fetch(`${API_BASE}/messages`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  const text = await res.text();
  console.log('MESSAGES response:', res.status);

  if (!res.ok) throw new Error(`HTTP ${res.status} - ${text}`);
  let rows;
  try { rows = JSON.parse(text); }
  catch { throw new Error('Geçersiz JSON: ' + text.slice(0, 200)); }

  if (!Array.isArray(rows)) throw new Error('Liste bekleniyordu.');
  setStatus(`Mesajlar yüklendi (${rows.length})`, true);
  showOut(rows);

  const ul = qs('#messages-list');
  if (ul) {
    ul.innerHTML = rows.length
      ? rows.map(m => `<li><b>${escapeHtml(m.name)}</b> &lt;${escapeHtml(m.email)}&gt; — ${escapeHtml(m.body)} <small>${new Date(m.createdAt).toLocaleString()}</small></li>`).join('')
      : '<li>Mesaj yok.</li>';
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
