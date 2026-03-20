import { useEffect, useMemo, useRef, useState } from "react";
import { apiUrl } from "../../lib/api";
import SweetCatalogView from "../../components/catalog/SweetCatalogView";
import type { CategoriaCatalogo } from "../../lib/catalog";
import {
  produtoMultiSabor,
  qtdDisponivelSabor,
  totalEstoqueProduto,
  type EstoquePorSaborMap,
} from "../../lib/saboresEstoque";

interface ProdutoEstoque {
  id: string;
  nome: string;
  categoria: CategoriaCatalogo;
  preco: string;
  precoValor?: number;
  quantidade: number;
  ativo: boolean;
  observacoes?: string;
  sabores?: string;
  imagemUrl?: string;
  estoquePorSabor?: EstoquePorSaborMap;
}

interface ItemCarrinho {
  productId: string;
  nome: string;
  categoria: CategoriaCatalogo;
  quantidade: number;
  /** Igual à linha cadastrada em "sabores" quando o produto tem vários sabores */
  sabor?: string;
  /** Somente para bolos: o cliente escolhe o peso */
  pesoKg?: number;
}

interface PedidoCriado {
  id: string;
  criadoEm: string;
  nomeCliente: string;
  telefone: string;
  observacoesGerais: string;
  itens: ItemCarrinho[];
  endereco?: string;
  tipoEntrega?: "entrega" | "retirada";
  taxaEntrega?: number;
  valorTotal?: number;
}

type AbaCliente = "cardapio" | "pedido";

export default function PedidoOnline() {
  const [aba, setAba] = useState<AbaCliente>("cardapio");
  const [nomeCliente, setNomeCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoesGerais, setObservacoesGerais] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<"entrega" | "retirada">(
    "retirada"
  );
  const [bairro, setBairro] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [pedidoCriado, setPedidoCriado] = useState<PedidoCriado | null>(null);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [erroCarregandoProdutos, setErroCarregandoProdutos] = useState<
    string | null
  >(null);
  const [logoTopoErro, setLogoTopoErro] = useState(false);
  const [feedbackCatalogo, setFeedbackCatalogo] = useState<string | null>(
    null
  );
  const feedbackCatalogoTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const mostrarFeedbackCatalogo = (texto: string) => {
    setFeedbackCatalogo(texto);
    if (feedbackCatalogoTimer.current) {
      clearTimeout(feedbackCatalogoTimer.current);
    }
    feedbackCatalogoTimer.current = setTimeout(() => {
      setFeedbackCatalogo(null);
      feedbackCatalogoTimer.current = null;
    }, 3200);
  };

  useEffect(() => {
    return () => {
      if (feedbackCatalogoTimer.current) {
        clearTimeout(feedbackCatalogoTimer.current);
      }
    };
  }, []);

  const WHATSAPP_DONA_FORMIGA = "5517991934616";
  const CHAVE_PIX = "07078804597";

  const formatarDataHora = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("pt-BR");
  };

  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        const resp = await fetch(apiUrl("/estoque"));
        if (!resp.ok) throw new Error("Falha ao carregar estoque");
        const data = (await resp.json()) as ProdutoEstoque[];
        /* Itens inativos somem; com estoque 0 continuam no cardápio como "indisponível" */
        setProdutos(data.filter((p) => p.ativo !== false));
      } catch (e) {
        console.error(e);
        setErroCarregandoProdutos(
          "Não foi possível carregar os produtos disponíveis. Tente novamente mais tarde."
        );
      }
    };
    carregarProdutos();
  }, []);

  const produtosParaCatalogo = useMemo(
    () =>
      produtos.map((p) => ({
        id: p.id,
        nome: p.nome,
        preco: p.preco,
        categoria: p.categoria,
        observacoes: p.observacoes,
        sabores: p.sabores,
        imagemUrl: p.imagemUrl,
        quantidade: totalEstoqueProduto({
          quantidade: p.quantidade,
          sabores: p.sabores,
          estoquePorSabor: p.estoquePorSabor,
        }),
        estoquePorSabor: p.estoquePorSabor,
        ativo: p.ativo,
      })),
    [produtos]
  );

  const itensNoCarrinho = useMemo(
    () => carrinho.reduce((acc, i) => acc + i.quantidade, 0),
    [carrinho]
  );

  function maxPermitidoNoCarrinho(
    produto: ProdutoEstoque,
    saborLinha?: string
  ): number {
    if (produtoMultiSabor(produto.sabores)) {
      const s = (saborLinha || "").trim();
      if (!s) return 0;
      return qtdDisponivelSabor(s, produto.estoquePorSabor);
    }
    return totalEstoqueProduto(produto);
  }

  const adicionarAoCarrinho = (
    produto: ProdutoEstoque,
    saborLinha?: string
  ) => {
    const multi = produtoMultiSabor(produto.sabores);
    const sabor = multi ? (saborLinha || "").trim() : undefined;
    if (multi && !sabor) return;
    const max = maxPermitidoNoCarrinho(produto, sabor);
    setCarrinho((atual) => {
      const existente = atual.find(
        (i) =>
          i.productId === produto.id && (i.sabor || "") === (sabor || "")
      );
      if (existente) {
        if (existente.quantidade >= max) return atual;
        return atual.map((i) =>
          i.productId === produto.id && (i.sabor || "") === (sabor || "")
            ? { ...i, quantidade: i.quantidade + 1 }
            : i
        );
      }
      if (max <= 0) return atual;
      return [
        ...atual,
        {
          productId: produto.id,
          nome: produto.nome,
          categoria: produto.categoria,
          quantidade: 1,
          ...(sabor ? { sabor } : {}),
        },
      ];
    });
  };

  const adicionarPorId = (
    id: string,
    saborLinha?: string,
    pesoKg?: number
  ) => {
    const produto = produtos.find((p) => p.id === id);
    if (!produto) {
      mostrarFeedbackCatalogo(
        "Não encontramos este produto. Atualize a página e tente de novo."
      );
      return;
    }

    const ehBolo = produto.categoria === "bolos";
    if (ehBolo) {
      const multi = produtoMultiSabor(produto.sabores);
      const sNorm = (saborLinha || "").trim();
      const peso = Number(pesoKg);
      if (!Number.isFinite(peso) || peso < 1.5) {
        mostrarFeedbackCatalogo("Escolha um peso a partir de 1,5 kg.");
        return;
      }
      if (multi && !sNorm) {
        mostrarFeedbackCatalogo(
          "Escolha o sabor do bolo tocando em + Pedido ao lado do sabor."
        );
        return;
      }

      setCarrinho((atual) => {
        const existente = atual.find(
          (i) => i.productId === id && (i.sabor || "") === (sNorm || "")
        );
        if (existente) {
          return atual.map((i) =>
            i.productId === id && (i.sabor || "") === (sNorm || "")
              ? { ...i, quantidade: 1, pesoKg: peso }
              : i
          );
        }
        return [
          ...atual,
          {
            productId: id,
            nome: produto.nome,
            categoria: produto.categoria,
            quantidade: 1,
            ...(sNorm ? { sabor: sNorm } : {}),
            pesoKg: peso,
          },
        ];
      });

      mostrarFeedbackCatalogo(
        sNorm
          ? `Adicionado: ${sNorm} · ${peso.toFixed(1)} kg`
          : `Adicionado ao pedido · ${peso.toFixed(1)} kg`
      );
      return;
    }

    const multi = produtoMultiSabor(produto.sabores);
    if (multi && !(saborLinha || "").trim()) {
      mostrarFeedbackCatalogo(
        "Escolha o sabor tocando em + Pedido ao lado do sabor."
      );
      return;
    }

    const max = maxPermitidoNoCarrinho(produto, saborLinha);
    if (max <= 0) {
      mostrarFeedbackCatalogo(
        "Este sabor está sem estoque. Escolha outro ou fale com a confeitaria."
      );
      return;
    }

    const sNorm = (saborLinha || "").trim();
    const noCarrinho = carrinho.find(
      (i) =>
        i.productId === id &&
        (multi ? (i.sabor || "") === sNorm : !i.sabor)
    );
    if (noCarrinho && noCarrinho.quantidade >= max) {
      mostrarFeedbackCatalogo(
        "Você já colocou a quantidade máxima disponível deste item."
      );
      return;
    }

    adicionarAoCarrinho(produto, saborLinha);
    mostrarFeedbackCatalogo(multi ? `Adicionado: ${sNorm}` : "Adicionado ao pedido!");
  };

  const alterarQuantidadeCarrinho = (
    productId: string,
    delta: number,
    sabor?: string
  ) => {
    const sKey = sabor || "";
    setCarrinho((atual) => {
      return atual
        .map((item) => {
          if (item.productId !== productId || (item.sabor || "") !== sKey) {
            return item;
          }
          if (item.pesoKg !== undefined) {
            // Para bolos, o peso define o item; o +1 não faz sentido e o -1 remove.
            if (delta < 0) return null;
            return item;
          }
          const produto = produtos.find((p) => p.id === productId);
          const max = produto
            ? maxPermitidoNoCarrinho(produto, item.sabor)
            : item.quantidade;
          const nova = item.quantidade + delta;
          if (nova <= 0) return null;
          if (nova > max) return { ...item, quantidade: max };
          return { ...item, quantidade: nova };
        })
        .filter((x): x is ItemCarrinho => x !== null);
    });
  };

  const handleEnviar = async (event: React.FormEvent) => {
    event.preventDefault();
    setMensagem(null);

    if (!nomeCliente.trim()) {
      setMensagem("Por favor, informe seu nome.");
      return;
    }

    if (tipoEntrega === "entrega") {
      const ruaTrim = rua.trim();
      const numeroTrim = numero.trim();
      const bairroTrim = bairro.trim();
      if (!ruaTrim || !numeroTrim || !bairroTrim) {
        setMensagem("Para entrega, informe rua, número e bairro.");
        return;
      }
    }

    const enderecoCompleto =
      tipoEntrega === "entrega"
        ? `${rua.trim()}, ${numero.trim()} - ${bairro.trim()}`
        : "";

    if (tipoEntrega === "retirada") {
      // Sem endereço para retirada
    }

    if (tipoEntrega === "entrega" && !enderecoCompleto.trim()) {
      setMensagem("Informe o endereço completo para entrega.");
      return;
    }

    if (carrinho.length === 0) {
      setMensagem("Adicione pelo menos 1 produto ao carrinho (aba Cardápio).");
      return;
    }

    try {
      setEnviando(true);
      const resp = await fetch(apiUrl("/pedidos"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nomeCliente,
          telefone,
          observacoesGerais,
          itens: carrinho,
          tipoEntrega,
          endereco: enderecoCompleto,
          origem: "formulario-cliente",
        }),
      });

      if (!resp.ok) {
        let detalhe = "";
        try {
          const errBody = await resp.json();
          if (errBody && typeof errBody.error === "string") {
            detalhe = ` (${errBody.error})`;
          }
        } catch {
          /* ignore */
        }
        throw new Error(`Falha ao enviar pedido (${resp.status})${detalhe}`);
      }

      const criado = (await resp.json()) as PedidoCriado;
      setPedidoCriado(criado);
      setMensagem(
        tipoEntrega === "entrega"
          ? "Obrigado pelo seu pedido! Já estamos preparando e pode levar alguns minutos."
          : "Pedido enviado com sucesso! Em instantes entraremos em contato pelo WhatsApp para confirmar a retirada."
      );
      setObservacoesGerais("");
      if (tipoEntrega === "retirada") {
        // Nada a limpar além do carrinho
      }
      setBairro("");
      setRua("");
      setNumero("");
      setCarrinho([]);
    } catch (e) {
      console.error(e);
      setMensagem(
        "Não foi possível enviar o pedido agora. Tente novamente em alguns minutos."
      );
    } finally {
      setEnviando(false);
    }
  };

  const copiarPix = async () => {
    try {
      await navigator.clipboard.writeText(CHAVE_PIX);
      setPixCopiado(true);
      window.setTimeout(() => setPixCopiado(false), 2500);
    } catch {
      const el = document.createElement("textarea");
      el.value = CHAVE_PIX;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setPixCopiado(true);
      window.setTimeout(() => setPixCopiado(false), 2500);
    }
  };

  const abrirWhatsappComPedido = () => {
    if (!pedidoCriado) return;
    const total =
      typeof pedidoCriado.valorTotal === "number"
        ? `R$ ${pedidoCriado.valorTotal.toFixed(2).replace(".", ",")}`
        : "";
    const itens = (pedidoCriado.itens || [])
      .map((i) => {
        const rotuloBase = i.sabor ? `${i.nome} (${i.sabor})` : i.nome;
        const pesoTxt =
          typeof i.pesoKg === "number" ? ` (${i.pesoKg} kg)` : "";
        const qtdTxt = typeof i.pesoKg === "number" ? "" : ` x${i.quantidade}`;
        return `- ${rotuloBase}${pesoTxt}${qtdTxt}`;
      })
      .join("\n");
    const texto =
      `Olá! Acabei de fazer um pedido na Donna Formiga.\n\n` +
      `Pedido: ${pedidoCriado.id}\n` +
      `Cliente: ${pedidoCriado.nomeCliente}\n` +
      (pedidoCriado.telefone ? `WhatsApp: ${pedidoCriado.telefone}\n` : "") +
      `Data/Hora: ${formatarDataHora(pedidoCriado.criadoEm)}\n` +
      (pedidoCriado.tipoEntrega ? `Forma: ${pedidoCriado.tipoEntrega}\n` : "") +
      (pedidoCriado.endereco ? `Endereço: ${pedidoCriado.endereco}\n` : "") +
      (total ? `Total: ${total}\n` : "") +
      `\nItens:\n${itens}\n\n` +
      `Agora, por favor, anexe aqui o comprovante do pagamento nesta conversa.`;

    const url = `https://wa.me/${WHATSAPP_DONA_FORMIGA}?text=${encodeURIComponent(
      texto
    )}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fef8f3] via-[#fffdf8] to-[#f5ebe3] flex items-center justify-center relative overflow-hidden font-sans">
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#f5ebe3] border-4 border-[#e8ddd4] shadow-inner overflow-hidden flex items-center justify-center mb-3">
            {!logoTopoErro ? (
              <img
                src="/favicon-dona-formiga.png.png"
                alt="Donna Formiga"
                className="w-full h-full object-cover"
                onError={() => setLogoTopoErro(true)}
              />
            ) : (
              <span className="font-serif text-2xl font-semibold text-[#8b5a47]">
                DF
              </span>
            )}
          </div>
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#b08d7a]">
            Donna Formiga
          </p>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[#5c3d33] mt-1">
            Faça seu pedido
          </h1>
          <p className="text-xs md:text-sm text-[#8b6f63] mt-2 text-center max-w-md leading-relaxed">
            Explore o cardápio com a mesma cara linda do painel e monte seu
            carrinho com um clique. Depois, finalize na aba{" "}
            <strong>Meu pedido</strong>.
          </p>
        </div>

        {!pedidoCriado && (
          <div className="flex gap-2 justify-center mb-6">
            <button
              type="button"
              onClick={() => setAba("cardapio")}
              className={`relative px-5 py-2.5 rounded-full text-xs font-semibold border transition-all ${
                aba === "cardapio"
                  ? "bg-[#8b5a47] text-white border-[#8b5a47] shadow-md"
                  : "bg-white/90 text-[#6b4f3d] border-[#e8ddd4] hover:bg-[#fffdf8]"
              }`}
            >
              Cardápio
              {itensNoCarrinho > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-[#c9a227] text-[#5c3d33] text-[10px] font-bold flex items-center justify-center">
                  {itensNoCarrinho}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setAba("pedido")}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold border transition-all ${
                aba === "pedido"
                  ? "bg-[#8b5a47] text-white border-[#8b5a47] shadow-md"
                  : "bg-white/90 text-[#6b4f3d] border-[#e8ddd4] hover:bg-[#fffdf8]"
              }`}
            >
              Meu pedido
            </button>
          </div>
        )}

        {pedidoCriado ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-[2rem] shadow-xl border border-[#e8ddd4] p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-700 font-black">✓</span>
              </div>
              <div>
                <p className="text-sm font-bold text-[#5c3d33]">
                  Pedido finalizado
                </p>
                {mensagem && (
                  <p className="text-xs text-[#8b6f63]">{mensagem}</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e8ddd4] bg-[#fffdf8] p-4">
              <p className="text-[11px] uppercase tracking-wide text-[#b08d7a] mb-2">
                Recibo virtual
              </p>
              <div className="space-y-1 text-xs text-[#5c3d33]">
                <p>
                  <span className="font-semibold">Pedido:</span>{" "}
                  <span className="font-mono">{pedidoCriado.id}</span>
                </p>
                <p>
                  <span className="font-semibold">Data/Hora:</span>{" "}
                  {formatarDataHora(pedidoCriado.criadoEm)}
                </p>
                <p>
                  <span className="font-semibold">Cliente:</span>{" "}
                  {pedidoCriado.nomeCliente}
                </p>
                {pedidoCriado.tipoEntrega && (
                  <p>
                    <span className="font-semibold">Forma:</span>{" "}
                    {pedidoCriado.tipoEntrega === "entrega"
                      ? "Entrega"
                      : "Retirada"}
                  </p>
                )}
                {pedidoCriado.endereco && (
                  <p>
                    <span className="font-semibold">Endereço:</span>{" "}
                    {pedidoCriado.endereco}
                  </p>
                )}
              </div>

              <div className="mt-3">
                <p className="text-[11px] font-semibold text-[#8b6f63] mb-1">
                  Itens
                </p>
                <ul className="text-xs text-[#5c3d33] space-y-1">
                  {pedidoCriado.itens.map((i, idx) => (
                    <li key={idx} className="flex justify-between gap-2">
                      <span className="truncate">
                        {i.nome}
                        {i.sabor ? (
                          <span className="text-[#b08d7a]"> · {i.sabor}</span>
                        ) : null}
                        {typeof i.pesoKg === "number" ? (
                          <span className="text-[#b08d7a]">
                            {" "}
                            · {i.pesoKg} kg
                          </span>
                        ) : null}
                      </span>
                      {typeof i.pesoKg === "number" ? null : (
                        <span className="font-semibold">x{i.quantidade}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {typeof pedidoCriado.valorTotal === "number" && (
                <p className="mt-3 text-sm font-extrabold text-[#5c3d33] flex items-center justify-between font-sans">
                  <span>Total</span>
                  <span>
                    R$ {pedidoCriado.valorTotal.toFixed(2).replace(".", ",")}
                  </span>
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <p className="text-[11px] uppercase tracking-wide text-emerald-700 mb-2">
                PIX para copiar
              </p>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-emerald-900 font-semibold truncate">
                    {CHAVE_PIX}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copiarPix}
                  className="shrink-0 px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Copiar
                </button>
              </div>
              {pixCopiado && (
                <p className="mt-2 text-xs text-emerald-700 font-semibold">
                  PIX copiado.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={abrirWhatsappComPedido}
              className="w-full px-6 py-3 rounded-full bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors"
            >
              Já paguei / Enviar comprovante no WhatsApp
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 rounded-full bg-[#f5ebe3] text-[#5c3d33] font-semibold hover:bg-[#e8ddd4] transition-colors"
            >
              Fazer outro pedido
            </button>
          </div>
        ) : aba === "cardapio" ? (
          <div className="space-y-4">
            {erroCarregandoProdutos ? (
              <p className="text-xs text-[#8b6f63] bg-[#fde8e8] border border-[#f5c4c4] rounded-2xl px-4 py-3 text-center">
                {erroCarregandoProdutos}
              </p>
            ) : produtos.length === 0 ? (
              <p className="text-xs text-[#8b6f63] bg-white/80 border border-[#e8ddd4] rounded-2xl px-4 py-6 text-center leading-relaxed">
                Não há itens <strong>ativos</strong> no cardápio. Se você é a
                confeitaria, cadastre produtos no painel e defina{" "}
                <strong>estoque</strong> maior que zero na aba Estoque para
                permitir pedidos.
              </p>
            ) : (
              <>
                {feedbackCatalogo && (
                  <p
                    className="text-xs font-medium text-center text-[#5c3d33] bg-[#e8f5e9] border border-[#c8e6c9] rounded-2xl px-4 py-2.5"
                    role="status"
                  >
                    {feedbackCatalogo}
                  </p>
                )}
                <SweetCatalogView
                  produtos={produtosParaCatalogo}
                  modo="cliente"
                  onAdicionar={(id, sabor, pesoKg) =>
                    adicionarPorId(id, sabor, pesoKg)
                  }
                  tituloMarca="Donna Formiga"
                />
              </>
            )}
            <p className="text-center text-[11px] text-[#b08d7a]">
              Depois de escolher, abra a aba <strong>Meu pedido</strong> para
              preencher seus dados e enviar.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleEnviar}
            className="bg-white/90 backdrop-blur-sm rounded-[2rem] shadow-xl border border-[#e8ddd4] p-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-[#8b6f63] mb-1">
                Forma
              </label>
              <div className="flex gap-3 text-xs">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    className="accent-[#8b5a47]"
                    checked={tipoEntrega === "retirada"}
                    onChange={() => setTipoEntrega("retirada")}
                  />
                  Retirada no local
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    className="accent-[#8b5a47]"
                    checked={tipoEntrega === "entrega"}
                    onChange={() => setTipoEntrega("entrega")}
                  />
                  Entrega (+ R$ 3,00)
                </label>
              </div>
            </div>

            {tipoEntrega === "entrega" && (
              <div>
                <label className="block text-xs font-semibold text-[#8b6f63] mb-1">
                  Endereço para entrega*
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-1">
                    <label className="block text-[11px] font-semibold text-[#8b6f63] mb-1">
                      Rua*
                    </label>
                    <input
                      type="text"
                      value={rua}
                      onChange={(e) => setRua(e.target.value)}
                      placeholder="Ex: Rua das Flores"
                      className="w-full px-4 py-3 rounded-2xl border border-[#e8ddd4] bg-[#fffdf8] text-[#5c3d33] placeholder:text-[#c4b5ad] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50 text-sm"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[11px] font-semibold text-[#8b6f63] mb-1">
                      Número*
                    </label>
                    <input
                      type="text"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      placeholder="Ex: 123"
                      className="w-full px-4 py-3 rounded-2xl border border-[#e8ddd4] bg-[#fffdf8] text-[#5c3d33] placeholder:text-[#c4b5ad] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-[#8b6f63] mb-1">
                      Bairro*
                    </label>
                    <input
                      type="text"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      placeholder="Ex: Centro"
                      className="w-full px-4 py-3 rounded-2xl border border-[#e8ddd4] bg-[#fffdf8] text-[#5c3d33] placeholder:text-[#c4b5ad] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#8b6f63] mb-1">
                Seu nome*
              </label>
              <input
                type="text"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                placeholder="Ex: Maria"
                className="w-full px-4 py-3 rounded-2xl border border-[#e8ddd4] bg-[#fffdf8] text-[#5c3d33] placeholder:text-[#c4b5ad] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8b6f63] mb-1">
                WhatsApp
              </label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(17) 9 XXXX-XXXX"
                className="w-full px-4 py-3 rounded-2xl border border-[#e8ddd4] bg-[#fffdf8] text-[#5c3d33] placeholder:text-[#c4b5ad] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8b6f63] mb-1">
                Carrinho
              </label>
              {carrinho.length === 0 ? (
                <div className="text-xs text-[#8b6f63] bg-[#fffdf8] border border-[#e8ddd4] rounded-2xl px-3 py-3 space-y-2">
                  <p>
                    Nenhum produto ainda. Volte na aba{" "}
                    <button
                      type="button"
                      className="font-semibold text-[#8b5a47] underline"
                      onClick={() => setAba("cardapio")}
                    >
                      Cardápio
                    </button>{" "}
                    e toque em <strong>Adicionar ao pedido</strong> ou{" "}
                    <strong>+ Pedido</strong> ao lado de cada sabor.
                  </p>
                </div>
              ) : (
                <div className="bg-[#fffdf8] border border-[#e8ddd4] rounded-2xl px-3 py-2 max-h-48 overflow-y-auto text-xs space-y-2">
                  {carrinho.map((item) => {
                    const p = produtos.find((x) => x.id === item.productId);
                    const isBoloItem = item.pesoKg !== undefined;
                    const max = isBoloItem
                      ? null
                      : p
                        ? maxPermitidoNoCarrinho(p, item.sabor)
                        : item.quantidade;
                    return (
                      <div
                        key={`${item.productId}::${item.sabor ?? ""}`}
                        className="flex items-center justify-between gap-2 border-b border-[#efe4dc] last:border-0 pb-2 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[#5c3d33] truncate">
                            {item.nome}
                            {item.sabor ? (
                              <span className="font-normal text-[#b08d7a]">
                                {" "}
                                · {item.sabor}
                              </span>
                            ) : null}
                          </p>
                          {isBoloItem ? (
                            <p className="text-[11px] text-[#b08d7a]">
                              Peso: {item.pesoKg} kg
                            </p>
                          ) : (
                            <p className="text-[11px] text-[#b08d7a]">
                              Qtd: {item.quantidade}
                              {max ? ` · máx. ${max}` : ""}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {isBoloItem ? (
                            <button
                              type="button"
                              onClick={() =>
                                alterarQuantidadeCarrinho(
                                  item.productId,
                                  -1,
                                  item.sabor
                                )
                              }
                              className="px-3 py-1 rounded-full bg-white text-[#6b4f3d] text-[11px] font-semibold border border-[#e8ddd4] hover:bg-[#f5ebe3]"
                            >
                              Remover
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  alterarQuantidadeCarrinho(
                                    item.productId,
                                    -1,
                                    item.sabor
                                  )
                                }
                                className="px-2 py-1 rounded-full bg-white text-[#6b4f3d] text-[11px] font-semibold border border-[#e8ddd4] hover:bg-[#f5ebe3]"
                              >
                                -1
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  alterarQuantidadeCarrinho(
                                    item.productId,
                                    1,
                                    item.sabor
                                  )
                                }
                                className="px-2 py-1 rounded-full bg-white text-[#6b4f3d] text-[11px] font-semibold border border-[#e8ddd4] hover:bg-[#f5ebe3]"
                              >
                                +1
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8b6f63] mb-1">
                Observações gerais
              </label>
              <textarea
                value={observacoesGerais}
                onChange={(e) => setObservacoesGerais(e.target.value)}
                placeholder="Ex: data da festa, horário de retirada, restrições (sem glúten, sem lactose)..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-[#e8ddd4] bg-[#fffdf8] text-[#5c3d33] placeholder:text-[#c4b5ad] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50 resize-none text-sm"
              />
            </div>

            {mensagem && (
              <p className="text-[11px] text-[#8b6f63] bg-[#fde8e8] border border-[#f5c4c4] rounded-2xl px-3 py-2">
                {mensagem}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#8b5a47] to-[#a06b55] text-white font-semibold shadow-lg hover:brightness-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {enviando ? "Enviando pedido..." : "Enviar pedido"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
