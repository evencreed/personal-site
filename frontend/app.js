// Tema + arkaplan çizgiler + mouse izi + iletişim API + i18n

/* ================== Tema ================== */
const html = document.documentElement;
function getTheme(){ return localStorage.getItem('theme') || 'dark'; }
function setTheme(t){ html.setAttribute('data-theme', t); localStorage.setItem('theme', t); }
function toggleTheme(){ setTheme(getTheme()==='dark' ? 'light' : 'dark'); }

/* ================== API tabanı ================== */
const API_BASE = (typeof window!=='undefined' && window.__API_BASE__) || "https://evencreed.onrender.com/api";

/* ================== Arkaplan (çizgiler + mouse izi) ================== */
(function background(){
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let W=0, H=0;
  let lines = [];
  const trail = [];

  function cssVar(name, fallback='#fff'){
    try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; }
    catch { return fallback; }
  }
  function resize(){
    W = canvas.width = Math.floor(window.innerWidth * DPR);
    H = canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = '100%'; canvas.style.height = '100%';
    const count = Math.max(14, Math.round((window.innerWidth * window.innerHeight)/18000));
    lines = Array.from({length:count}, ()=>({
      x: Math.random()*W,
      y: Math.random()*H,
      len: (30+Math.random()*90)*DPR,
      spd: (0.3+Math.random()*1.1)*DPR,
      dir: Math.random()*Math.PI*2,
      thick: (0.7+Math.random()*1.4)*DPR,
      alpha: 0.12 + Math.random()*0.15
    }));
  }
  function step(){
    ctx.clearRect(0,0,W,H);

    // çizgiler
    ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle = cssVar('--line', '#fff');
    for(const l of lines){
      const dx = Math.cos(l.dir)*l.len, dy = Math.sin(l.dir)*l.len;
      ctx.globalAlpha = l.alpha;
      ctx.lineWidth = l.thick;
      ctx.beginPath(); ctx.moveTo(l.x,l.y); ctx.lineTo(l.x+dx,l.y+dy); ctx.stroke();
      l.x += Math.cos(l.dir)*l.spd; l.y += Math.sin(l.dir)*l.spd; l.dir += (Math.random()-.5)*.01;
      if(l.x<-l.len) l.x=W+l.len; if(l.x>W+l.len) l.x=-l.len;
      if(l.y<-l.len) l.y=H+l.len; if(l.y>H+l.len) l.y=-l.len;
    }

    // mouse izi
    ctx.globalCompositeOperation='source-over';
    for(let i=trail.length-1;i>=0;i--){
      const p = trail[i];
      p.life -= 0.016;
      if(p.life<=0){ trail.splice(i,1); continue; }
      ctx.globalAlpha = Math.min(.28, p.life*.35);
      ctx.fillStyle = cssVar('--trail', '#9a9a9a');
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
      p.r *= 0.985;
    }
    requestAnimationFrame(step);
  }
  function onMouseMove(e){
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * DPR;
    const y = (e.clientY - rect.top) * DPR;
    for(let k=0;k<2;k++){
      trail.push({ x, y, r: (6+Math.random()*10)*DPR, life: 1.0 });
    }
    if(trail.length>400) trail.splice(0, trail.length-400);
  }
  window.addEventListener('resize', resize, {passive:true});
  new MutationObserver(resize).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});
  canvas.addEventListener('mousemove', onMouseMove, {passive:true});
  resize(); step();
})();

/* ================== UI & i18n ================== */
document.addEventListener('DOMContentLoaded', ()=>{
  // Yıl
  const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();

  // Tema
  setTheme(getTheme());
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

  // i18n
  if (window.i18n?.init) {
    window.i18n.init();
    document.getElementById('langSelect')?.addEventListener('change', (e)=>{
      window.i18n.set(e.target.value);
    });
  }

  // İletişim formu
  const form = document.getElementById('contact-form');
  const status = document.getElementById('contact-status');

  async function sendMessage(payload){
    const res = await fetch(`${API_BASE}/messages`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    if(!res.ok) throw new Error(text);
    try { return JSON.parse(text); } catch { return text; }
  }

  form?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const t = (k, params)=> window.i18n?.t ? window.i18n.t(k, params) : k;

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    const company = form.company?.value || ''; // honeypot

    try{
      if(company) { status.textContent = 'Bot detected'; return; }
      btn && (btn.disabled = true);
      status.textContent = t('status.sending');

      await sendMessage({ name, email, message, company });
      status.textContent = t('status.sent');
      form.reset();
    }catch(err){
      console.error(err);
      const msg = (err?.message || String(err)).slice(0,150);
      status.textContent = t('status.error', { err: msg });
    }finally{
      btn && (btn.disabled = false);
      setTimeout(()=> status.textContent='', 5000);
    }
  });
});
