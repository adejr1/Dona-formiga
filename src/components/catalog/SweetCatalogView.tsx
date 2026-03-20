import { useState } from "react";
import { SECOES_CATALOGO, type CategoriaCatalogo, normalizarCategoria } from "../../lib/catalog";
import {
  linhasSabores,
  produtoMultiSabor,
  qtdDisponivelSabor,
  totalEstoqueProduto,
  type EstoquePorSaborMap,
} from "../../lib/saboresEstoque";
import { AntTrail, AntTiny } from "./AntDecor";

export interface ProdutoSweet {
  id: string;
  nome: string;
  preco: string;
  categoria?: string;
  observacoes?: string;
  sabores?: string;
  imagemUrl?: string;
  quantidade?: number;
  estoquePorSabor?: EstoquePorSaborMap;
  ativo?: boolean;
}

type Modo = "cliente" | "admin";

interface Props {
  produtos: ProdutoSweet[];
  modo: Modo;
  /** Cliente: (id, sabor?) — com vários sabores, informe a linha exata do sabor */
  onAdicionar?: (id: string, sabor?: string, pesoKg?: number) => void;
  tituloMarca?: string;
}

export default function SweetCatalogView({
  produtos,
  modo,
  onAdicionar,
  tituloMarca = "Donna Formiga",
}: Props) {
  const porSecao = (cat: CategoriaCatalogo) =>
    produtos.filter((p) => normalizarCategoria(p.categoria) === cat);

  const [pesoKgPorProduto, setPesoKgPorProduto] = useState<
    Record<string, number>
  >({});

  const getPesoKg = (id: string) => pesoKgPorProduto[id] ?? 1.5;

  const setPesoKg = (id: string, valor: number) => {
    setPesoKgPorProduto((prev) => ({ ...prev, [id]: valor }));
  };

  const formatarPreco = (preco?: string) => {
    const s = String(preco || "").trim();
    if (!s) return "";
    if (s.toLowerCase().includes("r$")) return s;
    return `R$ ${s}`;
  };

  return (
    <div className="rounded-[2rem] border border-[#e8ddd4] bg-gradient-to-b from-[#fffdf8] via-[#fef8f3] to-[#f5ebe3] shadow-[0_20px_60px_-15px_rgba(120,80,60,0.15)] overflow-hidden">
      {/* Cabeçalho editorial */}
      <header className="relative px-6 pt-10 pb-8 text-center border-b border-[#e8ddd4]/80 bg-[#fffdf8]/90">
        <div className="absolute left-4 top-4 opacity-30">
          <AntTiny className="w-10 h-7" />
        </div>
        <div className="absolute right-4 top-4 opacity-30">
          <AntTiny className="w-10 h-7 scale-x-[-1]" />
        </div>
        <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-[#b08d7a] mb-2">
          Confeitaria artesanal
        </p>
        <h2 className="font-serif text-3xl md:text-4xl text-[#5c3d33] font-semibold tracking-tight">
          {tituloMarca}
        </h2>
        <p className="font-sans text-sm text-[#8b6f63] max-w-md mx-auto mt-3 leading-relaxed">
          Doces feitos com mimo, para momentos que merecem um abraço doce.{" "}
          <span className="whitespace-nowrap">🐜</span> Nossas formiguinhas
          aprovam cada receita.
        </p>
        <div className="flex justify-center mt-5">
          <AntTrail />
        </div>
      </header>

      <div className="px-4 md:px-8 py-8 space-y-14">
        {SECOES_CATALOGO.map((secao) => {
          const lista = porSecao(secao.id);
          if (lista.length === 0) return null;

          return (
            <section key={secao.id} className="scroll-mt-4">
              <div className="text-center mb-8">
                <h3 className="font-serif text-2xl md:text-3xl text-[#5c3d33] font-semibold">
                  {secao.titulo}
                </h3>
                <div className="mx-auto mt-2 h-px w-24 bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />
                <p className="font-sans text-sm text-[#8b6f63] max-w-xl mx-auto mt-3 leading-relaxed">
                  {secao.subtitulo}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                {lista.map((item) => (
                  <article
                    key={item.id}
                    className="group flex gap-4 p-4 rounded-3xl bg-white/70 border border-[#efe4dc] shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="shrink-0">
                      <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-[#f5ebe3] shadow-inner ring-2 ring-[#e8ddd4]/80 bg-[#fef8f3]">
                        {item.imagemUrl ? (
                          <img
                            src={item.imagemUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#d4c4bc]">
                            <AntTiny className="w-12 h-8 opacity-50" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col">
                      {modo === "cliente" &&
                        normalizarCategoria(item.categoria) === "bolos" && (
                          <div className="mt-2">
                            <label className="block text-[10px] font-semibold text-[#8b6f63] mb-1">
                              Peso (kg) · a partir de 1,5
                            </label>
                            <input
                              type="number"
                              min={1.5}
                              step={0.1}
                              value={getPesoKg(item.id)}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                setPesoKg(
                                  item.id,
                                  Number.isFinite(v) && v > 0 ? v : 1.5
                                );
                              }}
                              className="w-full px-3 py-2 rounded-2xl border border-[#e8ddd4] bg-[#fffdf8] text-[#5c3d33] placeholder:text-[#c4b5ad] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50"
                            />
                          </div>
                        )}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-serif text-lg md:text-xl text-[#5c3d33] font-semibold leading-tight">
                          {item.nome}
                        </h4>
                        <span className="font-sans text-sm font-medium text-[#9a7b6a] whitespace-nowrap">
                          {formatarPreco(item.preco)}
                        </span>
                      </div>
                      {item.observacoes && (
                        <p className="font-sans text-xs text-[#8b6f63] mt-2 leading-relaxed">
                          {item.observacoes}
                        </p>
                      )}
                      {item.sabores && (
                        <ul className="font-sans text-[11px] text-[#a08072] mt-2 space-y-1">
                          {linhasSabores(item.sabores).map((s, i) => {
                            const ehBolo =
                              normalizarCategoria(item.categoria) === "bolos";
                            const qSabor = produtoMultiSabor(item.sabores)
                              ? qtdDisponivelSabor(s, item.estoquePorSabor)
                              : null;
                            return (
                              <li
                                key={i}
                                className="flex flex-wrap items-center gap-x-2 gap-y-1"
                              >
                                <span>• {s}</span>
                                {modo === "admin" &&
                                  produtoMultiSabor(item.sabores) && (
                                  <span className="text-[10px] text-[#b08d7a]">
                                    (estoque: {qSabor})
                                  </span>
                                )}
                                {modo === "cliente" &&
                                  onAdicionar &&
                                  produtoMultiSabor(item.sabores) &&
                                  (ehBolo ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onAdicionar(item.id, s, getPesoKg(item.id))
                                      }
                                      className="font-sans text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#c9a227]/20 text-[#6b4f3d] border border-[#c9a227]/40 hover:bg-[#c9a227]/30 transition-colors"
                                    >
                                      + Pedido
                                    </button>
                                  ) : qSabor !== null && qSabor > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => onAdicionar(item.id, s)}
                                      className="font-sans text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#c9a227]/20 text-[#6b4f3d] border border-[#c9a227]/40 hover:bg-[#c9a227]/30 transition-colors"
                                    >
                                      + Pedido
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-[#c4b5ad]">
                                      esgotado
                                    </span>
                                  ))}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      {modo === "admin" && (
                        <p className="font-sans text-[10px] text-[#b08d7a] mt-2">
                          Estoque total:{" "}
                          {totalEstoqueProduto({
                            quantidade: item.quantidade,
                            sabores: item.sabores,
                            estoquePorSabor: item.estoquePorSabor,
                          })}{" "}
                          · {item.ativo !== false ? "Ativo" : "Inativo"}
                          {produtoMultiSabor(item.sabores) && (
                            <span className="block mt-0.5 text-[#c9a227]">
                              Sabores com estoque separado — ajuste na aba Estoque.
                            </span>
                          )}
                        </p>
                      )}
                      {modo === "cliente" &&
                        onAdicionar &&
                        !produtoMultiSabor(item.sabores) && (
                          normalizarCategoria(item.categoria) === "bolos" ? (
                            <button
                              type="button"
                              onClick={() =>
                                onAdicionar(item.id, undefined, getPesoKg(item.id))
                              }
                              className="mt-3 self-start font-sans text-xs font-semibold px-4 py-2 rounded-full bg-[#c9a227]/20 text-[#6b4f3d] border border-[#c9a227]/40 hover:bg-[#c9a227]/30 transition-colors"
                            >
                              Adicionar ao pedido
                            </button>
                          ) : totalEstoqueProduto({
                              quantidade: item.quantidade,
                              sabores: item.sabores,
                              estoquePorSabor: item.estoquePorSabor,
                            }) > 0 ? (
                            <button
                              type="button"
                              onClick={() => onAdicionar(item.id)}
                              className="mt-3 self-start font-sans text-xs font-semibold px-4 py-2 rounded-full bg-[#c9a227]/20 text-[#6b4f3d] border border-[#c9a227]/40 hover:bg-[#c9a227]/30 transition-colors"
                            >
                              Adicionar ao pedido
                            </button>
                          ) : (
                            <p className="mt-3 font-sans text-[11px] font-medium text-[#b08d7a] italic">
                              Indisponível no momento (sem estoque)
                            </p>
                          )
                        )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="px-6 py-6 border-t border-[#e8ddd4] bg-[#fffdf8]/80 text-center">
        <AntTiny className="w-8 h-5 mx-auto opacity-40" />
        <p className="font-serif text-sm text-[#8b6f63] mt-2">
          Com carinho, <span className="text-[#5c3d33] font-medium">{tituloMarca}</span>
        </p>
      </footer>
    </div>
  );
}
