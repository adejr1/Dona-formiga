import { useMemo, useState } from "react";
import Cardapio from "./pages/cardapio/Cardapio";
import Home from "./pages/home/Home";
import Pedidos from "./pages/pedidos/Pedidos";
import HistoricoPedidos from "./pages/historico/HistoricoPedidos";
import Estoque from "./pages/estoque/Estoque";
import Gastos from "./pages/gastos/Gastos";
import PedidoOnline from "./pages/cliente/PedidoOnline";
import ErrorBoundary from "./components/ErrorBoundary";

type AbaPrincipal =
  | "inicio"
  | "cardapio"
  | "pedidos"
  | "historico"
  | "estoque"
  | "gastos";

function App() {
  const [abaAtiva, setAbaAtiva] = useState<AbaPrincipal>("inicio");

  const isClienteView = useMemo(() => {
    if (typeof window === "undefined") return false;
    const path = window.location.pathname.toLowerCase();
    return path.includes("cliente") || path.includes("pedido");
  }, []);

  if (isClienteView) {
    return (
      <ErrorBoundary>
        <PedidoOnline />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex bg-rose-50">
        {/* Sidebar */}
        <aside className="w-64 bg-gradient-to-b from-rose-700 via-rose-600 to-rose-500 text-rose-50 flex flex-col shadow-xl">
          <div className="px-5 pt-6 pb-4 border-b border-rose-500/60 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-300/40 overflow-hidden flex items-center justify-center">
              <img
                src="/assets/c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_9b7e95b05d0020946e7c3e29a217bff1_images_WhatsApp_Image_2025-10-08_at_10.18.44-fotor-20251028104826-b5cb606d-134e-4ea8-8363-020ff666ac19.png"
                alt="Dona Formiga"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-rose-100/80">
                Dona Formiga
              </p>
              <p className="text-sm font-semibold leading-tight">Painel</p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            <button
              onClick={() => setAbaAtiva("inicio")}
              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                abaAtiva === "inicio"
                  ? "bg-rose-100 text-rose-800 shadow-lg shadow-rose-900/20"
                  : "text-rose-50/80 hover:bg-rose-500/50 hover:text-white"
              }`}
            >
              Início
            </button>
            <button
              onClick={() => setAbaAtiva("pedidos")}
              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                abaAtiva === "pedidos"
                  ? "bg-rose-100 text-rose-800 shadow-lg shadow-rose-900/20"
                  : "text-rose-50/80 hover:bg-rose-500/50 hover:text-white"
              }`}
            >
              Pedidos
            </button>
            <button
              onClick={() => setAbaAtiva("historico")}
              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                abaAtiva === "historico"
                  ? "bg-rose-100 text-rose-800 shadow-lg shadow-rose-900/20"
                  : "text-rose-50/80 hover:bg-rose-500/50 hover:text-white"
              }`}
            >
              Histórico
            </button>
            <button
              onClick={() => setAbaAtiva("cardapio")}
              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                abaAtiva === "cardapio"
                  ? "bg-rose-100 text-rose-800 shadow-lg shadow-rose-900/20"
                  : "text-rose-50/80 hover:bg-rose-500/50 hover:text-white"
              }`}
            >
              Cardápio
            </button>
            <button
              onClick={() => setAbaAtiva("estoque")}
              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                abaAtiva === "estoque"
                  ? "bg-rose-100 text-rose-800 shadow-lg shadow-rose-900/20"
                  : "text-rose-50/80 hover:bg-rose-500/50 hover:text-white"
              }`}
            >
              Estoque
            </button>
            <button
              onClick={() => setAbaAtiva("gastos")}
              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                abaAtiva === "gastos"
                  ? "bg-rose-100 text-rose-800 shadow-lg shadow-rose-900/20"
                  : "text-rose-50/80 hover:bg-rose-500/50 hover:text-white"
              }`}
            >
              Gastos
            </button>
          </nav>

          <div className="px-4 pb-4 pt-3 text-[10px] text-rose-100/60 border-t border-rose-500/60">
            Sistema personalizado para Dona Formiga
          </div>
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1">
          {abaAtiva === "inicio" && <Home />}
          {abaAtiva === "pedidos" && <Pedidos />}
          {abaAtiva === "historico" && <HistoricoPedidos />}
          {abaAtiva === "cardapio" && <Cardapio />}
          {abaAtiva === "estoque" && <Estoque />}
          {abaAtiva === "gastos" && <Gastos />}
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
