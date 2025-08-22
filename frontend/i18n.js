// i18n.js — basit, dosyasız i18n motoru (TR/EN)
// data-i18n="key", data-i18n-attr="placeholder" (opsiyon), data-i18n-params='{"name":"..."}'
(function(){
  const dict = {
    tr: {
      'nav.cv':'CV',
      'nav.hobbies':'Hobiler',
      'nav.contact':'İletişim',

      'hero.title':'Mert Topaçoğlu',
      'hero.desc':'Ben Mert Topaçoğlu(Evencreed). Kod yazmak benim için sadece bir iş değil, aynı zamanda yaratıcılığımı ifade etmenin bir yolu. 
        Frontend’de HTML, CSS, JavaScript ve React ile modern, kullanıcı dostu arayüzler kurmayı seviyorum. Backend tarafında Node.js, 
    Express ve Prisma ile güçlü ve esnek uygulamalar geliştiriyorum. Postgres ile veriyi düzenli ve anlamlı hale getirmek benim için ayrı bir keyif.

Yeni teknolojiler öğrenmekten hoşlanıyorum; özellikle TypeScript, Next.js ve GraphQL üzerinde kendimi sürekli geliştirmeye çalışıyorum. 
    Projelerimi hayata geçirirken Vercel, Render ve Supabase gibi platformlarla fikirlerimi hızla dünyaya açmak bana enerji veriyor. 
    Kısacası; hem düzeni hem de özgünlüğü önemseyen, yazılımı bir sanat gibi gören biriyim.',

      'btn.cv':'CV Gör',
      'btn.contact':'İletişim',
      'btn.send':'Gönder',

      'cv.title':'CV',
      'cv.summary':'Özet: Frontend (HTML/CSS/JS), Backend (Node/Express/Prisma), SQL (Postgres).',
      'cv.item1':'JavaScript / Express / Prisma',
      'cv.item2':'Responsive UI, modern tasarım',
      'cv.item3':'DevOps: Vercel + Render + Supabase',
      'cv.download':'PDF İndir',

      'hobbies.title':'Hobiler',
      'hobbies.desc':'Aynı zamanda müzik prodüksiyonuyla uğraşıyorum; seslerle hikâye kurmayı ve duyguyu teknikle buluşturmayı seviyorum.
        Boş zamanlarımda dövme sanatıyla uğraşıyor, aksiyon sporlarının adrenaliniyle enerjimi tazeliyorum. 
        Satranç ise strateji ve odak tarafımı canlı tutuyor, dengemi sağlıyor.',

      'contact.title':'İletişim',
      'contact.name':'Ad Soyad',
      'contact.email':'E-posta',
      'contact.message':'Mesaj',
      'contact.placeholder.name':'Adınız',
      'contact.placeholder.email':'ornek@mail.com',
      'contact.placeholder.message':'Merhaba...',

      'status.sending':'Gönderiliyor…',
      'status.sent':'Mesaj gönderildi, teşekkürler!',
      'status.error':'Mesaj gönderilemedi: {err}'
    },
    en: {
      'nav.cv':'Resume',
      'nav.hobbies':'Hobbies',
      'nav.contact':'Contact',

      'hero.title':'Hi, I’m {name} 👋',
      'hero.desc':'I’m Mert Topaçoğlu. For me, coding isn’t just work—it’s a way of expressing creativity.
        On the frontend, I enjoy building modern, user-friendly interfaces with HTML, CSS, JavaScript, and React. 
        On the backend, I develop powerful and flexible applications with Node.js, Express, and Prisma. 
        Working with Postgres and organizing data into something meaningful is always a joy.
        I love exploring new technologies, especially TypeScript, Next.js, and GraphQL. 
        Bringing projects to life with platforms like Vercel, Render, and Supabase keeps me motivated and excited. 
        In short, I value both structure and originality, and I see software development as a form of art.',

      'btn.cv':'View Resume',
      'btn.contact':'Contact',
      'btn.send':'Send',

      'cv.title':'Resume',
      'cv.summary':'Summary: Frontend (HTML/CSS/JS), Backend (Node/Express/Prisma), SQL (Postgres).',
      'cv.item1':'JavaScript / Express / Prisma',
      'cv.item2':'Responsive UI, modern design',
      'cv.item3':'DevOps: Vercel + Render + Supabase',
      'cv.download':'Download PDF',

      'hobbies.title':'Hobbies',
      'hobbies.desc':'I also do music production; I love telling stories with sound and blending emotion with technique. In my free time, 
        I practice the art of tattooing and recharge with the adrenaline of action sports. Chess keeps my strategic focus sharp and helps me stay balanced.',

      'contact.title':'Contact',
      'contact.name':'Full Name',
      'contact.email':'Email',
      'contact.message':'Message',
      'contact.placeholder.name':'Your name',
      'contact.placeholder.email':'you@example.com',
      'contact.placeholder.message':'Hello...',

      'status.sending':'Sending…',
      'status.sent':'Message sent, thank you!',
      'status.error':'Could not send: {err}'
    }
  };

  const I18N = {
    current: 'tr',
    t(key, params){
      const d = dict[this.current] || dict.tr;
      let s = d[key] || dict.tr[key] || key;
      if (params) s = s.replace(/\{(\w+)\}/g, (_,p)=> (params[p] ?? ''));
      return s;
    },
    render(){
      document.querySelectorAll('[data-i18n]').forEach(el=>{
        const key = el.dataset.i18n;
        const attr = el.dataset.i18nAttr;
        let params = undefined;
        try { params = el.dataset.i18nParams ? JSON.parse(el.dataset.i18nParams) : undefined; } catch {}
        const val = this.t(key, params);
        if (attr) el.setAttribute(attr, val);
        else el.textContent = val;
      });
      // HTML lang ve seçici eşitle
      document.documentElement.lang = this.current;
      const sel = document.getElementById('langSelect');
      if (sel) sel.value = this.current;
      localStorage.setItem('lang', this.current);
    }
  };

  window.i18n = {
    set(lang){ I18N.current = (dict[lang] ? lang : 'tr'); I18N.render(); },
    get(){ return I18N.current; },
    t(key, params){ return I18N.t(key, params); },
    init(){
      const stored = localStorage.getItem('lang');
      const guess = (navigator.language || 'tr').toLowerCase().startsWith('en') ? 'en' : 'tr';
      I18N.current = stored || guess;
      I18N.render();
    }
  };
})();
