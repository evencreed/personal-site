Evencreed — Personal Website & Admin Panel

This project is a modern personal website and admin panel developed for Mert Topaçoğlu (Evencreed).
The frontend runs on Vercel, while the backend uses Render + Firebase.

 Features
 User Interface (Frontend)

Personal introduction, CV, hobbies, and contact form.

Theme support (🌙 Dark / ☀️ Light).

Multi-language support (TR / EN).

Responsive modern design.

Social media links (LinkedIn, Instagram, Spotify, GitHub, Tattoo Studio).

 Contact Form

Messages submitted through the form are stored in the backend.

Honeypot field included for bot/spam protection.

Users receive a status notification after submission.

 Admin Panel

JWT-based login (user created with Seed Admin).

Messages stored in Firebase Firestore can be listed.

View incoming messages via the dashboard.

Session management (logout, token expiration).

 Technologies Used

Frontend (Vercel)

HTML5, CSS3, Vanilla JS

FontAwesome icon set

i18n (multi-language support)

Backend (Render)

Node.js + Express

JWT Authentication

Firebase Admin SDK (Firestore)

Database

Firebase Firestore (NoSQL)

 Project Structure
personal-site/
│
├── backend/           # Express backend (hosted on Render)
│   ├── src/server.js  # API (auth + messages)
│   └── package.json
│
├── index.html         # Main website (Vercel)
├── admin.html         # Admin panel (Vercel)
├── styles.css         # Shared styles
├── app.js             # Main site scripts
└── admin.js           # Admin panel scripts

 Environment Variables

Backend (.env)

JWT_SECRET=your-secret-key
ALLOW_SEED=true
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json


Firebase Service Account

Firebase Console → Project settings → Service Accounts → Download JSON.

Add it to Render environment variables.

 Usage
Backend (Local Development)
cd backend
npm install
npm run dev

Frontend (Vercel automatically fetches)
vercel dev

Create Seed Admin
POST https://evencreed.onrender.com/api/auth/seed-admin
Body: { "email": "admin@mail.com", "password": "your-password" }

Login
POST https://evencreed.onrender.com/api/auth/login
Body: { "email": "admin@mail.com", "password": "your-password" }

 Deployment

Frontend: Vercel → auto-deploy index.html and admin.html.

Backend: Render → Node.js service (backend/src/server.js entrypoint).

Database: Firebase Firestore.

 Roadmap

 Personal site + contact form

 Admin panel (login + message listing)

 Social media links (minimal black/white)

 Blog page (coming soon)

 Advanced i18n support

 Author

Mert Topaçoğlu (Evencreed)
