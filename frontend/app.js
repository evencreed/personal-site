// API adresi: deploy'da window.__API_BASE__ ile override edebilirsin.
const API_BASE = window.__API_BASE__ || "http://localhost:4000/api";

const yearEl = document.getElementById("year");
const toggleBtn = document.getElementById("theme-toggle");
const form = document.getElementById("contact-form");
const statusEl = document.getElementById("contact-status");
const toast = document.getElementById("toast");
const viewCvBtn = document.getElementById("view-cv-btn");
const cvModal = document.getElementById("cvModal");
const cvClose = document.getElementById("cvClose");
const topNav = document.getElementById("top-nav");

yearEl.textContent = new Date().getFullYear();

async function sendMessage({ name, email, message }) {
  const res = await fetch(`${window.__API_BASE__}/messages`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ name, email, message })
  });
  const text = await res.text();       // <- ÖNCE TEXT
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${text}`);
  // JSON ise parse et
  try { return JSON.parse(text); }
  catch { throw new Error(`Non-JSON response: ${text.slice(0,200)}`); }
}

/* Tema */
function isDark(){ return document.documentElement.classList.contains("dark"); }
toggleBtn.addEventListener("click", ()=>{
  document.documentElement.classList.toggle("dark");
  toggleBtn.textContent = isDark() ? "☾" : "☀";
});
toggleBtn.textContent = "☾";

/* Toast */
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast.tid);
  showToast.tid = setTimeout(()=> toast.classList.remove("show"), 3000);
}

/* CV Modal */
if (viewCvBtn && cvModal && cvClose){
  viewCvBtn.addEventListener("click", ()=> cvModal.showModal());
  cvClose.addEventListener("click", ()=> cvModal.close());
}

/* Aktif link (IntersectionObserver) */
const linkMap = {};
if (topNav){
  topNav.querySelectorAll("a[data-section]").forEach(a => linkMap[a.dataset.section] = a);
}
const observer = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    const id = entry.target.id;
    if (linkMap[id]) {
      if (entry.isIntersecting){
        Object.values(linkMap).forEach(a=>a.classList.remove("is-active"));
        linkMap[id].classList.add("is-active");
      }
    }
  });
}, { root: null, rootMargin: "-40% 0px -50% 0px", threshold: 0.01 });

["contact","hobbies","cv"].forEach(id=>{
  const el = document.getElementById(id);
  if (el) observer.observe(el);
});

/* İletişim formu */
form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  statusEl.textContent = "Gönderiliyor...";
  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    message: form.message.value.trim()
  };
  if (!payload.name || !payload.email || !payload.message){
    statusEl.textContent = "Lütfen tüm alanları doldurun.";
    return;
  }
  try{
    const res = await fetch(`${API_BASE}/messages`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
    const out = await res.json().catch(()=> ({}));
    if (!res.ok) throw new Error(out.error || "Bir hata oluştu");
    statusEl.textContent = "Teşekkürler! Mesajın alındı.";
    showToast("Mesaj gönderildi ✔");
    form.reset();
  }catch(err){
    statusEl.textContent = "Gönderilemedi: " + err.message;
    showToast("Hata: " + err.message);
  }
});

/* =========================
   Arkaplan: Yüzen Beyaz Çizgiler
   + Fare İzi (Gri Trail)
   ========================= */
const bgCanvas = document.getElementById("bg-lines");
const trailCanvas = document.getElementById("cursor-trail");

function sizeCanvas(canvas){
  if(!canvas) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth, h = window.innerHeight;
  canvas.width = Math.max(1, Math.floor(w * dpr));
  canvas.height = Math.max(1, Math.floor(h * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

let bgCtx = sizeCanvas(bgCanvas);
let trailCtx = sizeCanvas(trailCanvas);

window.addEventListener("resize", () => {
  bgCtx = sizeCanvas(bgCanvas);
  trailCtx = sizeCanvas(trailCanvas);
});

/* --- Yüzen çizgiler model --- */
const LCOUNT = 42; // çizgi sayısı
const lines = Array.from({length: LCOUNT}, () => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  vx: (Math.random() * 0.4 - 0.2),
  vy: (Math.random() * 0.4 - 0.2),
  len: 90 + Math.random() * 220,
  w: 0.5 + Math.random() * 1.5,
  a: 0.08 + Math.random() * 0.08, // koyuda biraz daha görünür
  ang: Math.random() * Math.PI * 2,
  rot: (Math.random() - 0.5) * 0.01
}));

function drawBackground(){
  if(!bgCtx) return;
  const W = window.innerWidth, H = window.innerHeight;
  bgCtx.clearRect(0,0,W,H);

  const dark = isDark();

  bgCtx.save();
  // beyaz çizgiler koyuda daha parlasın
  bgCtx.globalCompositeOperation = dark ? "screen" : "normal";

  for(const l of lines){
    const x2 = l.x + Math.cos(l.ang) * l.len;
    const y2 = l.y + Math.sin(l.ang) * l.len;

    const alpha = l.a * (dark ? 1.6 : 1.0);
    bgCtx.beginPath();
    bgCtx.moveTo(l.x, l.y);
    bgCtx.lineTo(x2, y2);
    bgCtx.lineWidth = l.w;
    bgCtx.strokeStyle = `rgba(255,255,255,${alpha})`;
    bgCtx.stroke();

    l.x += l.vx; l.y += l.vy; l.ang += l.rot;

    const pad = 30;
    if(l.x < -pad || l.x > W + pad) l.vx *= -1;
    if(l.y < -pad || l.y > H + pad) l.vy *= -1;
  }
  bgCtx.restore();
}

/* --- Fare izi (gri trail) --- */
const particles = [];
window.addEventListener("pointermove", (e) => {
  const { clientX: x, clientY: y } = e;
  for(let i=0;i<2;i++){
    particles.push({
      x: x + (Math.random()-0.5)*8,
      y: y + (Math.random()-0.5)*8,
      life: 1,
      r: 10 + Math.random()*14
    });
  }
});

function drawTrail(){
  if(!trailCtx) return;
  const W = window.innerWidth, H = window.innerHeight;
  trailCtx.clearRect(0,0,W,H);

  const dark = isDark();
  trailCtx.save();
  trailCtx.globalCompositeOperation = dark ? "lighter" : "multiply";

  for(let i=particles.length-1; i>=0; i--){
    const p = particles[i];
    p.x += (Math.random()-0.5)*0.4;
    p.y += (Math.random()-0.5)*0.4;

    // koyu temada daha açık ve biraz daha opak gri
    const base = dark ? 210 : 120; // gri tonu
    const alpha = (dark ? 0.28 : 0.16) * p.life;

    trailCtx.beginPath();
    trailCtx.fillStyle = `rgba(${base},${base},${base},${alpha})`;
    trailCtx.shadowBlur = dark ? 6 : 0;
    trailCtx.shadowColor = `rgba(${base},${base},${base},${alpha})`;
    trailCtx.arc(p.x, p.y, p.r * p.life, 0, Math.PI*2);
    trailCtx.fill();

    p.life *= 0.92;
    if(p.life < 0.02) particles.splice(i,1);
  }
  trailCtx.restore();
}

/* --- Döngü --- */
(function loop(){
  drawBackground();
  drawTrail();
  requestAnimationFrame(loop);
})();
