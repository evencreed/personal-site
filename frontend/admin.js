// admin.js — şık UI + güvenilir yükleme + görünür hata
const API_BASE = window.__API_BASE__ || "https://evencreed.onrender.com/api";

const $ = (s) => document.querySelector(s);
const html = document.documentElement;

function setTheme(mode){ html.setAttribute('data-theme', mode); localStorage.setItem('theme', mode); }
function getTheme(){ return localStorage.getItem('theme') || 'dark'; }
function esc(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;"); }
function fromNow(d){ const t=new Date(d).getTime(); const diff=Math.max(1,Math.floor((Date.now()-t)/1000));
  if(diff<60) return `${diff}s önce`; const m=Math.floor(diff/60); if(m<60) return `${m}dk önce`;
  const h=Math.floor(m/60); if(h<24) return `${h}s önce`; const day=Math.floor(h/24); return `${day}g önce`; }
function authHeaders(){ const t=localStorage.getItem('token'); return t?{Authorization:`Bearer ${t}`}:{ }; }

// ---- Arkaplan çizgiler (değiştirmiyoruz)
(function linesBackground(){ const c=document.getElementById('bgCanvas'); const ctx=c.getContext('2d'); let DPR=Math.max(1,window.devicePixelRatio||1),W,H,lines=[];
  function color(){ return getComputedStyle(document.documentElement).getPropertyValue('--line').trim()||'#fff'; }
  function resize(){ W=c.width=Math.floor(window.innerWidth*DPR); H=c.height=Math.floor(window.innerHeight*DPR); c.style.width='100%'; c.style.height='100%';
    const count=Math.round((window.innerWidth*window.innerHeight)/18000);
    lines=Array.from({length:count},()=>({x:Math.random()*W,y:Math.random()*H,len:(30+Math.random()*90)*DPR,spd:(0.3+Math.random()*1.2)*DPR,dir:Math.random()*Math.PI*2,thick:(0.6+Math.random()*1.2)*DPR,alpha:0.12+Math.random()*0.15}));}
  function step(){ ctx.clearRect(0,0,W,H); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=color();
    for(const l of lines){ const dx=Math.cos(l.dir)*l.len, dy=Math.sin(l.dir)*l.len; ctx.globalAlpha=l.alpha; ctx.lineWidth=l.thick;
      ctx.beginPath(); ctx.moveTo(l.x,l.y); ctx.lineTo(l.x+dx,l.y+dy); ctx.stroke();
      l.x+=Math.cos(l.dir)*l.spd; l.y+=Math.sin(l.dir)*l.spd; l.dir+=(Math.random()-0.5)*0.01;
      if(l.x<-l.len) l.x=W+l.len; if(l.x>W+l.len) l.x=-l.len; if(l.y<-l.len) l.y=H+l.len; if(l.y>H+l.len) l.y=-l.len; }
    requestAnimationFrame(step); }
  window.addEventListener('resize',resize); new MutationObserver(resize).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  resize(); step(); })();

// ---- Tema
(function(){ setTheme(getTheme()); $('#themeToggle')?.addEventListener('click',()=>setTheme(getTheme()==='dark'?'light':'dark')); })();

// ---- View helpers
function showLogin(){ $('#view-login')?.classList.remove('hidden'); $('#view-dashboard')?.classList.add('hidden'); $('#admin-status').textContent='Giriş yapınız.'; }
function showDashboard(){ $('#view-login')?.classList.add('hidden'); $('#view-dashboard')?.classList.remove('hidden'); }

// ---- API
async function apiLogin(email,password){
  const res=await fetch(`${API_BASE}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
  const text=await res.text(); let data=null; try{ data=JSON.parse(text) }catch{}
  if(!res.ok){
    // Şifre yanlış mesajı
    if(res.status===401 && (data?.error||text).toLowerCase().includes('invalid credentials')) {
      throw new Error('Şifre yanlış');
    }
    if(res.status===400) throw new Error('E-posta ve şifre zorunludur');
    throw new Error(`HTTP ${res.status} - ${text}`);
  }
  if(!data?.token) throw new Error('Token alınamadı');
  localStorage.setItem('token', data.token);
  return data;
}

async function apiListMessages(){
  const res=await fetch(`${API_BASE}/messages`,{headers:{...authHeaders()}});
  const text=await res.text(); if(!res.ok) throw new Error(`HTTP ${res.status} - ${text}`);
  let data; try{ data=JSON.parse(text) }catch{ throw new Error('Geçersiz JSON: '+text.slice(0,200)); }
  if(!Array.isArray(data)) throw new Error('Liste bekleniyordu.');
  return data;
}

// ---- Render
function renderMessages(rows){
  $('#kpi-messages').textContent = String(rows.length);
  const grid=$('#msgGrid');
  if(!grid) return;
  grid.innerHTML = rows.length ? rows.map(m=>{
    const initials=(m.name||'?').trim()[0]?.toUpperCase()||'?';
    return `<article class="msg-card">
      <div class="msg-head">
        <div class="msg-avatar">${esc(initials)}</div>
        <div><div class="msg-name">${esc(m.name)}</div><div class="msg-mail">${esc(m.email)}</div></div>
      </div>
      <div class="msg-body">${esc(m.body)}</div>
      <div class="msg-time">${fromNow(m.createdAt)}</div>
    </article>`;
  }).join('') : `<div class="muted">Mesaj bulunamadı.</div>`;
}

// ---- Init
document.addEventListener('DOMContentLoaded',()=>{
  console.log('[admin] API_BASE =', API_BASE);

  // Login form
  $('#admin-login-form')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const btn=$('#login-btn');
    const email=e.target.email.value.trim();
    const password=e.target.password.value.trim();
    try{
      btn&&(btn.disabled=true);
      $('#admin-status').textContent='Giriş yapılıyor…';
      await apiLogin(email,password);
      $('#admin-status').textContent='';
      showDashboard();
      const rows=await apiListMessages();
      renderMessages(rows);
    }catch(err){
      console.error('[LOGIN]',err);
      $('#admin-status').textContent='Giriş başarısız: '+err.message;
      // Hata durumunda dashboard'a geçme
    }finally{
      btn&&(btn.disabled=false);
    }
  });

  // Eğer önceden token varsa doğrudan dashboard + yükle
  if(localStorage.getItem('token')){
    showDashboard();
    apiListMessages()
      .then(renderMessages)
      .catch(err=>{
        console.error('[AUTO LOAD]',err);
        // Token bozuksa login ekranına dön ve net mesaj yaz
        localStorage.removeItem('token');
        showLogin();
        $('#admin-status').textContent='Oturum süresi doldu—lütfen tekrar giriş yapın.';
      });
  } else {
    showLogin();
  }

  // Yenile ve Çıkış
  $('#btn-refresh')?.addEventListener('click', async ()=>{
    try{ renderMessages(await apiListMessages()); }
    catch(err){ console.error(err); alert('Mesajlar alınamadı: '+err.message); }
  });
  $('#admin-logout')?.addEventListener('click', ()=>{
    localStorage.removeItem('token'); showLogin();
  });
});
