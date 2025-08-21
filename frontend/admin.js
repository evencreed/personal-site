const API_BASE = "http://localhost:4000/api";
const PRODUCTION = true; // canlıda true kalsın

if (PRODUCTION) {
  const seedBtn = document.getElementById("seed-btn");
  if (seedBtn) seedBtn.style.display = "none";
}

const els = {
  year: document.getElementById("year"),
  logoutBtn: document.getElementById("logout-btn"),
  loginCard: document.getElementById("login-card"),
  loginForm: document.getElementById("login-form"),
  loginStatus: document.getElementById("login-status"),
  seedBtn: document.getElementById("seed-btn"),

  dashboard: document.getElementById("dashboard"),

  projectForm: document.getElementById("project-form"),
  projectStatus: document.getElementById("project-status"),
  refreshProjects: document.getElementById("refresh-projects"),
  projectsTableBody: document.querySelector("#projects-table tbody"),

  refreshMessages: document.getElementById("refresh-messages"),
  messagesTableBody: document.querySelector("#messages-table tbody"),
};

els.year.textContent = new Date().getFullYear();

function getToken() {
  return localStorage.getItem("token") || "";
}
function setToken(t) {
  if (!t) localStorage.removeItem("token");
  else localStorage.setItem("token", t);
}
function authHeader() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }

function fmtDate(iso) {
  try { return new Date(iso).toLocaleString(); } catch { return ""; }
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    }
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  const txt = await res.text();
  try { return { ok: res.ok, data: JSON.parse(txt) }; }
  catch { return { ok: res.ok, data: txt }; }
}

async function tryAuthFlow() {
  const token = getToken();

  // 1) Token yoksa daima LOGIN ekranını göster
  if (!token) {
    show(els.loginCard);
    hide(els.dashboard);
    return;
  }

  // 2) Token varsa projeleri çekmeyi dene; başarısızsa login'e geri dön
  try {
    const r = await api("/projects", { headers: authHeader() });
    if (!r.ok) throw new Error(r.data?.error || "Auth failed");
    hide(els.loginCard);
    show(els.dashboard);
    renderProjects(Array.isArray(r.data) ? r.data : []);
    await loadMessages();
  } catch (e) {
    setToken(""); // geçersiz token temizle
    show(els.loginCard);
    hide(els.dashboard);
    els.loginStatus.textContent = "Oturum geçersiz veya süresi doldu. Lütfen tekrar giriş yapın.";
  }
}

async function loadProjects() {
  const r = await api("/projects", { headers: authHeader() });
  if (!r.ok) throw new Error(r.data?.error || "Projeler alınamadı");
  renderProjects(r.data || []);
}

function renderProjects(list) {
  els.projectsTableBody.innerHTML = "";
  list.forEach(p => {
    const tr = document.createElement("tr");
    const tags = Array.isArray(p.tags) ? p.tags.join(", ") : (p.tags || "");
    tr.innerHTML = `
      <td class="mono">${p.id}</td>
      <td>${p.title}</td>
      <td>${tags}</td>
      <td>${p.link ? `<a href="${p.link}" target="_blank">Aç</a>` : ""}</td>
      <td class="right">
        <button data-id="${p.id}" class="btn danger">Sil</button>
      </td>
    `;
    els.projectsTableBody.appendChild(tr);
  });
}

async function loadMessages() {
  const r = await api("/messages", { headers: authHeader() });
  if (!r.ok) throw new Error(r.data?.error || "Mesajlar alınamadı");
  renderMessages(r.data || []);
}

function renderMessages(list) {
  els.messagesTableBody.innerHTML = "";
  list.forEach(m => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="mono">${m.id}</td>
      <td>${m.name}</td>
      <td><a href="mailto:${m.email}">${m.email}</a></td>
      <td>${m.body}</td>
      <td class="mono">${fmtDate(m.createdAt)}</td>
    `;
    els.messagesTableBody.appendChild(tr);
  });
}

// EVENTS
els.logoutBtn.addEventListener("click", () => {
  setToken("");
  location.reload();
});

els.loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  els.loginStatus.textContent = "Giriş yapılıyor...";
  const email = e.target.email.value.trim();
  const password = e.target.password.value.trim();
  try {
    const r = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    if (!r.ok) throw new Error(r.data?.error || "Giriş başarısız");
    setToken(r.data.token);
    els.loginStatus.textContent = "Giriş başarılı.";
    await tryAuthFlow();
  } catch (err) {
    els.loginStatus.textContent = "Hata: " + err.message;
  }
});

// İlk kurulum için admin oluşturma (canlıda kaldır)
els.seedBtn.addEventListener("click", async () => {
  const email = els.loginForm.email.value.trim();
  const password = els.loginForm.password.value.trim();
  if (!email || password.length < 6) {
    els.loginStatus.textContent = "Geçerli e-posta ve en az 6 haneli şifre gir.";
    return;
  }
  els.loginStatus.textContent = "Admin oluşturuluyor...";
  try {
    const r = await api("/auth/seed-admin", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    if (!r.ok) throw new Error(r.data?.error || "Oluşturulamadı (zaten var olabilir).");
    els.loginStatus.textContent = "Admin hazır. Şimdi giriş yap.";
  } catch (err) {
    els.loginStatus.textContent = "Hata: " + err.message;
  }
});

// Proje ekleme
els.projectForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  els.projectStatus.textContent = "Kaydediliyor...";
  const form = e.target;
  const title = form.title.value.trim();
  const description = form.description.value.trim();
  const link = form.link.value.trim();
  const tags = form.tags.value.split(",").map(s => s.trim()).filter(Boolean);

  try {
    const r = await api("/projects", {
      method: "POST",
      headers: { ...authHeader() },
      body: JSON.stringify({ title, description, link: link || undefined, tags })
    });
    if (!r.ok) throw new Error(r.data?.error || "Kaydedilemedi");
    els.projectStatus.textContent = "Kaydedildi.";
    form.reset();
    await loadProjects();
  } catch (err) {
    els.projectStatus.textContent = "Hata: " + err.message;
  }
});

els.refreshProjects.addEventListener("click", loadProjects);
els.refreshMessages.addEventListener("click", loadMessages);

// Silme (event delegation)
els.projectsTableBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;
  const id = btn.getAttribute("data-id");
  if (!confirm(`#${id} nolu projeyi silmek istiyor musun?`)) return;

  try {
    const r = await api(`/projects/${id}`, {
      method: "DELETE",
      headers: { ...authHeader() }
    });
    if (!r.ok) throw new Error(r.data?.error || "Silinemedi");
    await loadProjects();
  } catch (err) {
    alert("Hata: " + err.message);
  }
});

// Başlangıç
tryAuthFlow();