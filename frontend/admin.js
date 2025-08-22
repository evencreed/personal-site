// frontend/admin.js
// HTML’de bu dosyadan ÖNCE şunu ekle:
// <script>window.__API_BASE__="https://evencreed.onrender.com/api"</script>

const API_BASE = window.__API_BASE__ || "https://evencreed.onrender.com/api";

function authHeaders() {
  const t = localStorage.getItem('token');
  return t ? { 'Authorization': `Bearer ${t}` } : {};
}

// ---- Login formu
document.getElementById('admin-login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.email.value.trim();
  const password = e.target.password.value.trim();

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const text = await res.text(); // önce text
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${text}`);

    const data = JSON.parse(text);
    localStorage.setItem('token', data.token);
    alert('Giriş başarılı!');
    await loadMessages();
  } catch (err) {
    console.error(err);
    alert('Giriş başarısız: ' + err.message);
  }
});

// ---- Mesajları listele (korumalı GET /api/messages)
async function loadMessages() {
  const listEl = document.getElementById('messages-list');
  if (!listEl) return;

  listEl.innerHTML = '<li>Yükleniyor...</li>';
  try {
    const res = await fetch(`${API_BASE}/messages`, {
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${text}`);
    const rows = JSON.parse(text);

    if (!rows.length) {
      listEl.innerHTML = '<li>Mesaj yok.</li>';
      return;
    }
    listEl.innerHTML = rows.map(
      m => `<li><b>${escapeHtml(m.name)}</b> &lt;${escapeHtml(m.email)}&gt; — ${escapeHtml(m.body)} <small>${new Date(m.createdAt).toLocaleString()}</small></li>`
    ).join('');
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<li style="color:red">Hata: ${escapeHtml(err.message)}</li>`;
  }
}

// ---- Çıkış
document.getElementById('admin-logout')?.addEventListener('click', () => {
  localStorage.removeItem('token');
  alert('Çıkış yapıldı');
});

// ---- Basit HTML escape helper
function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// Sayfa açıldığında token varsa mesajları yükle
if (localStorage.getItem('token')) {
  loadMessages().catch(console.error);
}
