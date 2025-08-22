// frontend/app.js
// HTML’de bu dosyadan ÖNCE şunu ekle:
// <script>window.__API_BASE__="https://evencreed.onrender.com/api"</script>

const API_BASE = window.__API_BASE__ || "https://evencreed.onrender.com/api";

// ---- İletişim formu (public POST /api/messages)
document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = e.target.name.value.trim();
  const email = e.target.email.value.trim();
  const message = e.target.message.value.trim();

  try {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message }),
    });
    const text = await res.text(); // önce text
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${text}`);

    // JSON ise parse et
    let data;
    try { data = JSON.parse(text); } catch { data = null; }
    alert('Mesaj gönderildi! Teşekkürler.');
    e.target.reset();
    console.log('Gönderilen:', data || text);
  } catch (err) {
    console.error(err);
    alert('Mesaj gönderilemedi: ' + err.message);
  }
});
