const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
// Em plataformas de hospedagem (Render/Railway/etc) a porta vem via variável de ambiente.
// Mantemos 4000 como fallback para desenvolvimento local.
const PORT = process.env.PORT || 4000;

// Permite usar um volume/pasta persistente na hospedagem.
// Se não definir DATA_DIR, usa a pasta local `server/data`.
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "data");
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

function linhasSaboresTexto(texto) {
  return String(texto || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function usaMultiSaborTexto(texto) {
  return linhasSaboresTexto(texto).length >= 2;
}

function somaMapEstoquePorSabor(map) {
  if (!map || typeof map !== "object" || Array.isArray(map)) return 0;
  return Object.values(map).reduce(
    (acc, v) => acc + Math.max(0, Number(v) || 0),
    0
  );
}

/** Alinha chaves do mapa às linhas atuais de sabores (2+ linhas) */
function normalizarEstoquePorSaborServidor(saboresTexto, mapaAnterior) {
  const lines = linhasSaboresTexto(saboresTexto);
  if (lines.length < 2) return {};
  const prev =
    mapaAnterior && typeof mapaAnterior === "object" && !Array.isArray(mapaAnterior)
      ? mapaAnterior
      : {};
  const out = {};
  for (const l of lines) {
    out[l] = Math.max(0, Number(prev[l]) || 0);
  }
  return out;
}

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json({ limit: "2mb" }));

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
  let precoTexto = String(req.body.preco || "").trim();
  // Garantia: o campo salvo para exibição no front sempre vem com "R$"
  if (precoTexto && !precoTexto.toLowerCase().includes("r$")) {
    precoTexto = `R$ ${precoTexto}`;
  }
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
    observacoes: req.body.observacoes || "",
    sabores: req.body.sabores || "",
    imagemUrl: req.body.imagemUrl || "",
    quantidade: Number(req.body.quantidade || 0),
    estoquePorSabor:
      req.body.estoquePorSabor &&
      typeof req.body.estoquePorSabor === "object" &&
      !Array.isArray(req.body.estoquePorSabor)
        ? req.body.estoquePorSabor
        : {},
    ativo: req.body.ativo !== false,
  };
  if (usaMultiSaborTexto(novo.sabores)) {
    novo.estoquePorSabor = normalizarEstoquePorSaborServidor(
      novo.sabores,
      novo.estoquePorSabor
    );
    novo.quantidade = somaMapEstoquePorSabor(novo.estoquePorSabor);
  } else {
    novo.estoquePorSabor = {};
  }
  estoque.push(novo);
  salvarEstoque(estoque);
  res.status(201).json(novo);
});

app.delete("/estoque/:id", (req, res) => {
  const estoque = lerEstoque();
  const { id } = req.params;
  const idx = estoque.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Produto não encontrado" });
  }
  estoque.splice(idx, 1);
  salvarEstoque(estoque);
  res.status(204).end();
});

app.patch("/estoque/:id", (req, res) => {
  const estoque = lerEstoque();
  const { id } = req.params;
  const idx = estoque.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Produto não encontrado" });
  }
  const atual = estoque[idx];
  let precoTexto = String(req.body.preco ?? atual.preco || "").trim();
  // Garantia: o campo salvo para exibição no front sempre vem com "R$"
  if (precoTexto && !precoTexto.toLowerCase().includes("r$")) {
    precoTexto = `R$ ${precoTexto}`;
  }
  const precoNumero = Number(
    String(precoTexto)
      .replace("R$", "")
      .replace(/\./g, "")
      .replace(",", ".")
  );
  const saboresNovo =
    req.body.sabores !== undefined ? req.body.sabores : atual.sabores;
  let estoquePorSaborAtual =
    atual.estoquePorSabor &&
    typeof atual.estoquePorSabor === "object" &&
    !Array.isArray(atual.estoquePorSabor)
      ? { ...atual.estoquePorSabor }
      : {};

  if (req.body.estoquePorSabor !== undefined) {
    const incoming = req.body.estoquePorSabor;
    if (typeof incoming === "object" && incoming !== null && !Array.isArray(incoming)) {
      const lines = linhasSaboresTexto(saboresNovo);
      if (lines.length >= 2) {
        const merged = {};
        for (const l of lines) {
          if (Object.prototype.hasOwnProperty.call(incoming, l)) {
            merged[l] = Math.max(0, Number(incoming[l]) || 0);
          } else {
            merged[l] = Math.max(0, Number(estoquePorSaborAtual[l]) || 0);
          }
        }
        estoquePorSaborAtual = merged;
      }
    }
  } else if (req.body.sabores !== undefined) {
    if (usaMultiSaborTexto(saboresNovo)) {
      estoquePorSaborAtual = normalizarEstoquePorSaborServidor(
        saboresNovo,
        atual.estoquePorSabor
      );
    } else {
      estoquePorSaborAtual = {};
    }
  }

  let quantidadeFinal =
    req.body.quantidade !== undefined
      ? Number(req.body.quantidade)
      : atual.quantidade;
  if (usaMultiSaborTexto(saboresNovo)) {
    estoquePorSaborAtual = normalizarEstoquePorSaborServidor(
      saboresNovo,
      estoquePorSaborAtual
    );
    quantidadeFinal = somaMapEstoquePorSabor(estoquePorSaborAtual);
  }

  const atualizado = {
    ...atual,
    nome: req.body.nome ?? atual.nome,
    categoria: req.body.categoria ?? atual.categoria,
    preco: precoTexto,
    precoValor: isNaN(precoNumero) ? atual.precoValor || 0 : precoNumero,
    observacoes: req.body.observacoes ?? atual.observacoes ?? "",
    sabores: saboresNovo ?? "",
    imagemUrl: req.body.imagemUrl ?? atual.imagemUrl ?? "",
    quantidade: quantidadeFinal,
    estoquePorSabor: usaMultiSaborTexto(saboresNovo)
      ? estoquePorSaborAtual
      : {},
    ativo: req.body.ativo !== undefined ? req.body.ativo : atual.ativo,
  };
  if (!usaMultiSaborTexto(saboresNovo)) {
    atualizado.estoquePorSabor = {};
  }
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
      if (!item || !item.productId) return;
      const qtd = Number(item.quantidade);
      if (!Number.isFinite(qtd) || qtd < 1) return;
      const idx = estoque.findIndex((p) => p.id === item.productId);
      if (idx === -1) return;
      const atual = estoque[idx];
      const preco = Number(atual.precoValor || 0);
      valorTotal += preco * qtd;
      // Para bolos, não abatemos estoque (o cliente não usa estoque na escolha)
      if (atual.categoria === "bolos") {
        return;
      }
      const linhas = linhasSaboresTexto(atual.sabores);
      if (linhas.length >= 2) {
        const saborPedido = item.sabor ? String(item.sabor).trim() : "";
        if (!saborPedido || !linhas.includes(saborPedido)) {
          return;
        }
        let map = normalizarEstoquePorSaborServidor(
          atual.sabores,
          atual.estoquePorSabor
        );
        const cur = Number(map[saborPedido] || 0);
        map[saborPedido] = Math.max(0, cur - qtd);
        estoque[idx] = {
          ...atual,
          estoquePorSabor: map,
          quantidade: somaMapEstoquePorSabor(map),
        };
      } else {
        const novaQtd = Math.max(0, Number(atual.quantidade || 0) - qtd);
        estoque[idx] = { ...atual, quantidade: novaQtd };
      }
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
  console.log(`Servidor Dona Formiga rodando em porta ${PORT}`);
});

