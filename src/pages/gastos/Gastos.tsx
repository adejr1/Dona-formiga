import { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";

interface Gasto {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria?: string;
}

export default function Gastos() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");

  const carregar = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const resp = await fetch(apiUrl("/gastos"));
      if (!resp.ok) throw new Error("Falha ao carregar gastos");
      const dataResp = (await resp.json()) as Gasto[];
      setGastos(dataResp.reverse());
    } catch (e) {
      console.error(e);
      setErro(
        "Não foi possível carregar os gastos. Verifique se o servidor está rodando (npm run server)."
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const salvarGasto = async () => {
    if (!descricao.trim()) return;
    const valorNumero = Number(
      valor.replace("R$", "").replace(".", "").replace(",", ".")
    );
    try {
      const resp = await fetch(apiUrl("/gastos"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao,
          valor: isNaN(valorNumero) ? 0 : valorNumero,
          data: data || new Date().toISOString(),
        }),
      });
      if (!resp.ok) throw new Error("Falha ao salvar gasto");
      setDescricao("");
      setValor("");
      setData("");
      await carregar();
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar gasto.");
    }
  };

  const excluirGasto = async (id: string) => {
    if (!window.confirm("Certeza que quer excluir este gasto?")) return;
    try {
      const resp = await fetch(apiUrl(`/gastos/${id}`), {
        method: "DELETE",
      });
      if (!resp.ok && resp.status !== 204)
        throw new Error("Falha ao excluir gasto");
      await carregar();
    } catch (e) {
      console.error(e);
      alert("Não foi possível excluir o gasto.");
    }
  };

  const somaMes = (() => {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    return gastos
      .filter((g) => new Date(g.data) >= inicioMes)
      .reduce((sum, g) => sum + (g.valor || 0), 0);
  })();

  return (
    <div className="h-full min-h-screen bg-gradient-to-b from-rose-100 via-rose-50 to-white relative overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8">
        <header className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-rose-500">
              Dona Formiga
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-rose-900">
              Gastos do negócio
            </h1>
            <p className="text-sm text-rose-700 max-w-md">
              Registre seus gastos fixos e variáveis para acompanhar o saldo
              junto com seus pedidos.
            </p>
          </div>
          <div className="bg-white/90 rounded-3xl border border-rose-100 shadow-md px-5 py-3 text-right">
            <p className="text-[11px] uppercase tracking-wide text-rose-400 mb-1">
              Gastos no mês
            </p>
            <p className="text-xl font-extrabold text-rose-900">
              R$ {somaMes.toFixed(2).replace(".", ",")}
            </p>
          </div>
        </header>

        {erro && (
          <div className="mb-2 text-xs text-rose-800 bg-rose-100 border border-rose-300 rounded-2xl px-4 py-3">
            {erro}
          </div>
        )}

        <section className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-xl shadow-rose-100 border border-rose-100 p-6 md:p-8">
          <h2 className="text-lg md:text-xl font-semibold text-rose-900 mb-4">
            Novo gasto
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-rose-700 mb-1">
                Descrição
              </label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Compra de ingredientes, gás, embalagem..."
                className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-white text-rose-900 placeholder:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-rose-700 mb-1">
                Valor
              </label>
              <input
                type="text"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ex: 25,00"
                className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-white text-rose-900 placeholder:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-rose-700 mb-1">
                Data
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-white text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 text-sm"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={salvarGasto}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 to-rose-400 text-white font-semibold shadow-lg shadow-rose-300 hover:shadow-rose-400/60 hover:brightness-105 transition-all text-sm"
            >
              Salvar gasto
            </button>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg md:text-xl font-semibold text-rose-900">
              Gastos cadastrados
            </h2>
            <button
              type="button"
              onClick={carregar}
              className="px-4 py-2 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold hover:bg-rose-200"
            >
              Atualizar
            </button>
          </div>

          {carregando ? (
            <p className="text-sm text-rose-700">Carregando...</p>
          ) : gastos.length === 0 ? (
            <p className="text-sm text-rose-700 bg-white/70 border border-dashed border-rose-200 rounded-3xl px-6 py-8 text-center">
              Nenhum gasto registrado ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {gastos.map((g) => (
                <article
                  key={g.id}
                  className="bg-white/85 backdrop-blur-sm rounded-2xl border border-rose-100 shadow-sm px-4 py-3 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-rose-900">
                      {g.descricao}
                    </p>
                    <p className="text-[11px] text-rose-500">
                      {new Date(g.data).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-rose-800">
                      R$ {g.valor.toFixed(2).replace(".", ",")}
                    </p>
                    <button
                      type="button"
                      onClick={() => excluirGasto(g.id)}
                      className="px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100"
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

