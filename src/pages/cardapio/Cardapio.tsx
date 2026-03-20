import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "../../lib/api";
import SweetCatalogView from "../../components/catalog/SweetCatalogView";
import {
  type CategoriaCatalogo,
  labelCategoriaAdmin,
} from "../../lib/catalog";
import {
  totalEstoqueProduto,
  type EstoquePorSaborMap,
} from "../../lib/saboresEstoque";

interface Produto {
  id: string;
  nome: string;
  preco: string;
  observacoes?: string;
  sabores?: string;
  categoria: CategoriaCatalogo;
  quantidade: number;
  ativo: boolean;
  imagemUrl?: string;
  estoquePorSabor?: EstoquePorSaborMap;
}

const MAX_IMAGEM_CHARS = 900_000;

export default function Cardapio() {
  const [itens, setItens] = useState<Produto[]>([]);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [sabores, setSabores] = useState("");
  const [categoria, setCategoria] = useState<CategoriaCatalogo>("bolos");
  const [abaFiltro, setAbaFiltro] = useState<"todos" | CategoriaCatalogo>(
    "todos"
  );
  const [imagemDataUrl, setImagemDataUrl] = useState<string | undefined>();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const resp = await fetch(apiUrl("/estoque"));
      if (!resp.ok) throw new Error("Falha ao carregar cardápio");
      const data = (await resp.json()) as Produto[];
      setItens(data);
    } catch (e) {
      console.error(e);
      setErro(
        "Não foi possível carregar o cardápio. Verifique se o servidor está rodando (npm run server)."
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleImagemChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImagemDataUrl(undefined);
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      setErro("Imagem muito grande. Use até ~2,5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      if (result.length > MAX_IMAGEM_CHARS) {
        setErro(
          "Imagem resulta em arquivo muito grande após conversão. Tente uma foto menor ou mais compacta."
        );
        setImagemDataUrl(undefined);
        return;
      }
      setImagemDataUrl(result);
      setErro(null);
    };
    reader.readAsDataURL(file);
  };

  const adicionarItem = async () => {
    if (!nome.trim()) return;
    try {
      setErro(null);
      const resp = await fetch(apiUrl("/estoque"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          preco: preco.trim(),
          observacoes: observacoes.trim(),
          sabores: sabores.trim(),
          categoria,
          quantidade: 20,
          ativo: true,
          imagemUrl: imagemDataUrl || "",
        }),
      });
      if (!resp.ok) throw new Error("Falha ao salvar item");
      setNome("");
      setPreco("");
      setObservacoes("");
      setSabores("");
      setImagemDataUrl(undefined);
      await carregar();
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar item do cardápio.");
    }
  };

  const atualizarProduto = async (
    id: string,
    patch: Partial<
      Pick<
        Produto,
        | "nome"
        | "preco"
        | "observacoes"
        | "sabores"
        | "categoria"
        | "ativo"
        | "imagemUrl"
      >
    >
  ) => {
    try {
      const resp = await fetch(apiUrl(`/estoque/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!resp.ok) throw new Error("Falha ao atualizar produto");
      await carregar();
    } catch (e) {
      console.error(e);
      setErro("Não foi possível atualizar o item.");
    }
  };

  const excluirProduto = async (id: string) => {
    if (!window.confirm("Certeza que quer excluir este item do cardápio?"))
      return;
    try {
      const resp = await fetch(apiUrl(`/estoque/${id}`), { method: "DELETE" });
      if (!resp.ok && resp.status !== 204)
        throw new Error("Falha ao excluir produto");
      await carregar();
    } catch (e) {
      console.error(e);
      setErro("Não foi possível excluir o item.");
    }
  };

  const visiveis = useMemo(() => {
    const lista =
      abaFiltro === "todos"
        ? itens
        : itens.filter((item) => item.categoria === abaFiltro);
    return [...lista].reverse();
  }, [abaFiltro, itens]);

  const previewCatalogo = useMemo(() => {
    return itens
      .filter((p) => p.ativo !== false)
      .map((p) => ({
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
      }));
  }, [itens]);

  const abas: { id: "todos" | CategoriaCatalogo; label: string }[] = [
    { id: "todos", label: "Tudo" },
    { id: "bolos", label: "Bolos recheados" },
    { id: "doces", label: "Docinhos" },
    { id: "combos", label: "Fatias" },
    { id: "bebidas", label: "Bebidas" },
  ];

  const categoriasCadastro: { id: CategoriaCatalogo; label: string }[] = [
    { id: "bolos", label: "Bolos → Nossos Bolos Recheados" },
    { id: "doces", label: "Doces → Docinhos Gourmet" },
    { id: "combos", label: "Fatias → Fatias Supremas" },
    { id: "bebidas", label: "Bebidas → Bebidas que Abraçam" },
  ];

  return (
    <div className="h-full min-h-screen bg-gradient-to-b from-[#fef8f3] via-[#fffdf8] to-[#f5ebe3] relative overflow-hidden font-sans">
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#b08d7a]">
              Painel · Cardápio
            </p>
            <h1 className="font-serif text-3xl md:text-4xl text-[#5c3d33] font-semibold mt-1">
              Donna Formiga
            </h1>
            <p className="text-sm text-[#8b6f63] max-w-lg mt-2">
              Cadastre produtos com foto e descrições deliciosas. O mesmo visual
              aparece na aba <strong>Cardápio</strong> da página do cliente.
              Quantidade continua na aba <strong>Estoque</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={carregar}
            className="px-5 py-2.5 rounded-full bg-[#8b5a47] text-white text-sm font-semibold shadow-md hover:bg-[#6b4538] transition-colors"
          >
            Atualizar
          </button>
        </header>

        {erro && (
          <div className="mb-4 text-xs text-[#5c3d33] bg-[#fde8e8] border border-[#f5c4c4] rounded-2xl px-4 py-3">
            {erro}
          </div>
        )}

        {/* Pré-visualização do cardápio Sweet & Clean (igual ao cliente) */}
        <section className="mb-12">
          <h2 className="font-serif text-xl text-[#5c3d33] mb-4 text-center">
            Pré-visualização (como o cliente vê)
          </h2>
          <SweetCatalogView
            produtos={previewCatalogo}
            modo="admin"
            tituloMarca="Donna Formiga"
          />
        </section>

        <div className="mb-6 flex flex-wrap gap-2">
          {abas.map((aba) => (
            <button
              key={aba.id}
              type="button"
              onClick={() => setAbaFiltro(aba.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                abaFiltro === aba.id
                  ? "bg-[#8b5a47] text-white border-[#8b5a47] shadow-md"
                  : "bg-white/90 text-[#6b4f3d] border-[#e8ddd4] hover:bg-[#fffdf8]"
              }`}
            >
              {aba.label}
            </button>
          ))}
        </div>

        <section className="mb-10 bg-white/90 backdrop-blur-sm rounded-[2rem] shadow-lg border border-[#e8ddd4] p-6 md:p-8">
          <h2 className="font-serif text-lg md:text-xl text-[#5c3d33] mb-4">
            Novo item do cardápio
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#8b6f63] mb-1">
                Nome do produto
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Bolo de brigadeiro belga"
                className="w-full px-4 py-3 rounded-2xl border border-[#e8ddd4] bg-[#fffdf8] text-[#5c3d33] placeholder:text-[#c4b5ad] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8b6f63] mb-1">
                Preço
              </label>
              <input
                type="text"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="Ex: R$ 59,90"
                className="w-full px-4 py-3 rounded-2xl border border-[#e8ddd4] bg-[#fffdf8] text-[#5c3d33] placeholder:text-[#c4b5ad] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 items-start">
            <div>
              <label className="block text-xs font-semibold text-[#8b6f63] mb-1">
                Descrição que dá água na boca
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: massa fofinha, recheio cremoso de chocolate belga e finalização com raspas douradas..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-[#e8ddd4] bg-[#fffdf8] text-[#5c3d33] placeholder:text-[#c4b5ad] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50 resize-none"
              />
              <div className="mt-4">
                <label className="block text-xs font-semibold text-[#8b6f63] mb-1">
                  Sabores / variações (um por linha)
                </label>
                <textarea
                  value={sabores}
                  onChange={(e) => setSabores(e.target.value)}
                  placeholder={"Ex:\nBrigadeiro\nNinho com morango"}
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl border border-[#e8ddd4] bg-[#fffdf8] text-[#5c3d33] placeholder:text-[#c4b5ad] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50 resize-none"
                />
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-[#8b6f63] mb-1">
                  Seção do cardápio
                </label>
                <div className="flex flex-wrap gap-2">
                  {categoriasCadastro.map((opcao) => (
                    <button
                      key={opcao.id}
                      type="button"
                      onClick={() => setCategoria(opcao.id)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                        categoria === opcao.id
                          ? "bg-[#c9a227]/25 text-[#5c3d33] border-[#c9a227]"
                          : "bg-white text-[#8b6f63] border-[#e8ddd4] hover:bg-[#fffdf8]"
                      }`}
                    >
                      {opcao.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#8b6f63] mb-1">
                Foto do produto (circular no cardápio)
              </label>
              <label className="group cursor-pointer flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#e8ddd4] hover:border-[#c9a227]/60 rounded-2xl px-4 py-6 bg-[#fffdf8] transition-colors">
                <span className="text-xs text-[#8b6f63] font-medium">
                  Clique para escolher JPG ou PNG
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImagemChange}
                />
              </label>
              {imagemDataUrl && (
                <div className="flex justify-center">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#f5ebe3] ring-2 ring-[#e8ddd4]">
                    <img
                      src={imagemDataUrl}
                      alt="Prévia"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={adicionarItem}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#8b5a47] to-[#a06b55] text-white font-semibold shadow-lg hover:brightness-105 transition-all"
            >
              Adicionar ao cardápio
            </button>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-lg md:text-xl text-[#5c3d33] mb-4">
            Itens cadastrados
          </h2>

          {carregando ? (
            <p className="text-sm text-[#8b6f63]">Carregando...</p>
          ) : itens.length === 0 ? (
            <p className="text-sm text-[#8b6f63] bg-white/70 border border-dashed border-[#e8ddd4] rounded-3xl px-6 py-8 text-center">
              Nenhum item ainda. Cadastre o primeiro acima.
            </p>
          ) : visiveis.length === 0 ? (
            <p className="text-sm text-[#8b6f63] bg-white/70 border border-dashed border-[#e8ddd4] rounded-3xl px-6 py-8 text-center">
              Nenhum item nesta seção.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {visiveis.map((item) => (
                <article
                  key={item.id}
                  className="bg-white/90 rounded-3xl border border-[#e8ddd4] shadow-sm overflow-hidden flex gap-3 p-4"
                >
                  <div className="shrink-0 w-20 h-20 rounded-full overflow-hidden border-4 border-[#f5ebe3] bg-[#fef8f3]">
                    {item.imagemUrl ? (
                      <img
                        src={item.imagemUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[#d4c4bc] text-center px-1">
                        sem foto
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-base font-semibold text-[#5c3d33]">
                      {item.nome}
                    </h3>
                    <p className="text-[10px] text-[#b08d7a] mt-0.5">
                      {labelCategoriaAdmin(item.categoria)}
                    </p>
                    <p className="font-sans text-sm font-medium text-[#8b5a47] mt-1">
                      {item.preco}
                    </p>
                    <p className="text-[10px] text-[#8b6f63] mt-1">
                      Estoque: {item.quantidade ?? 0} ·{" "}
                      {item.ativo ? "Ativo" : "Inativo"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <label className="text-[10px] text-[#c9a227] cursor-pointer underline">
                        Trocar foto
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const r = new FileReader();
                            r.onload = () => {
                              const s = String(r.result || "");
                              if (s.length > MAX_IMAGEM_CHARS) {
                                setErro("Foto muito grande para salvar.");
                                return;
                              }
                              atualizarProduto(item.id, { imagemUrl: s });
                            };
                            r.readAsDataURL(f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          atualizarProduto(item.id, { ativo: !item.ativo })
                        }
                        className="text-[10px] font-semibold text-[#8b5a47]"
                      >
                        {item.ativo ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => excluirProduto(item.id)}
                        className="text-[10px] font-semibold text-red-600"
                      >
                        Excluir
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
