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
}

export default function Pedidos() {
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
        "Não foi possível buscar os pedidos. Verifique se o servidor está rodando (npm run server)."
      );
      console.error(e);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  return (
    <div className="h-full min-h-screen bg-gradient-to-b from-rose-100 via-rose-50 to-white relative overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12">
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-rose-500">
              Dona Formiga
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-rose-900">
              Pedidos recebidos
            </h1>
            <p className="text-sm text-rose-700 max-w-md">
              Aqui aparecem os pedidos enviados pelo link do seu cardápio /
              formulário online.
            </p>
          </div>
          <button
            type="button"
            onClick={carregarPedidos}
            className="px-5 py-2.5 rounded-full bg-rose-500 text-white text-sm font-semibold shadow-md hover:bg-rose-600 transition-colors"
          >
            Atualizar pedidos
          </button>
        </header>

        {erro && (
          <div className="mb-4 text-xs text-rose-800 bg-rose-100 border border-rose-300 rounded-2xl px-4 py-3">
            {erro}
          </div>
        )}

        {carregando ? (
          <p className="text-sm text-rose-700">Carregando pedidos...</p>
        ) : pedidos.length === 0 ? (
          <p className="text-sm text-rose-700 bg-white/70 border border-dashed border-rose-200 rounded-3xl px-6 py-8 text-center">
            Ainda não há pedidos cadastrados. Quando os clientes enviarem pelo
            formulário, eles aparecerão aqui.
          </p>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
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
                  </div>
                  <p className="text-[11px] text-rose-500">
                    Recebido em{" "}
                    {new Date(pedido.criadoEm).toLocaleString("pt-BR")}
                  </p>
                </div>

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
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

