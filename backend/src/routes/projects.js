const { Router } = require("express");
const { z } = require("zod");
const { requireAuth } = require("../middleware/auth");


const projectSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  tags: z.array(z.string()).optional().default([]),
  link: z.string().url().optional()
});

function parseTags(str) {
  try { return JSON.parse(str || "[]"); } catch { return []; }
}

module.exports = function projectsRouter(prisma) {
  const r = Router();

  // LISTE
  r.get("/", async (req, res, next) => {
    try {
      const raw = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
      const list = raw.map(p => ({ ...p, tags: parseTags(p.tags) }));
      res.json(list);
    } catch (e) { next(e); }
  });

  // OLUSTUR (AUTH gerekli)
  r.post("/", requireAuth, async (req, res, next) => {
    try {
      const data = projectSchema.parse(req.body);
      const created = await prisma.project.create({
        data: {
          title: data.title,
          description: data.description,
          tags: JSON.stringify(data.tags || []), // <— String olarak kaydet
          link: data.link
        }
      });
      // Cevapta yine array döndürelim:
      res.json({ ...created, tags: data.tags || [] });
    } catch (e) { next(e); }
  });

  // SIL (AUTH gerekli)
  r.delete("/:id", requireAuth, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      await prisma.project.delete({ where: { id } });
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  return r;
};