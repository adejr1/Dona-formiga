import { useEffect, useState } from "react";

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

export default function Estoque() {
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("bolos");
  const [preco, setPreco] = useState("");
  const [quantidade, setQuantidade] = useState(0);

  const carregar = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const resp = await fetch("http://localhost:4000/estoque");
      if (!resp.ok) throw new Error("Falha ao carregar estoque");
      const data = (await resp.json()) as ProdutoEstoque[];
      setProdutos(data);
    } catch (e) {
      console.error(e);
      setErro(
        "Não foi possível carregar o estoque. Verifique se o servidor está rodando (npm run server)."
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const salvarProduto = async () => {
    if (!nome.trim()) return;
    try {
      const resp = await fetch("http://localhost:4000/estoque", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          categoria,
          preco,
          quantidade,
          ativo: true,
        }),
      });
      if (!resp.ok) throw new Error("Falha ao salvar produto");
      setNome("");
      setPreco("");
      setQuantidade(0);
      await carregar();
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar produto no estoque.");
    }
  };

  const atualizarQuantidade = async (id: string, novaQtd: number) => {
    try {
      const resp = await fetch(`http://localhost:4000/estoque/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantidade: novaQtd }),
      });
      if (!resp.ok) throw new Error("Falha ao atualizar quantidade");
      await carregar();
    } catch (e) {
      console.error(e);
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
              Estoque de produtos
            </h1>
            <p className="text-sm text-rose-700 max-w-md">
              Cadastre os produtos e quantidades disponíveis. Somente produtos
              ativos com quantidade maior que zero aparecerão para o cliente.
            </p>
          </div>
          <button
            type="button"
            onClick={carregar}
            className="px-5 py-2.5 rounded-full bg-rose-500 text-white text-sm font-semibold shadow-md hover:bg-rose-600 transition-colors"
          >
            Atualizar estoque
          </button>
        </header>

        {erro && (
          <div className="mb-4 text-xs text-rose-800 bg-rose-100 border border-rose-300 rounded-2xl px-4 py-3">
            {erro}
          </div>
        )}

        <section className="mb-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-rose-100 border border-rose-100 p-6 md:p-8">
          <h2 className="text-lg md:text-xl font-semibold text-rose-900 mb-4">
            Novo produto no estoque
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-rose-700 mb-1">
                Nome do produto
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Bolo de brigadeiro"
                className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-white text-rose-900 placeholder:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-rose-700 mb-1">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as Categoria)}
                className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-white text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 text-sm"
              >
                <option value="bolos">Bolos</option>
                <option value="combos">Combos</option>
                <option value="doces">Doces</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-rose-700 mb-1">
                Preço
              </label>
              <input
                type="text"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="Ex: R$ 59,90"
                className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-white text-rose-900 placeholder:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-rose-700 mb-1">
                Quantidade disponível
              </label>
              <input
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-white text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                min={0}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={salvarProduto}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 to-rose-400 text-white font-semibold shadow-lg shadow-rose-300 hover:shadow-rose-400/60 hover:brightness-105 transition-all text-sm"
            >
              Salvar produto
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-lg md:text-xl font-semibold text-rose-900 mb-4">
            Produtos cadastrados
          </h2>

          {carregando ? (
            <p className="text-sm text-rose-700">Carregando...</p>
          ) : produtos.length === 0 ? (
            <p className="text-sm text-rose-700 bg-white/70 border border-dashed border-rose-200 rounded-3xl px-6 py-8 text-center">
              Nenhum produto cadastrado ainda.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {produtos.map((p) => (
                <article
                  key={p.id}
                  className="bg-white/85 backdrop-blur-sm rounded-3xl border border-rose-100 shadow-md p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-rose-900">
                        {p.nome}
                      </h3>
                      <p className="text-[11px] text-rose-500">
                        {p.categoria === "bolos" && "Bolo"}
                        {p.categoria === "combos" && "Combo"}
                        {p.categoria === "doces" && "Doce"}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-rose-700">
                      {p.preco}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-xs text-rose-600">
                      Quantidade disponível:{" "}
                      <span className="font-semibold">{p.quantidade}</span>
                    </p>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          atualizarQuantidade(p.id, Math.max(0, p.quantidade - 1))
                        }
                        className="px-2 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold hover:bg-rose-200"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => atualizarQuantidade(p.id, p.quantidade + 1)}
                        className="px-2 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold hover:bg-rose-200"
                      >
                        +1
                      </button>
                    </div>
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

