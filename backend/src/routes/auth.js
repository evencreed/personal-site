const { Router } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

module.exports = function authRouter(prisma) {
  const r = Router();

  // İlk kurulum için admin oluşturma
  r.post("/seed-admin", async (req, res, next) => {
    try {
      const { email, password } = schema.parse(req.body);
      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({ data: { email, password: hashed } });
      res.json({ id: user.id, email: user.email });
    } catch (e) { next(e); }
  });

  // Giriş
  r.post("/login", async (req, res, next) => {
    try {
      const { email, password } = schema.parse(req.body);
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(401).json({ error: "Kullanıcı yok" });
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ error: "Hatalı şifre" });
      const token = jwt.sign({ uid: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.json({ token });
    } catch (e) { next(e); }
  });

  return r;
};