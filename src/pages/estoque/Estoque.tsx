import { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";
import type { CategoriaCatalogo } from "../../lib/catalog";
import {
  linhasSabores,
  normalizarEstoquePorSabor,
  produtoMultiSabor,
  somaEstoquePorSabor,
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
  sabores?: string;
  estoquePorSabor?: EstoquePorSaborMap;
}

function BlocoEstoquePorSabor({
  produto,
  onSalvo,
}: {
  produto: ProdutoEstoque;
  onSalvo: () => void;
}) {
  const [map, setMap] = useState<EstoquePorSaborMap>(() =>
    normalizarEstoquePorSabor(produto.sabores, produto.estoquePorSabor)
  );
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setMap(
      normalizarEstoquePorSabor(produto.sabores, produto.estoquePorSabor)
    );
  }, [produto.id, produto.sabores, produto.estoquePorSabor]);

  const linhas = linhasSabores(produto.sabores);
  if (linhas.length < 2) return null;

  const ajustar = (nome: string, delta: number) => {
    setMap((m) => ({
      ...m,
      [nome]: Math.max(0, (Number(m[nome]) || 0) + delta),
    }));
  };

  const salvar = async () => {
    try {
      setSalvando(true);
      const resp = await fetch(apiUrl(`/estoque/${produto.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estoquePorSabor: map }),
      });
      if (!resp.ok) throw new Error("Falha ao salvar");
      await onSalvo();
    } catch (e) {
      console.error(e);
      alert("Não foi possível salvar o estoque por sabor.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="mt-3 space-y-2 border-t border-rose-200/80 pt-3">
      <p className="text-[10px] font-semibold text-rose-700 uppercase tracking-wide">
        Quantidade por sabor
      </p>
      <p className="text-[10px] text-rose-500 leading-snug">
        Cada linha do campo &quot;Sabores&quot; no Cardápio vira um sabor com
        estoque separado. Total no sistema:{" "}
        <strong>{somaEstoquePorSabor(map)}</strong>
      </p>
      <ul className="space-y-2">
        {linhas.map((nome) => (
          <li
            key={nome}
            className="flex flex-wrap items-center gap-2 text-[11px]"
          >
            <span className="flex-1 min-w-[6rem] text-rose-800 font-medium truncate">
              {nome}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => ajustar(nome, -1)}
                className="px-2 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-semibold hover:bg-rose-200"
              >
                −1
              </button>
              <span className="w-8 text-center font-semibold text-rose-900">
                {Number(map[nome]) || 0}
              </span>
              <button
                type="button"
                onClick={() => ajustar(nome, 1)}
                className="px-2 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-semibold hover:bg-rose-200"
              >
                +1
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        className="w-full mt-1 py-2 rounded-xl bg-rose-500 text-white text-[11px] font-semibold hover:bg-rose-600 disabled:opacity-50"
      >
        {salvando ? "Salvando..." : "Salvar estoque deste produto"}
      </button>
    </div>
  );
}

export default function Estoque() {
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const resp = await fetch(apiUrl("/estoque"));
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

  const atualizarQuantidade = async (id: string, novaQtd: number) => {
    try {
      const resp = await fetch(apiUrl(`/estoque/${id}`), {
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

  const atualizarAtivo = async (id: string, ativo: boolean) => {
    try {
      const resp = await fetch(apiUrl(`/estoque/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo }),
      });
      if (!resp.ok) throw new Error("Falha ao atualizar ativo");
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
              Donna Formiga
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-rose-900">
              Estoque de produtos
            </h1>
            <p className="text-sm text-rose-700 max-w-lg">
              Ajuste a <strong>quantidade</strong> e o status{" "}
              <strong>ativo</strong>. Se o produto tiver{" "}
              <strong>2 ou mais sabores</strong> (uma linha por sabor no
              Cardápio), aparece abaixo o controle{" "}
              <strong>por sabor</strong>.
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

        <section>
          <h2 className="text-lg md:text-xl font-semibold text-rose-900 mb-4">
            Produtos cadastrados
          </h2>

          {carregando ? (
            <p className="text-sm text-rose-700">Carregando...</p>
          ) : produtos.length === 0 ? (
            <p className="text-sm text-rose-700 bg-white/70 border border-dashed border-rose-200 rounded-3xl px-6 py-8 text-center">
              Nenhum produto cadastrado ainda. Cadastre na aba Cardápio.
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
                        {p.categoria === "combos" && "Fatia / combo"}
                        {p.categoria === "doces" && "Doce"}
                        {p.categoria === "bebidas" && "Bebida"}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-rose-700">
                      {p.preco}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-rose-600">
                      Status:{" "}
                      <span className="font-semibold">
                        {p.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => atualizarAtivo(p.id, !p.ativo)}
                      className="px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold hover:bg-rose-200"
                    >
                      {p.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </div>

                  {produtoMultiSabor(p.sabores) ? (
                    <p className="text-[11px] text-rose-600">
                      Total combinado:{" "}
                      <span className="font-semibold">
                        {somaEstoquePorSabor(
                          normalizarEstoquePorSabor(
                            p.sabores,
                            p.estoquePorSabor
                          )
                        )}
                      </span>
                    </p>
                  ) : (
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs text-rose-600">
                        Quantidade disponível:{" "}
                        <span className="font-semibold">{p.quantidade}</span>
                      </p>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            atualizarQuantidade(
                              p.id,
                              Math.max(0, p.quantidade - 1)
                            )
                          }
                          className="px-2 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold hover:bg-rose-200"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            atualizarQuantidade(p.id, p.quantidade + 1)
                          }
                          className="px-2 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold hover:bg-rose-200"
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  )}

                  {produtoMultiSabor(p.sabores) && (
                    <BlocoEstoquePorSabor produto={p} onSalvo={carregar} />
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
