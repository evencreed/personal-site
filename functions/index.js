const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

// Firebase Admin başlat
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());

// Sağlık kontrolü
app.get("/health", (req, res) => {
  res.json({ status: "ok", db: "firebase" });
});

// Mesaj ekleme
app.post("/messages", async (req, res) => {
  const { name, email, message } = req.body;
  const docRef = await db.collection("messages").add({
    name,
    email,
    message,
    createdAt: new Date(),
  });
  res.json({ id: docRef.id });
});

// Mesaj listeleme (JWT ile korumalı)
app.get("/messages", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET);

    const snapshot = await db.collection("messages").orderBy("createdAt", "desc").get();
    const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(rows);
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// Admin login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const snapshot = await db.collection("admins").where("email", "==", email).get();
  if (snapshot.empty) return res.status(401).json({ error: "Admin yok" });

  const adminDoc = snapshot.docs[0].data();
  if (adminDoc.password !== password) return res.status(401).json({ error: "Şifre yanlış" });

  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1d" });
  res.json({ token });
});

// Firebase Functions export
exports.api = functions.https.onRequest(app);
