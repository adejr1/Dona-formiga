import { useMemo, useState, useEffect } from "react";
import Cardapio from "./pages/cardapio/Cardapio";
import Home from "./pages/home/Home";
import Pedidos from "./pages/pedidos/Pedidos";
import HistoricoPedidos from "./pages/historico/HistoricoPedidos";
import Estoque from "./pages/estoque/Estoque";
import Gastos from "./pages/gastos/Gastos";
import PedidoOnline from "./pages/cliente/PedidoOnline";
import ErrorBoundary from "./components/ErrorBoundary";

const AUTH_KEY = "dona-formiga-authenticated";

type AbaPrincipal =
  | "inicio"
  | "cardapio"
  | "pedidos"
  | "historico"
  | "estoque"
  | "gastos";

function App() {
  const [abaAtiva, setAbaAtiva] = useState<AbaPrincipal>("inicio");
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const { isClienteView } = useMemo(() => {
    if (typeof window === "undefined") return { isClienteView: true };
    const path = window.location.pathname.toLowerCase();
    const isAdminView = path.includes("painel");
    return { isClienteView: !isAdminView };
  }, []);

  useEffect(() => {
    if (!isClienteView && typeof sessionStorage !== "undefined") {
      setAutenticado(sessionStorage.getItem(AUTH_KEY) === "1");
    }
  }, [isClienteView]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    const senhaCorreta =
      import.meta.env.VITE_ADMIN_PASSWORD || "donaformiga2025";
    if (senha.trim() === senhaCorreta) {
      sessionStorage.setItem(AUTH_KEY, "1");
      setAutenticado(true);
    } else {
      setErro("Senha incorreta.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setAutenticado(false);
    setSenha("");
  };

  if (isClienteView) {
    return (
      <ErrorBoundary>
        <PedidoOnline />
      </ErrorBoundary>
    );
  }

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-100 via-rose-50 to-white flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-3xl shadow-xl border border-rose-100 p-8 w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <p className="text-xs tracking-widest text-rose-500 uppercase">
              Dona Formiga
            </p>
            <h1 className="text-xl font-bold text-rose-900 mt-1">
              Acesso ao painel
            </h1>
            <p className="text-sm text-rose-600 mt-1">
              Digite a senha para continuar
            </p>
          </div>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            autoFocus
            className="w-full px-4 py-3 rounded-2xl border border-rose-200 text-rose-900 placeholder:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400 mb-3"
          />
          {erro && (
            <p className="text-sm text-red-600 mb-3">{erro}</p>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
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
                src="/favicon-dona-formiga.png.png"
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

          <div className="px-4 pb-4 pt-3 border-t border-rose-500/60 space-y-2">
            <p className="text-[10px] text-rose-100/60">
              Sistema personalizado para Dona Formiga
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-rose-200 hover:text-white transition-colors"
            >
              Sair
            </button>
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
