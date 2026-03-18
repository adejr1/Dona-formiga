const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 4000;

const DATA_DIR = path.join(__dirname, "data");
const PEDIDOS_FILE = path.join(DATA_DIR, "pedidos.json");
const ESTOQUE_FILE = path.join(DATA_DIR, "estoque.json");
const GASTOS_FILE = path.join(DATA_DIR, "gastos.json");

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

function lerEstoque() {
  try {
    if (!fs.existsSync(ESTOQUE_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(ESTOQUE_FILE, "utf-8");
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

function salvarEstoque(lista) {
  fs.writeFileSync(ESTOQUE_FILE, JSON.stringify(lista, null, 2), "utf-8");
}

function lerGastos() {
  try {
    if (!fs.existsSync(GASTOS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(GASTOS_FILE, "utf-8");
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

function salvarGastos(lista) {
  fs.writeFileSync(GASTOS_FILE, JSON.stringify(lista, null, 2), "utf-8");
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

// ESTOQUE
app.get("/estoque", (_req, res) => {
  const estoque = lerEstoque();
  res.json(estoque);
});

app.post("/estoque", (req, res) => {
  const estoque = lerEstoque();
  const precoTexto = req.body.preco || "";
  const precoNumero = Number(
    String(precoTexto)
      .replace("R$", "")
      .replace(/\./g, "")
      .replace(",", ".")
  );
  const novo = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nome: req.body.nome || "",
    categoria: req.body.categoria || "bolos",
    preco: precoTexto,
    precoValor: isNaN(precoNumero) ? 0 : precoNumero,
    quantidade: Number(req.body.quantidade || 0),
    ativo: req.body.ativo !== false,
  };
  estoque.push(novo);
  salvarEstoque(estoque);
  res.status(201).json(novo);
});

app.patch("/estoque/:id", (req, res) => {
  const estoque = lerEstoque();
  const { id } = req.params;
  const idx = estoque.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Produto não encontrado" });
  }
  const atual = estoque[idx];
  const precoTexto = req.body.preco ?? atual.preco;
  const precoNumero =
    precoTexto === atual.preco
      ? atual.precoValor || 0
      : Number(
          String(precoTexto)
            .replace("R$", "")
            .replace(/\./g, "")
            .replace(",", ".")
        );
  const atualizado = {
    ...atual,
    nome: req.body.nome ?? atual.nome,
    categoria: req.body.categoria ?? atual.categoria,
    preco: precoTexto,
    precoValor: isNaN(precoNumero) ? atual.precoValor || 0 : precoNumero,
    quantidade:
      req.body.quantidade !== undefined
        ? Number(req.body.quantidade)
        : atual.quantidade,
    ativo: req.body.ativo !== undefined ? req.body.ativo : atual.ativo,
  };
  estoque[idx] = atualizado;
  salvarEstoque(estoque);
  res.json(atualizado);
});

// GASTOS
app.get("/gastos", (_req, res) => {
  const gastos = lerGastos();
  res.json(gastos);
});

app.post("/gastos", (req, res) => {
  const gastos = lerGastos();
  const agora = new Date().toISOString();
  const novo = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    descricao: req.body.descricao || "",
    valor: Number(req.body.valor || 0),
    data: req.body.data || agora,
    categoria: req.body.categoria || "",
  };
  gastos.push(novo);
  salvarGastos(gastos);
  res.status(201).json(novo);
});

app.delete("/gastos/:id", (req, res) => {
  const gastos = lerGastos();
  const { id } = req.params;
  const filtrados = gastos.filter((g) => g.id !== id);
  salvarGastos(filtrados);
  res.status(204).end();
});

// EXCLUSÃO DE PEDIDOS
app.delete("/pedidos/:id", (req, res) => {
  const pedidos = lerPedidos();
  const { id } = req.params;
  const filtrados = pedidos.filter((p) => p.id !== id);
  salvarPedidos(filtrados);
  res.status(204).end();
});

app.get("/pedidos", (_req, res) => {
  const pedidos = lerPedidos();
  res.json(pedidos);
});

app.post("/pedidos", (req, res) => {
  const pedidos = lerPedidos();
  const estoque = lerEstoque();
  const agora = new Date().toISOString();
  let valorTotal = 0;
  const pedido = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    criadoEm: agora,
    nomeCliente: req.body.nomeCliente || "",
    telefone: req.body.telefone || "",
    observacoesGerais: req.body.observacoesGerais || "",
    itens: Array.isArray(req.body.itens) ? req.body.itens : [],
    endereco: req.body.endereco || "",
    tipoEntrega: req.body.tipoEntrega || "retirada",
    taxaEntrega: req.body.tipoEntrega === "entrega" ? 3 : 0,
    status: "novo",
    origem: req.body.origem || "online",
  };
  // abate estoque com base em itens que tenham productId
  if (Array.isArray(pedido.itens) && pedido.itens.length > 0) {
    let alterouEstoque = false;
    pedido.itens.forEach((item) => {
      if (!item.productId || !item.quantidade) return;
      const idx = estoque.findIndex((p) => p.id === item.productId);
      if (idx === -1) return;
      const atual = estoque[idx];
      const preco = Number(atual.precoValor || 0);
      const qtd = Number(item.quantidade || 0);
      valorTotal += preco * qtd;
      const novaQtd = Math.max(
        0,
        Number(atual.quantidade || 0) - Number(item.quantidade || 0)
      );
      estoque[idx] = { ...atual, quantidade: novaQtd };
      alterouEstoque = true;
    });
    if (alterouEstoque) {
      salvarEstoque(estoque);
    }
  }

  valorTotal += pedido.taxaEntrega || 0;

  const pedidoComValor = { ...pedido, valorTotal };

  pedidos.push(pedidoComValor);
  salvarPedidos(pedidos);
  res.status(201).json(pedidoComValor);
});

app.patch("/pedidos/:id/status", (req, res) => {
  const pedidos = lerPedidos();
  const { id } = req.params;
  const { status } = req.body;
  const idx = pedidos.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Pedido não encontrado" });
  }
  pedidos[idx].status = status || pedidos[idx].status || "novo";
  salvarPedidos(pedidos);
  res.json(pedidos[idx]);
});

app.listen(PORT, () => {
  console.log(`Servidor Dona Formiga rodando em http://localhost:${PORT}`);
});

