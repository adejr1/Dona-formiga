import { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";

type Categoria = "bolos" | "combos" | "doces";

interface ProdutoEstoque {
  id: string;
  nome: string;
  categoria: Categoria;
  preco: string;
  precoValor?: number;
  quantidade: number;
  ativo: boolean;
}

interface ItemCarrinho {
  productId: string;
  nome: string;
  categoria: Categoria;
  quantidade: number;
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

export default function PedidoOnline() {
  const [nomeCliente, setNomeCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoesGerais, setObservacoesGerais] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<"entrega" | "retirada">(
    "retirada"
  );
  const [endereco, setEndereco] = useState("");
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [pedidoCriado, setPedidoCriado] = useState<PedidoCriado | null>(null);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [erroCarregandoProdutos, setErroCarregandoProdutos] = useState<
    string | null
  >(null);

  const CHAVE_PIX = "07078804597";
  const WHATSAPP_DONA_FORMIGA = "5517991934616";

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
        setProdutos(
          data.filter((p) => p.ativo !== false && (p.quantidade || 0) > 0)
        );
      } catch (e) {
        console.error(e);
        setErroCarregandoProdutos(
          "Não foi possível carregar os produtos disponíveis. Tente novamente mais tarde."
        );
      }
    };
    carregarProdutos();
  }, []);

  const adicionarAoCarrinho = (produto: ProdutoEstoque) => {
    setCarrinho((atual) => {
      const existente = atual.find((i) => i.productId === produto.id);
      if (existente) {
        if (existente.quantidade >= produto.quantidade) return atual;
        return atual.map((i) =>
          i.productId === produto.id
            ? { ...i, quantidade: i.quantidade + 1 }
            : i
        );
      }
      if (produto.quantidade <= 0) return atual;
      return [
        ...atual,
        {
          productId: produto.id,
          nome: produto.nome,
          categoria: produto.categoria,
          quantidade: 1,
        },
      ];
    });
  };

  const alterarQuantidadeCarrinho = (productId: string, delta: number) => {
    setCarrinho((atual) => {
      return atual
        .map((item) => {
          if (item.productId !== productId) return item;
          const nova = item.quantidade + delta;
          if (nova <= 0) return null;
          return { ...item, quantidade: nova };
        })
        .filter((x): x is ItemCarrinho => x !== null);
    });
  };

  const handleEnviar = async (event: React.FormEvent) => {
    event.preventDefault();
    setMensagem(null);
    setPixCopiado(false);

    if (!nomeCliente.trim()) {
      setMensagem("Por favor, informe seu nome.");
      return;
    }

    if (tipoEntrega === "entrega" && !endereco.trim()) {
      setMensagem("Informe o endereço completo para entrega.");
      return;
    }

    if (carrinho.length === 0) {
      setMensagem("Adicione pelo menos 1 produto ao carrinho.");
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
          endereco,
          origem: "formulario-cliente",
        }),
      });

      if (!resp.ok) {
        throw new Error("Falha ao enviar pedido");
      }

      const criado = (await resp.json()) as PedidoCriado;
      setPedidoCriado(criado);
      setMensagem(
        tipoEntrega === "entrega"
          ? "Pedido enviado com sucesso! Pagamento via PIX abaixo. Assim que o pagamento for confirmado pelo WhatsApp, sua entrega será programada."
          : "Pedido enviado com sucesso! Pagamento via PIX abaixo. Assim que o pagamento for confirmado pelo WhatsApp, sua retirada poderá ser realizada."
      );
      setObservacoesGerais("");
      if (tipoEntrega === "retirada") {
        setEndereco("");
      }
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
      .map((i) => `- ${i.nome} x${i.quantidade}`)
      .join("\n");
    const texto =
      `Olá! Acabei de fazer o pagamento do meu pedido na Dona Formiga.\n\n` +
      `Pedido: ${pedidoCriado.id}\n` +
      `Cliente: ${pedidoCriado.nomeCliente}\n` +
      (pedidoCriado.telefone ? `WhatsApp: ${pedidoCriado.telefone}\n` : "") +
      `Data/Hora: ${formatarDataHora(pedidoCriado.criadoEm)}\n` +
      (pedidoCriado.tipoEntrega ? `Forma: ${pedidoCriado.tipoEntrega}\n` : "") +
      (pedidoCriado.endereco ? `Endereço: ${pedidoCriado.endereco}\n` : "") +
      (total ? `Total: ${total}\n` : "") +
      `\nItens:\n${itens}\n\n` +
      `Vou enviar o comprovante aqui.`;

    const url = `https://wa.me/${WHATSAPP_DONA_FORMIGA}?text=${encodeURIComponent(
      texto
    )}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 via-rose-50 to-white flex items-center justify-center relative overflow-hidden">
      {/* Removido fundo com imagem que nao existe em public/ no deploy. */}

      <div className="relative z-10 w-full max-w-xl mx-auto px-4 py-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-rose-200 shadow-inner overflow-hidden flex items-center justify-center mb-3">
            <span className="text-2xl font-extrabold text-rose-800">DF</span>
          </div>
          <p className="text-xs tracking-[0.3em] uppercase text-rose-500">
            Dona Formiga
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-rose-900 mt-1">
            Faça seu pedido
          </h1>
          <p className="text-xs md:text-sm text-rose-700 mt-2 text-center max-w-sm">
            Preencha seus dados e os itens que deseja. Vamos receber tudo aqui
            e te responder pelo WhatsApp.
          </p>
        </div>

        {pedidoCriado ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl shadow-rose-100 border border-rose-100 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-700 font-black">✓</span>
              </div>
              <div>
                <p className="text-sm font-bold text-rose-900">
                  Pedido finalizado
                </p>
                {mensagem && <p className="text-xs text-rose-700">{mensagem}</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
              <p className="text-[11px] uppercase tracking-wide text-rose-500 mb-2">
                Recibo virtual
              </p>
              <div className="space-y-1 text-xs text-rose-800">
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
                <p className="text-[11px] font-semibold text-rose-700 mb-1">
                  Itens
                </p>
                <ul className="text-xs text-rose-800 space-y-1">
                  {pedidoCriado.itens.map((i, idx) => (
                    <li key={idx} className="flex justify-between gap-2">
                      <span className="truncate">{i.nome}</span>
                      <span className="font-semibold">x{i.quantidade}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {typeof pedidoCriado.valorTotal === "number" && (
                <p className="mt-3 text-sm font-extrabold text-rose-900 flex items-center justify-between">
                  <span>Total</span>
                  <span>
                    R$ {pedidoCriado.valorTotal.toFixed(2).replace(".", ",")}
                  </span>
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <p className="text-[11px] uppercase tracking-wide text-emerald-700 mb-2">
                Pagamento via PIX
              </p>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-emerald-900 font-semibold">
                    Chave PIX
                  </p>
                  <p className="text-xs text-emerald-800 font-mono truncate">
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
                  Chave PIX copiada.
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
              className="w-full px-6 py-3 rounded-full bg-rose-100 text-rose-800 font-semibold hover:bg-rose-200 transition-colors"
            >
              Fazer outro pedido
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleEnviar}
            className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl shadow-rose-100 border border-rose-100 p-6 space-y-4"
          >
          <div>
            <label className="block text-xs font-semibold text-rose-700 mb-1">
              Forma
            </label>
            <div className="flex gap-3 text-xs">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  className="accent-rose-500"
                  checked={tipoEntrega === "retirada"}
                  onChange={() => setTipoEntrega("retirada")}
                />
                Retirada no local
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  className="accent-rose-500"
                  checked={tipoEntrega === "entrega"}
                  onChange={() => setTipoEntrega("entrega")}
                />
                Entrega (+ R$ 3,00)
              </label>
            </div>
          </div>

          {tipoEntrega === "entrega" && (
            <div>
              <label className="block text-xs font-semibold text-rose-700 mb-1">
                Endereço para entrega*
              </label>
              <textarea
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número, bairro, ponto de referência..."
                rows={2}
                className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-white text-rose-900 placeholder:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 resize-none text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-rose-700 mb-1">
              Seu nome*
            </label>
            <input
              type="text"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              placeholder="Ex: Maria"
              className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-white text-rose-900 placeholder:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-rose-700 mb-1">
              WhatsApp
            </label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(17) 9 XXXX-XXXX"
              className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-white text-rose-900 placeholder:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-rose-700 mb-1">
              Selecione os produtos*
            </label>
            {erroCarregandoProdutos ? (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-2xl px-3 py-2">
                {erroCarregandoProdutos}
              </p>
            ) : produtos.length === 0 ? (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-2xl px-3 py-2">
                No momento não há produtos disponíveis no cardápio.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {produtos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => adicionarAoCarrinho(p)}
                    className="text-left bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-2xl px-3 py-2 text-xs transition-colors"
                  >
                    <p className="font-semibold text-rose-900">{p.nome}</p>
                    <p className="text-[11px] text-rose-500">
                      {p.categoria === "bolos" && "Bolo"}
                      {p.categoria === "combos" && "Combo"}
                      {p.categoria === "doces" && "Doce"}
                    </p>
                    <p className="text-[11px] text-rose-700">{p.preco}</p>
                    <p className="text-[10px] text-rose-500">
                      Disponível: {p.quantidade}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-rose-700 mb-1">
              Carrinho
            </label>
            {carrinho.length === 0 ? (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-2xl px-3 py-2">
                Nenhum produto no carrinho ainda. Clique nos produtos acima para
                adicionar.
              </p>
            ) : (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl px-3 py-2 max-h-40 overflow-y-auto text-xs space-y-1">
                {carrinho.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-semibold text-rose-900">
                        {item.nome}
                      </p>
                      <p className="text-[11px] text-rose-500">
                        Quantidade: {item.quantidade}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          alterarQuantidadeCarrinho(item.productId, -1)
                        }
                        className="px-2 py-1 rounded-full bg-white text-rose-700 text-[11px] font-semibold border border-rose-200 hover:bg-rose-100"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          alterarQuantidadeCarrinho(item.productId, 1)
                        }
                        className="px-2 py-1 rounded-full bg-white text-rose-700 text-[11px] font-semibold border border-rose-200 hover:bg-rose-100"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-rose-700 mb-1">
              Observações gerais
            </label>
            <textarea
              value={observacoesGerais}
              onChange={(e) => setObservacoesGerais(e.target.value)}
              placeholder="Ex: data da festa, horário de retirada, restrições (sem glúten, sem lactose)..."
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-white text-rose-900 placeholder:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 resize-none text-sm"
            />
          </div>

          <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-100 rounded-2xl px-3 py-2">
            <p className="font-semibold mb-1">Pagamento via PIX</p>
            <p>
              Chave: <span className="font-mono font-bold">{CHAVE_PIX}</span>
            </p>
            <p className="mt-1">
              {tipoEntrega === "entrega"
                ? "Será cobrada taxa fixa de R$ 3,00 pela entrega."
                : "Para retirada, efetue o pagamento e aguarde a confirmação pelo WhatsApp antes de vir buscar."}
            </p>
          </div>

          {mensagem && (
            <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-100 rounded-2xl px-3 py-2">
              {mensagem}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 to-rose-400 text-white font-semibold shadow-lg shadow-rose-300 hover:shadow-rose-400/60 hover:brightness-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {enviando ? "Enviando pedido..." : "Enviar pedido"}
          </button>
          </form>
        )}
      </div>
    </div>
  );
}

