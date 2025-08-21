const { Router } = require("express");
const { z } = require("zod");

const msgSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(5)
});

module.exports = function messagesRouter(prisma) {
  const r = Router();

  // İletişim formundan kayıt
  r.post("/", async (req, res, next) => {
    try {
      const { name, email, message } = msgSchema.parse(req.body);
      const saved = await prisma.message.create({ data: { name, email, body: message } });
      res.json({ ok: true, id: saved.id });
    } catch (e) { next(e); }
  });

  // Admin görüntüleme (ileride auth ekleyebilirsin)
  r.get("/", async (req, res, next) => {
    try {
      const list = await prisma.message.findMany({ orderBy: { createdAt: "desc" } });
      res.json(list);
    } catch (e) { next(e); }
  });

  return r;
};