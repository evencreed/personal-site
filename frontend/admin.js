// admin.js — modern arayüz + uçuşan çizgiler + tema toggle
const API_BASE = window.__API_BASE__ || "https://evencreed.onrender.com/api";

/* ========== Yardımcılar ========== */
const $ = (s) => document.querySelector(s);
const html = document.documentElement;

function setTheme(mode) {
  html.setAttribute('data-theme', mode);
  localStorage.setItem('theme', mode);
}
function getTheme() {
  return localStorage.getItem('theme') || 'dark';
}
function fromNow(d) {
  const t = new Date(d).getTime();
  const diff = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (diff < 60) return `${diff}s önce`;
  const m = Math.floor(diff/60); if (m < 60) return `${m}dk önce`;
  const h = Math.floor(m/60); if (h < 24) return `${h}s önce`;
  const day = Math.floor(h/24); return `${day}g önce`;
}
function esc(s) {
  return String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}
function authHeaders() {
  const t = localStorage.getItem('token');
  return t ? { 'Authorization': `Bearer ${t}` } : {};
}

/* ========== Arkaplan: uçuşan çizgiler ========== */
(function linesBackground(){
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let W, H, lines = [];

  function color() {
    // CSS değişkeninden çizgi rengini al
    return getComputedStyle(document.documentElement).getPropertyValue('--line').trim() || '#fff';
  }
  function resize() {
    W = canvas.width = Math.floor(window.innerWidth * DPR);
    H = canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    // çizgileri yeniden oluştur
    const count = Math.round((window.innerWidth * window.innerHeight) / 18000);
    lines = Array.from({length: count}, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      len: (30 + Math.random()*90) * DPR,
      spd: (0.3 + Math.random()*1.2) * DPR,
      dir: Math.random() * Math.PI * 2,
      thick: (0.6 + Math.random()*1.2) * DPR,
      alpha: 0.12 + Math.random()*0.15
    }));
  }
  function step() {
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = color();

    for (const l of lines) {
      const dx = Math.cos(l.dir) * l.len;
      const dy = Math.sin(l.dir) * l.len;

      ctx.globalAlpha = l.alpha;
      ctx.lineWidth = l.thick;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x + dx, l.y + dy);
      ctx.stroke();

      // hareket (hafif yön salınımı)
      l.x += Math.cos(l.dir) * l.spd;
      l.y += Math.sin(l.dir) * l.spd;
      l.dir += (Math.random() - 0.5) * 0.01;

      // ekran dışına taşarsa sar
      if (l.x < -l.len) l.x = W + l.len;
      if (l.x > W + l.len) l.x = -l.len;
      if (l.y < -l.len) l.y = H + l.len;
      if (l.y > H + l.len) l.y = -l.len;
    }
    requestAnimationFrame(step);
  }

  window.addEventListener('resize', resize);
  new MutationObserver(resize).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  resize(); step();
})();

/* ========== Tema Toggle ========== */
(function themeInit(){
  setTheme(getTheme());
  $('#themeToggle')?.addEventListener('click', () => {
    setTheme(getTheme()==='dark' ? 'light' : 'dark');
  });
})();

/* ========== Görünümler: login vs dashboard ========== */
function showLogin() {
  $('#view-login')?.classList.remove('hidden');
  $('#view-dashboard')?.classList.add('hidden');
  $('#admin-status').textContent = 'Giriş yapınız.';
}
function showDashboard() {
  $('#view-login')?.classList.add('hidden');
  $('#view-dashboard')?.classList.remove('hidden');
}

/* ========== API ========== */
async function apiLogin(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ email, password })
  });
  const text = await res.text();

  // Hata: önce JSON'u dene
  let data = null;
  try { data = JSON.parse(text); } catch {}

  if (!res.ok) {
    // 401 ise ve backend "Invalid credentials" döndüyse özel mesaj göster
    if (res.status === 401 && (data?.error || text).toLowerCase().includes('invalid credentials')) {
      throw new Error('Şifre yanlış');
    }
    if (res.status === 400) {
      throw new Error('E-posta ve şifre zorunludur');
    }
    // diğerleri için ham hata
    throw new Error(`HTTP ${res.status} - ${text}`);
  }

  // Başarılı
  if (!data?.token) throw new Error('Token alınamadı');
  localStorage.setItem('token', data.token);
  return data;
}

/* ========== Mesaj grid render ========== */
function renderMessages(rows) {
  $('#kpi-messages').textContent = rows.length.toString();
  const grid = $('#msgGrid');
  if (!grid) return;
  if (!rows.length) {
    grid.innerHTML = `<div class="muted">Mesaj bulunamadı.</div>`;
    return;
  }
  grid.innerHTML = rows.map(m => {
    const initials = (m.name || '?').trim()[0]?.toUpperCase() || '?';
    return `
      <article class="msg-card">
        <div class="msg-head">
          <div class="msg-avatar">${esc(initials)}</div>
          <div>
            <div class="msg-name">${esc(m.name)}</div>
            <div class="msg-mail">${esc(m.email)}</div>
          </div>
        </div>
        <div class="msg-body">${esc(m.body)}</div>
        <div class="msg-time">${fromNow(m.createdAt)}</div>
      </article>
    `;
  }).join('');
}

/* ========== Event binding ========== */
document.addEventListener('DOMContentLoaded', () => {
  // Eğer token varsa direkt dashboard
  if (localStorage.getItem('token')) {
    showDashboard();
    apiListMessages()
      .then(renderMessages)
      .catch(err => { console.error(err); showLogin(); });
  } else {
    showLogin();
  }

  // Login form
  $('#admin-login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#login-btn');
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();
    try {
      btn && (btn.disabled = true);
      $('#admin-status').textContent = 'Giriş yapılıyor…';
      await apiLogin(email, password);
      $('#admin-status').textContent = '';
      showDashboard();
      const rows = await apiListMessages();
      renderMessages(rows);
    } catch (err) {
      console.error(err);
      $('#admin-status').textContent = 'Giriş başarısız: ' + err.message;
    } finally {
      btn && (btn.disabled = false);
    }
  });

  // Yenile
  $('#btn-refresh')?.addEventListener('click', async () => {
    try {
      const rows = await apiListMessages();
      renderMessages(rows);
    } catch (err) {
      console.error(err);
      alert('Mesajlar alınamadı: ' + err.message);
    }
  });

  // Çıkış
  $('#admin-logout')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    showLogin();
  });
});
