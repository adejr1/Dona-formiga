import { SECOES_CATALOGO, type CategoriaCatalogo, normalizarCategoria } from "../../lib/catalog";
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
  ativo?: boolean;
}

type Modo = "cliente" | "admin";

interface Props {
  produtos: ProdutoSweet[];
  modo: Modo;
  onAdicionar?: (id: string) => void;
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
                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-[#f5ebe3] shadow-inner ring-2 ring-[#e8ddd4]/80 bg-[#fef8f3]">
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
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-serif text-lg md:text-xl text-[#5c3d33] font-semibold leading-tight">
                          {item.nome}
                        </h4>
                        <span className="font-sans text-sm font-medium text-[#9a7b6a] whitespace-nowrap">
                          {item.preco}
                        </span>
                      </div>
                      {item.observacoes && (
                        <p className="font-sans text-xs text-[#8b6f63] mt-2 leading-relaxed">
                          {item.observacoes}
                        </p>
                      )}
                      {item.sabores && (
                        <ul className="font-sans text-[11px] text-[#a08072] mt-2 space-y-0.5">
                          {String(item.sabores)
                            .split("\n")
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((s, i) => (
                              <li key={i}>• {s}</li>
                            ))}
                        </ul>
                      )}
                      {modo === "admin" && (
                        <p className="font-sans text-[10px] text-[#b08d7a] mt-2">
                          Estoque: {item.quantidade ?? 0} ·{" "}
                          {item.ativo !== false ? "Ativo" : "Inativo"}
                        </p>
                      )}
                      {modo === "cliente" && onAdicionar && (
                        <button
                          type="button"
                          onClick={() => onAdicionar(item.id)}
                          className="mt-3 self-start font-sans text-xs font-semibold px-4 py-2 rounded-full bg-[#c9a227]/20 text-[#6b4f3d] border border-[#c9a227]/40 hover:bg-[#c9a227]/30 transition-colors"
                        >
                          Adicionar ao pedido
                        </button>
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
