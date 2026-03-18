import { useState } from "react";

type Categoria = "bolos" | "combos" | "doces";

interface ItemCardapio {
  id: string;
  nome: string;
  preco: string;
  observacoes: string;
  sabores: string;
  categoria: Categoria;
  imagemUrl?: string;
}

export default function Cardapio() {
  const [itens, setItens] = useState<ItemCardapio[]>([]);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [sabores, setSabores] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("bolos");
  const [abaFiltro, setAbaFiltro] = useState<"todos" | Categoria>("todos");
  const [imagemPreview, setImagemPreview] = useState<string | undefined>();

  const adicionarItem = () => {
    if (!nome.trim()) return;

    const novoItem: ItemCardapio = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      preco: preco.trim(),
      observacoes: observacoes.trim(),
      sabores: sabores.trim(),
      categoria,
      imagemUrl: imagemPreview,
    };

    setItens((atual) => [novoItem, ...atual]);
    setNome("");
    setPreco("");
    setObservacoes("");
    setSabores("");
    setImagemPreview(undefined);
  };

  const handleImagemChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImagemPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setImagemPreview(url);
  };

  return (
    <div className="h-full min-h-screen bg-gradient-to-b from-rose-100 via-rose-50 to-white relative overflow-hidden">
      {/* Fundo com a mascote */}
      <div
        className="pointer-events-none select-none absolute inset-0 opacity-10 mix-blend-multiply bg-center bg-contain bg-no-repeat"
        style={{
          backgroundImage:
            "url('/assets/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_9b7e95b05d0020946e7c3e29a217bff1_images_WhatsApp_Image_2025-10-08_at_10.18.44-fotor-20251028104826-b5cb606d-134e-4ea8-8363-020ff666ac19.png')",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Cabeçalho */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-rose-200 shadow-inner overflow-hidden flex items-center justify-center">
              <img
                src="/assets/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_9b7e95b05d0020946e7c3e29a217bff1_images_WhatsApp_Image_2025-10-08_at_10.18.44-fotor-20251028104826-b5cb606d-134e-4ea8-8363-020ff666ac19.png"
                alt="Dona Formiga"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-rose-500">
                Dona Formiga
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-rose-900 drop-shadow-sm">
                Cardápio
              </h1>
              <p className="text-sm text-rose-700 max-w-md">
                Organize seus doces, bolos e encomendas em um layout delicado,
                com a carinha da Dona Formiga.
              </p>
            </div>
          </div>
        </header>

        {/* Abas de filtro: catálogo geral / categorias */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { id: "todos" as const, label: "Catálogo completo" },
            { id: "bolos" as const, label: "Bolos" },
            { id: "combos" as const, label: "Combos" },
            { id: "doces" as const, label: "Doces" },
          ].map((aba) => (
            <button
              key={aba.id}
              type="button"
              onClick={() => setAbaFiltro(aba.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                abaFiltro === aba.id
                  ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-300"
                  : "bg-white/80 text-rose-700 border-rose-200 hover:bg-rose-50"
              }`}
            >
              {aba.label}
            </button>
          ))}
        </div>

        {/* Formulário de cadastro */}
        <section className="mb-10 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-rose-100 border border-rose-100 p-6 md:p-8">
          <h2 className="text-lg md:text-xl font-semibold text-rose-900 mb-4">
            Novo item do cardápio
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-rose-700 mb-1">
                Nome do produto
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Bolo de brigadeiro"
                className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-white/80 text-rose-900 placeholder:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
              />
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
                className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-white/80 text-rose-900 placeholder:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 items-start">
            <div>
              <label className="block text-xs font-semibold text-rose-700 mb-1">
                Observações do produto
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: opção sem lactose, informar sabor do recheio, tamanho da forma..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-white/80 text-rose-900 placeholder:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 resize-none"
              />
              <div className="mt-4">
                <label className="block text-xs font-semibold text-rose-700 mb-1">
                  Sabores (um por linha)
                </label>
                <textarea
                  value={sabores}
                  onChange={(e) => setSabores(e.target.value)}
                  placeholder={"Ex:\nBrigadeiro\nNinho com morango\nDoce de leite"}
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-white/80 text-rose-900 placeholder:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 resize-none"
                />
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-rose-700 mb-1">
                  Categoria
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "bolos" as Categoria, label: "Bolo" },
                    { id: "combos" as Categoria, label: "Combos" },
                    { id: "doces" as Categoria, label: "Doces" },
                  ].map((opcao) => (
                    <button
                      key={opcao.id}
                      type="button"
                      onClick={() => setCategoria(opcao.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        categoria === opcao.id
                          ? "bg-rose-500 text-white border-rose-500"
                          : "bg-white/80 text-rose-700 border-rose-200 hover:bg-rose-50"
                      }`}
                    >
                      {opcao.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-rose-500">
                  Essa categoria define em qual aba (Bolo, Combos ou Doces) o
                  item aparecerá.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-rose-700 mb-1">
                Imagem do produto
              </label>
              <label className="group cursor-pointer flex flex-col items-center justify-center gap-2 border-2 border-dashed border-rose-200 hover:border-rose-400 rounded-2xl px-4 py-4 bg-white/70 transition-colors">
                <span className="text-xs text-rose-600 font-medium group-hover:text-rose-700">
                  Clique para escolher uma foto
                </span>
                <span className="text-[10px] text-rose-400">
                  JPG ou PNG, apenas para visualização
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImagemChange}
                />
              </label>
              {imagemPreview && (
                <div className="mt-2">
                  <p className="text-[10px] uppercase tracking-wide text-rose-500 mb-1">
                    Pré-visualização
                  </p>
                  <div className="aspect-video rounded-2xl overflow-hidden border border-rose-100 shadow-sm">
                    <img
                      src={imagemPreview}
                      alt="Pré-visualização"
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
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 to-rose-400 text-white font-semibold shadow-lg shadow-rose-300 hover:shadow-rose-400/60 hover:brightness-105 transition-all"
            >
              Adicionar ao cardápio
            </button>
          </div>
        </section>

        {/* Lista de itens */}
        <section>
          <h2 className="text-lg md:text-xl font-semibold text-rose-900 mb-4">
            {abaFiltro === "todos" && "Catálogo completo"}
            {abaFiltro === "bolos" && "Bolos do cardápio"}
            {abaFiltro === "combos" && "Combos do cardápio"}
            {abaFiltro === "doces" && "Doces do cardápio"}
          </h2>

          {itens.length === 0 ? (
            <p className="text-sm text-rose-600 bg-white/70 border border-dashed border-rose-200 rounded-3xl px-6 py-8 text-center">
              Nenhum item cadastrado ainda. Comece adicionando o primeiro doce
              acima.
            </p>
          ) : (
            (() => {
              const visiveis =
                abaFiltro === "todos"
                  ? itens
                  : itens.filter((item) => item.categoria === abaFiltro);

              if (visiveis.length === 0) {
                return (
                  <p className="text-sm text-rose-600 bg-white/70 border border-dashed border-rose-200 rounded-3xl px-6 py-8 text-center">
                    Ainda não há itens nessa categoria. Cadastre um novo item e
                    escolha a categoria correspondente.
                  </p>
                );
              }

              return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visiveis.map((item) => (
                <article
                  key={item.id}
                  className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-rose-100 border border-rose-100 overflow-hidden flex flex-col"
                >
                  {item.imagemUrl && (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={item.imagemUrl}
                        alt={item.nome}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base md:text-lg font-semibold text-rose-900">
                        {item.nome}
                      </h3>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-rose-100 text-rose-700 font-semibold uppercase tracking-wide">
                        {item.categoria === "bolos" && "Bolo"}
                        {item.categoria === "combos" && "Combo"}
                        {item.categoria === "doces" && "Doce"}
                      </span>
                    </div>
                    {item.preco && (
                      <p className="text-sm font-bold text-rose-700 mt-1">
                        {item.preco}
                      </p>
                    )}
                    {item.sabores && (
                      <div className="mt-3">
                        <p className="text-[11px] font-semibold text-rose-700 mb-1">
                          Sabores:
                        </p>
                        <ul className="text-xs text-rose-600 space-y-0.5">
                          {item.sabores
                            .split("\n")
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((sabor, index) => (
                              <li key={index}>• {sabor}</li>
                            ))}
                        </ul>
                      </div>
                    )}
                    {item.observacoes && (
                      <p className="text-xs text-rose-600 mt-3 whitespace-pre-line">
                        {item.observacoes}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
              );
            })()
          )}
        </section>
      </div>
    </div>
  );
}

