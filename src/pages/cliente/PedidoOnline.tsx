import { useState } from "react";

interface ItemFormulario {
  nome: string;
  quantidade: number;
  observacoes: string;
}

export default function PedidoOnline() {
  const [nomeCliente, setNomeCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoesGerais, setObservacoesGerais] = useState("");
  const [itensTexto, setItensTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const parseItens = (): ItemFormulario[] => {
    return itensTexto
      .split("\n")
      .map((linha) => linha.trim())
      .filter(Boolean)
      .map((linha) => {
        // Formato sugerido: "2x Bolo de brigadeiro - sem lactose"
        const quantidadeMatch = linha.match(/^(\d+)[xX]\s*(.*)$/);
        let quantidade = 1;
        let resto = linha;
        if (quantidadeMatch) {
          quantidade = Number(quantidadeMatch[1]) || 1;
          resto = quantidadeMatch[2];
        }
        const [nome, obs] = resto.split(" - ");
        return {
          nome: nome.trim(),
          quantidade,
          observacoes: obs ? obs.trim() : "",
        };
      });
  };

  const handleEnviar = async (event: React.FormEvent) => {
    event.preventDefault();
    setMensagem(null);

    if (!nomeCliente.trim()) {
      setMensagem("Por favor, informe seu nome.");
      return;
    }

    const itens = parseItens();
    if (itens.length === 0) {
      setMensagem("Adicione pelo menos 1 item ao pedido.");
      return;
    }

    try {
      setEnviando(true);
      const resp = await fetch("http://localhost:4000/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nomeCliente,
          telefone,
          observacoesGerais,
          itens,
          origem: "formulario-cliente",
        }),
      });

      if (!resp.ok) {
        throw new Error("Falha ao enviar pedido");
      }

      setMensagem(
        "Pedido enviado com sucesso! A Dona Formiga vai entrar em contato pelo WhatsApp para confirmar."
      );
      setItensTexto("");
      setObservacoesGerais("");
    } catch (e) {
      console.error(e);
      setMensagem(
        "Não foi possível enviar o pedido agora. Tente novamente em alguns minutos."
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 via-rose-50 to-white flex items-center justify-center relative overflow-hidden">
      <div
        className="pointer-events-none select-none absolute inset-0 opacity-10 mix-blend-multiply bg-center bg-contain bg-no-repeat"
        style={{
          backgroundImage:
            "url('/assets/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_9b7e95b05d0020946e7c3e29a217bff1_images_WhatsApp_Image_2025-10-08_at_10.18.44-fotor-20251028104826-b5cb606d-134e-4ea8-8363-020ff666ac19.png')",
        }}
      />

      <div className="relative z-10 w-full max-w-xl mx-auto px-4 py-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-rose-200 shadow-inner overflow-hidden flex items-center justify-center mb-3">
            <img
              src="/assets/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_9b7e95b05d0020946e7c3e29a217bff1_images_WhatsApp_Image_2025-10-08_at_10.18.44-fotor-20251028104826-b5cb606d-134e-4ea8-8363-020ff666ac19.png"
              alt="Dona Formiga"
              className="w-full h-full object-cover"
            />
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

        <form
          onSubmit={handleEnviar}
          className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl shadow-rose-100 border border-rose-100 p-6 space-y-4"
        >
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
              Itens do pedido*
            </label>
            <textarea
              value={itensTexto}
              onChange={(e) => setItensTexto(e.target.value)}
              placeholder={
                "Exemplos:\n2x Bolo de brigadeiro - sem lactose\n1x Combo festa - 50 docinhos sortidos"
              }
              rows={5}
              className="w-full px-4 py-3 rounded-2xl border border-rose-200 bg-white text-rose-900 placeholder:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 resize-none text-sm"
            />
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
      </div>
    </div>
  );
}

