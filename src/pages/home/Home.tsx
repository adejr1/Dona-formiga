import { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";

interface PedidoResumo {
  id: string;
  criadoEm: string;
  status?: string;
  valorTotal?: number;
}

interface GastoResumo {
  id: string;
  valor: number;
  data: string;
}

export default function Home() {
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [gastos, setGastos] = useState<GastoResumo[]>([]);

  useEffect(() => {
    const carregar = async () => {
      try {
        const [pRes, gRes] = await Promise.all([
          fetch(apiUrl("/pedidos")),
          fetch(apiUrl("/gastos")),
        ]);
        if (pRes.ok) {
          const data = await pRes.json();
          setPedidos(data);
        }
        if (gRes.ok) {
          const data = await gRes.json();
          setGastos(data);
        }
      } catch {
        // silencioso na Home
      }
    };
    carregar();
  }, []);

  const agora = new Date();
  const inicioSemana = (() => {
    const d = new Date(agora);
    const day = d.getDay() || 7; // 1..7
    d.setDate(d.getDate() - day + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const inicioAno = new Date(agora.getFullYear(), 0, 1);
  const pedidosConcluidos = pedidos.filter((p) => p.status === "concluido");

  const ganhosSemana = pedidosConcluidos
    .filter((p) => new Date(p.criadoEm) >= inicioSemana)
    .reduce((sum, p) => sum + (p.valorTotal || 0), 0);
  const ganhosMes = pedidosConcluidos
    .filter((p) => new Date(p.criadoEm) >= inicioMes)
    .reduce((sum, p) => sum + (p.valorTotal || 0), 0);
  const ganhosAno = pedidosConcluidos
    .filter((p) => new Date(p.criadoEm) >= inicioAno)
    .reduce((sum, p) => sum + (p.valorTotal || 0), 0);

  const gastosSemana = gastos
    .filter((g) => new Date(g.data) >= inicioSemana)
    .reduce((sum, g) => sum + (g.valor || 0), 0);
  const gastosMes = gastos
    .filter((g) => new Date(g.data) >= inicioMes)
    .reduce((sum, g) => sum + (g.valor || 0), 0);
  const gastosAno = gastos
    .filter((g) => new Date(g.data) >= inicioAno)
    .reduce((sum, g) => sum + (g.valor || 0), 0);

  const saldoSemana = ganhosSemana - gastosSemana;
  const saldoMes = ganhosMes - gastosMes;
  const saldoAno = ganhosAno - gastosAno;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-100 via-rose-50 to-white relative overflow-hidden">
      <div
        className="pointer-events-none select-none absolute inset-0 opacity-10 mix-blend-multiply bg-center bg-contain bg-no-repeat"
        style={{
          backgroundImage:
            "url('/assets/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_9b7e95b05d0020946e7c3e29a217bff1_images_WhatsApp_Image_2025-10-08_at_10.18.44-fotor-20251028104826-b5cb606d-134e-4ea8-8363-020ff666ac19.png')",
        }}
      />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div className="text-center">
          <p className="text-xs tracking-[0.5em] uppercase text-rose-500 mb-3">
            Bem-vinda ao seu painel
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-rose-900 drop-shadow-sm mb-4">
            DONA FORMIGA
          </h1>
          <p className="text-sm md:text-base text-rose-700 max-w-xl mx-auto mb-6">
            Acompanhe rapidamente seus pedidos, ganhos e gastos. Use o menu ao
            lado para navegar entre cardápio, pedidos, histórico, estoque e
            gastos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/90 rounded-3xl border border-rose-100 shadow-md p-4 text-left">
            <p className="text-[11px] uppercase tracking-wide text-rose-400 mb-1">
              Semana – ganhos x gastos
            </p>
            <p className="text-sm text-rose-700">
              Ganhos:{" "}
              <span className="font-bold">
                R$ {ganhosSemana.toFixed(2).replace(".", ",")}
              </span>
            </p>
            <p className="text-sm text-rose-700">
              Gastos:{" "}
              <span className="font-bold">
                R$ {gastosSemana.toFixed(2).replace(".", ",")}
              </span>
            </p>
            <p
              className={`mt-1 text-sm font-extrabold ${
                saldoSemana >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              Saldo: {saldoSemana >= 0 ? "+" : "-"}{" "}
              {Math.abs(saldoSemana).toFixed(2).replace(".", ",")}
            </p>
            <p className="text-[11px] text-rose-500 mt-1">
              Últimos 7 dias
            </p>
          </div>
          <div className="bg-white/90 rounded-3xl border border-rose-100 shadow-md p-4 text-left">
            <p className="text-[11px] uppercase tracking-wide text-rose-400 mb-1">
              Mês – ganhos x gastos
            </p>
            <p className="text-sm text-rose-700">
              Ganhos:{" "}
              <span className="font-bold">
                R$ {ganhosMes.toFixed(2).replace(".", ",")}
              </span>
            </p>
            <p className="text-sm text-rose-700">
              Gastos:{" "}
              <span className="font-bold">
                R$ {gastosMes.toFixed(2).replace(".", ",")}
              </span>
            </p>
            <p
              className={`mt-1 text-sm font-extrabold ${
                saldoMes >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              Saldo: {saldoMes >= 0 ? "+" : "-"}{" "}
              {Math.abs(saldoMes).toFixed(2).replace(".", ",")}
            </p>
            <p className="text-[11px] text-rose-500 mt-1">
              Mês atual
            </p>
          </div>
          <div className="bg-white/90 rounded-3xl border border-rose-100 shadow-md p-4 text-left">
            <p className="text-[11px] uppercase tracking-wide text-rose-400 mb-1">
              Ano – ganhos x gastos
            </p>
            <p className="text-sm text-rose-700">
              Ganhos:{" "}
              <span className="font-bold">
                R$ {ganhosAno.toFixed(2).replace(".", ",")}
              </span>
            </p>
            <p className="text-sm text-rose-700">
              Gastos:{" "}
              <span className="font-bold">
                R$ {gastosAno.toFixed(2).replace(".", ",")}
              </span>
            </p>
            <p
              className={`mt-1 text-sm font-extrabold ${
                saldoAno >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              Saldo: {saldoAno >= 0 ? "+" : "-"}{" "}
              {Math.abs(saldoAno).toFixed(2).replace(".", ",")}
            </p>
            <p className="text-[11px] text-rose-500 mt-1">
              Ano atual
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              if (typeof window === "undefined") return;
              const origin = window.location.origin || "";
              // Sempre envia o link "original" de produção para o cliente,
              // mesmo se você estiver usando o sistema localmente (localhost).
              const base =
                origin.startsWith("chrome-extension://") ||
                origin.includes("localhost") ||
                origin.includes("127.0.0.1")
                  ? "https://dona-formiga.vercel.app"
                  : origin;
              const linkCliente = `${base}/cliente`;
              const texto = `Olá, libere a formiga dentro de você e faça já o seu pedido: ${linkCliente}`;
              const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
              window.open(url, "_blank");
            }}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-300 hover:bg-emerald-600 transition-colors text-sm gap-2"
          >
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white">
              <svg
                viewBox="0 0 32 32"
                aria-hidden="true"
                focusable="false"
                className="w-3.5 h-3.5 fill-emerald-600"
              >
                <path d="M19.11 17.51c-.28-.14-1.62-.8-1.87-.89-.25-.09-.43-.14-.61.14-.18.28-.7.89-.86 1.07-.16.18-.32.21-.6.07-.28-.14-1.17-.43-2.23-1.38-.82-.73-1.37-1.63-1.53-1.9-.16-.28-.02-.43.12-.57.12-.12.28-.32.41-.48.14-.16.18-.28.27-.46.09-.18.05-.34-.02-.48-.07-.14-.61-1.48-.84-2.03-.22-.53-.45-.46-.61-.46-.16 0-.34-.02-.52-.02-.18 0-.46.07-.7.34-.25.28-.95.93-.95 2.26s.98 2.62 1.12 2.8c.14.18 1.93 2.95 4.68 4.13.65.28 1.16.45 1.56.58.66.21 1.26.18 1.74.11.53-.08 1.62-.66 1.85-1.3.23-.64.23-1.18.16-1.3-.07-.12-.25-.18-.52-.32z" />
                <path d="M26.67 5.33A14.67 14.67 0 0 0 4.6 24.79L3 29l4.35-1.56A14.66 14.66 0 0 0 29 16a14.58 14.58 0 0 0-2.33-10.67zM16 27.33c-2.4 0-4.74-.65-6.79-1.87l-.49-.29-2.58.92.95-2.52-.32-.52A11.99 11.99 0 1 1 16 27.33z" />
              </svg>
            </span>
            <span>Enviar link do pedido pelo WhatsApp</span>
          </button>
          <p className="text-[11px] text-rose-600 max-w-sm text-center md:text-right">
            Dica: use as abas de <strong>Gastos</strong> e <strong>Histórico</strong>{" "}
            para registrar seus custos e acompanhar a evolução dos pedidos ao
            longo do ano (ganhos no ano: {ganhosAno} pedidos concluídos).
          </p>
        </div>
      </div>
    </div>
  );
}

