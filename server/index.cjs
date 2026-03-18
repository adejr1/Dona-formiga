const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 4000;

const DATA_DIR = path.join(__dirname, "data");
const PEDIDOS_FILE = path.join(DATA_DIR, "pedidos.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function lerPedidos() {
  try {
    if (!fs.existsSync(PEDIDOS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(PEDIDOS_FILE, "utf-8");
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

function salvarPedidos(lista) {
  fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(lista, null, 2), "utf-8");
}

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

app.get("/ping", (_req, res) => {
  res.json({ ok: true });
});

app.get("/pedidos", (_req, res) => {
  const pedidos = lerPedidos();
  res.json(pedidos);
});

app.post("/pedidos", (req, res) => {
  const pedidos = lerPedidos();
  const agora = new Date().toISOString();
  const pedido = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    criadoEm: agora,
    nomeCliente: req.body.nomeCliente || "",
    telefone: req.body.telefone || "",
    observacoesGerais: req.body.observacoesGerais || "",
    itens: Array.isArray(req.body.itens) ? req.body.itens : [],
    origem: req.body.origem || "online",
  };
  pedidos.push(pedido);
  salvarPedidos(pedidos);
  res.status(201).json(pedido);
});

app.listen(PORT, () => {
  console.log(`Servidor Dona Formiga rodando em http://localhost:${PORT}`);
});

