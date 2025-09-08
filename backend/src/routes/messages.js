const express = require("express");
const router = express.Router();
const db = require("../firebase");

// Mesaj ekle
router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const docRef = await db.collection("messages").add({
      name,
      email,
      message,
      createdAt: new Date()
    });
    res.json({ id: docRef.id });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving message");
  }
});

// Mesajları listele
router.get("/", async (req, res) => {
  try {
    const snapshot = await db
      .collection("messages")
      .orderBy("createdAt", "desc")
      .get();

    const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching messages");
  }
});

module.exports = router;
