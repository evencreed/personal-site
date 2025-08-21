const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

const app = express();
const prisma = new PrismaClient();

const authRouter = require("./routes/auth")(prisma);
const projectsRouter = require("./routes/projects")(prisma);
const messagesRouter = require("./routes/messages")(prisma);
const errorHandler = require("./middleware/errorHandler");

app.use(cors()); // geliştirmede tüm origin'lere izin; deploy’da kısıtlarsın
app.use(express.json());

// sağlık kontrolü
app.get("/api/health", (req, res) => res.json({ ok: true }));

// rotalar
app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/messages", messagesRouter);

// hata yakalayıcı
app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});