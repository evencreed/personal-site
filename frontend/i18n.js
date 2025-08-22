// i18n.js — TR/EN sözlük + basit i18n motoru
// Kullanım: data-i18n="key", gerekirse data-i18n-attr="placeholder"
// Parametre: data-i18n-params='{"name":"Mert"}'

(function () {
  const dict = {
    tr: {
      // NAV
      'nav.brand': 'Evencreed',
      'nav.cv': 'CV',
      'nav.hobbies': 'Hobiler',
      'nav.contact': 'İletişim',

      // HERO
      'hero.title': 'Mert Topaçoğlu',
      // Uzun paragraf: senin yazdığın metinle birebir
      'hero.desc': `Ben Mert Topaçoğlu (Evencreed). Kod yazmak benim için sadece bir iş değil, aynı zamanda yaratıcılığımı ifade etmenin bir yolu.
Frontend’de HTML, CSS, JavaScript ve React ile modern, kullanıcı dostu arayüzler kurmayı seviyorum. 
Backend tarafında Node.js, Express ve Prisma ile güçlü ve esnek uygulamalar geliştiriyorum. 
Postgres ile veriyi düzenli ve anlamlı hale getirmek benim için ayrı bir keyif.
Yeni teknolojiler öğrenmekten hoşlanıyorum; özellikle TypeScript, Next.js ve GraphQL üzerinde kendimi sürekli geliştirmeye çalışıyorum. 
Projelerimi hayata geçirirken Vercel, Render ve Supabase gibi platformlarla fikirlerimi hızla dünyaya açmak bana enerji veriyor. 
Kısacası; hem düzeni hem de özgünlüğü önemseyen, yazılımı bir sanat gibi gören biriyim.`,

      // BUTONLAR
      'btn.cv': 'CV Gör',
      'btn.contact': 'İletişim',
      'btn.send': 'Gönder',

      // CV
      'cv.title': 'CV',
      'cv.summary': 'Özet: Frontend (HTML/CSS/JS), Backend (Node/Express/Prisma), SQL (Postgres).',
      'cv.item1': 'JavaScript / Express / Prisma',
      'cv.item2': 'Responsive UI, modern tasarım',
      'cv.item3': 'DevOps: Vercel + Render + Supabase',
      'cv.download': 'CV İndir',

      // HOBİLER
      'hobbies.title': 'Hobiler',
      'hobbies.desc': `Aynı zamanda müzik prodüksiyonuyla uğraşıyorum; seslerle hikâye kurmayı ve duyguyu teknikle buluşturmayı seviyorum.
Boş zamanlarımda dövme sanatıyla uğraşıyor, aksiyon sporlarının adrenaliniyle enerjimi tazeliyorum. 
Satranç ise strateji ve odak tarafımı canlı tutuyor, dengemi sağlıyor.`,

      // İLETİŞİM
      'contact.title': 'İletişim',
      'contact.name': 'Ad Soyad',
      'contact.email': 'E-posta',
      'contact.message': 'Mesaj',
      'contact.placeholder.name': 'Adınız',
      'contact.placeholder.email': 'ornek@mail.com',
      'contact.placeholder.message': 'Merhaba...',

      // DURUM METİNLERİ
      'status.sending': 'Gönderiliyor…',
      'status.sent': 'Mesaj gönderildi, teşekkürler!',
      'status.error': 'Mesaj gönderilemedi: {err}'
    },

    en: {
      // NAV
      'nav.brand': 'Evencreed',
      'nav.cv': 'Resume',
      'nav.hobbies': 'Hobbies',
      'nav.contact': 'Contact',

      // HERO
      'hero.title': 'Mert Topaçoğlu',
      'hero.desc': `I’m Mert Topaçoğlu (Evencreed). Writing code is not just work for me—it’s a way to express creativity.
On the frontend, I enjoy building modern, user-friendly interfaces with HTML, CSS, JavaScript, and React.
On the backend, I develop robust and flexible apps using Node.js, Express, and Prisma.
With Postgres, turning data into something organized and meaningful is a joy.
I love learning new technologies; I continually improve myself in TypeScript, Next.js, and GraphQL.
Deploying projects on platforms like Vercel, Render, and Supabase energizes me by bringing ideas to life quickly.
In short, I value both order and originality—I see software as an art.`,

      // BUTTONS
      'btn.cv': 'View Resume',
      'btn.contact': 'Contact',
      'btn.send': 'Send',

      // CV
      'cv.title': 'Resume',
      'cv.summary': 'Summary: Frontend (HTML/CSS/JS), Backend (Node/Express/Prisma), SQL (Postgres).',
      'cv.item1': 'JavaScript / Express / Prisma',
      'cv.item2': 'Responsive UI, modern design',
      'cv.item3': 'DevOps: Vercel + Render + Supabase',
      'cv.download': 'Download CV',

      // HOBBIES
      'hobbies.title': 'Hobbies',
      'hobbies.desc': `I also work on music production—I love telling stories with sound and blending emotion with technique.
In my free time, I practice tattoo art and recharge with the adrenaline of action sports.
Chess keeps my strategic and focused side alive and balanced.`,

      // CONTACT
      'contact.title': 'Contact',
      'contact.name': 'Full Name',
      'contact.email': 'Email',
      'contact.message': 'Message',
      'contact.placeholder.name': 'Your name',
      'contact.placeholder.email': 'you@example.com',
      'contact.placeholder.message': 'Hello...',

      // STATUS
      'status.sending': 'Sending…',
      'status.sent': 'Message sent, thank you!',
      'status.error': 'Could not send: {err}'
    }
  };

  // Basit template: "Hi {name}" -> params.name
  function tpl(str, params) {
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? ''));
  }

  function renderAll(lang) {
    const d = dict[lang] || dict.tr;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const attr = el.dataset.i18nAttr;
      let params;
      try { params = el.dataset.i18nParams ? JSON.parse(el.dataset.i18nParams) : undefined; } catch {}

      const tr = d[key] ?? dict.tr[key] ?? key; // key yoksa TR’ye, o da yoksa key’e düş
      const val = tpl(tr, params);

      if (attr) el.setAttribute(attr, val);
      else el.textContent = val;
    });

    // HTML lang + dil seçiciyi güncelle
    document.documentElement.lang = lang;
    const sel = document.getElementById('langSelect');
    if (sel && sel.value !== lang) sel.value = lang;
  }

  const I18N = {
    current: 'tr',
    set(lang) {
      this.current = dict[lang] ? lang : 'tr';
      localStorage.setItem('lang', this.current);
      renderAll(this.current);
    },
    get() { return this.current; },
    t(key, params) {
      const d = dict[this.current] || dict.tr;
      return tpl(d[key] ?? dict.tr[key] ?? key, params);
    },
    init() {
      const stored = localStorage.getItem('lang');
      const guess = (navigator.language || 'tr').toLowerCase().startsWith('en') ? 'en' : 'tr';
      this.current = stored || guess;
      renderAll(this.current);

      // Dil seçici bağla
      const sel = document.getElementById('langSelect');
      if (sel) {
        sel.value = this.current;
        sel.addEventListener('change', (e) => this.set(e.target.value));
      }
    }
  };

  // Global export
  window.i18n = I18N;
})();
