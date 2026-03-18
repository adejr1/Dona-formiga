import { useEffect, useState } from "react";

interface PedidoItem {
  nome: string;
  categoria?: string;
  quantidade?: number;
  observacoes?: string;
}

interface Pedido {
  id: string;
  criadoEm: string;
  nomeCliente: string;
  telefone: string;
  observacoesGerais: string;
  itens: PedidoItem[];
  origem: string;
  endereco?: string;
  tipoEntrega?: "entrega" | "retirada";
  taxaEntrega?: number;
  status?: string;
  valorTotal?: number;
}

export default function HistoricoPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarPedidos = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const resp = await fetch("http://localhost:4000/pedidos");
      if (!resp.ok) throw new Error("Falha ao carregar pedidos");
      const data = (await resp.json()) as Pedido[];
      setPedidos(data.reverse());
    } catch (e: any) {
      setErro(
        "Não foi possível buscar o histórico. Verifique se o servidor está rodando (npm run server)."
      );
      console.error(e);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const concluidos = pedidos.filter((p) => p.status === "concluido");

  const excluirPedido = async (id: string) => {
    if (!window.confirm("Certeza que quer excluir este pedido?")) return;
    try {
      const resp = await fetch(`http://localhost:4000/pedidos/${id}`, {
        method: "DELETE",
      });
      if (!resp.ok && resp.status !== 204)
        throw new Error("Falha ao excluir pedido");
      await carregarPedidos();
    } catch (e) {
      console.error(e);
      alert("Não foi possível excluir o pedido.");
    }
  };

  return (
    <div className="h-full min-h-screen bg-gradient-to-b from-rose-100 via-rose-50 to-white relative overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12">
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-rose-500">
              Dona Formiga
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-rose-900">
              Histórico de pedidos
            </h1>
            <p className="text-sm text-rose-700 max-w-md">
              Aqui você encontra os pedidos que já foram entregues ou retirados.
            </p>
          </div>
          <button
            type="button"
            onClick={carregarPedidos}
            className="px-5 py-2.5 rounded-full bg-rose-500 text-white text-sm font-semibold shadow-md hover:bg-rose-600 transition-colors"
          >
            Atualizar histórico
          </button>
        </header>

        {erro && (
          <div className="mb-4 text-xs text-rose-800 bg-rose-100 border border-rose-300 rounded-2xl px-4 py-3">
            {erro}
          </div>
        )}

        {carregando ? (
          <p className="text-sm text-rose-700">Carregando histórico...</p>
        ) : concluidos.length === 0 ? (
          <p className="text-sm text-rose-700 bg-white/70 border border-dashed border-rose-200 rounded-3xl px-6 py-8 text-center">
            Ainda não há pedidos concluídos. Ao marcar um pedido como
            concluído, ele aparecerá aqui.
          </p>
        ) : (
          <div className="space-y-4">
            {concluidos.map((pedido) => (
              <article
                key={pedido.id}
                className="bg-white/85 backdrop-blur-sm rounded-3xl border border-rose-100 shadow-md p-4 md:p-5"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-rose-900">
                      {pedido.nomeCliente || "Cliente sem nome"}
                    </h2>
                    {pedido.telefone && (
                      <p className="text-xs text-rose-600">
                        WhatsApp: {pedido.telefone}
                      </p>
                    )}
                    {pedido.tipoEntrega && (
                      <p className="text-[11px] text-rose-500">
                        {pedido.tipoEntrega === "entrega"
                          ? "Entrega (taxa R$ 3,00)"
                          : "Retirada no local"}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-[11px] text-rose-500">
                    <p>
                      Recebido em{" "}
                      {new Date(pedido.criadoEm).toLocaleString("pt-BR")}
                    </p>
                    <p className="font-semibold text-rose-600">
                      Status: concluído
                    </p>
                  </div>
                </div>

                {pedido.endereco && (
                  <p className="text-xs text-rose-600 mb-2">
                    <span className="font-semibold">Endereço:</span>{" "}
                    {pedido.endereco}
                  </p>
                )}

                {pedido.itens && pedido.itens.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[11px] font-semibold text-rose-700 mb-1">
                      Itens do pedido
                    </p>
                    <ul className="text-xs text-rose-700 space-y-1">
                      {pedido.itens.map((item, idx) => (
                        <li key={idx} className="flex justify-between gap-2">
                          <span>
                            {item.nome}
                            {item.categoria && ` (${item.categoria})`}
                            {item.observacoes && ` - ${item.observacoes}`}
                          </span>
                          {item.quantidade && (
                            <span className="font-semibold">
                              x{item.quantidade}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {pedido.observacoesGerais && (
                  <p className="text-xs text-rose-600 whitespace-pre-line">
                    {pedido.observacoesGerais}
                  </p>
                )}

                {typeof pedido.valorTotal === "number" && (
                  <p className="mt-2 text-xs font-semibold text-rose-800">
                    Valor total do pedido:{" "}
                    <span className="font-bold">
                      R$ {pedido.valorTotal.toFixed(2).replace(".", ",")}
                    </span>
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => excluirPedido(pedido.id)}
                    className="px-3 py-1.5 rounded-full bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

