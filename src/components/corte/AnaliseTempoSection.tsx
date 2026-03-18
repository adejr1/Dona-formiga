import { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend, Cell } from 'recharts';
import { calcularMinutosUteis } from '../../utils/horarioTrabalho';

interface ProdutoTempoSalvo {
  id: string;
  nome: string;
  tempoExato?: number;
  tempoProducaoMinutos?: number;
  qtdProduto?: number;
  lote?: string;
  dataHoraInicioExato?: string;
  dataHoraTerminoExato?: string;
  dataHoraInicioProducao?: string;
  dataHoraTerminoProducao?: string;
  horarioExtraManha?: boolean;
  horarioExtraAlmoco?: boolean;
}

interface AnaliseTempoSectionProps {
  produtos: ProdutoTempoSalvo[];
  formatarTempo: (min: number) => string;
  removerProduto: (id: string) => void;
}

export default function AnaliseTempoSection({
  produtos,
  formatarTempo,
  removerProduto,
}: AnaliseTempoSectionProps) {
  const [lotesSelecionados, setLotesSelecionados] = useState<Set<string>>(new Set());
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const produtosFiltradosPorData = useMemo(() => {
    if (!dataInicio && !dataFim) return produtos;
    return produtos.filter((p) => {
      const dt = p.dataHoraTerminoProducao || p.dataHoraInicioProducao || '';
      if (!dt) return false;
      const d = new Date(dt);
      const di = dataInicio ? new Date(dataInicio) : null;
      const df = dataFim ? new Date(dataFim + 'T23:59:59') : null;
      if (di && d < di) return false;
      if (df && d > df) return false;
      return true;
    });
  }, [produtos, dataInicio, dataFim]);

  const lotesAgrupados = useMemo(() => {
    const map = new Map<string, ProdutoTempoSalvo[]>();
    produtosFiltradosPorData.forEach((p) => {
      const lote = (p.lote || '').trim().toUpperCase() || 'SEM LOTE';
      if (!map.has(lote)) map.set(lote, []);
      map.get(lote)!.push(p);
    });
    return Array.from(map.entries())
      .filter(([, itens]) => itens.length > 0)
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [produtosFiltradosPorData]);

  const toggleLote = (lote: string) => {
    setLotesSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(lote)) next.delete(lote);
      else next.add(lote);
      return next;
    });
  };

  const selecionarTodos = () => setLotesSelecionados(new Set(lotesAgrupados.map(([l]) => l)));
  const limparSelecao = () => setLotesSelecionados(new Set());

  const lotesParaAnalise = lotesSelecionados.size > 0
    ? lotesAgrupados.filter(([lote]) => lotesSelecionados.has(lote))
    : lotesAgrupados;

  const dadosPorLote = useMemo(() => {
    return lotesParaAnalise.map(([lote, itens]) => {
      const tempoExatoTotal = itens.reduce((s, p) => s + (p.tempoExato ?? 0), 0);
      const tempoProducaoTotal = itens.reduce((s, p) => s + (p.tempoProducaoMinutos ?? 0), 0);
      const ganhoOuPerda = tempoExatoTotal - tempoProducaoTotal;
      const ganhou = ganhoOuPerda >= 0;

      let statusDatas = { texto: '-', emDia: null as boolean | null };
      const primeiro = itens[0];
      if (primeiro?.dataHoraTerminoExato && primeiro?.dataHoraTerminoProducao) {
        const extraManha = primeiro.horarioExtraManha ?? false;
        const extraAlmoco = primeiro.horarioExtraAlmoco ?? false;
        const emDia = new Date(primeiro.dataHoraTerminoProducao) <= new Date(primeiro.dataHoraTerminoExato);
        let minUteis: number;
        if (emDia) {
          minUteis = calcularMinutosUteis(primeiro.dataHoraTerminoProducao, primeiro.dataHoraTerminoExato, extraManha, extraAlmoco);
        } else {
          minUteis = -calcularMinutosUteis(primeiro.dataHoraTerminoExato, primeiro.dataHoraTerminoProducao, extraManha, extraAlmoco);
        }
        const h = Math.floor(Math.abs(minUteis) / 60);
        const m = Math.round(Math.abs(minUteis) % 60);
        statusDatas = {
          texto: emDia ? `Em dia (${h}h ${m}min antes)` : `Atrasado ${h}h ${m}min`,
          emDia,
        };
      }

      return {
        lote,
        itens,
        tempoExatoTotal,
        tempoProducaoTotal,
        ganhoOuPerda,
        ganhou,
        statusDatas,
      };
    });
  }, [lotesParaAnalise]);

  const totaisGerais = useMemo(() => {
    const te = dadosPorLote.reduce((s, d) => s + d.tempoExatoTotal, 0);
    const tp = dadosPorLote.reduce((s, d) => s + d.tempoProducaoTotal, 0);
    return { tempoExatoTotal: te, tempoProducaoTotal: tp, ganhoOuPerda: te - tp, ganhou: te - tp >= 0 };
  }, [dadosPorLote]);

  const maxValor = useMemo(() => {
    let m = 0;
    dadosPorLote.forEach((d) => {
      m = Math.max(m, d.tempoExatoTotal, d.tempoProducaoTotal);
    });
    return Math.max(m, 1);
  }, [dadosPorLote]);

  const dadosIndividuais = useMemo(() => {
    const itens: { nome: string; nomeCompleto: string; lote: string; tempoExato: number; tempoProducao: number; ganhou: boolean }[] = [];
    dadosPorLote.forEach((d) => {
      d.itens.forEach((p) => {
        const te = p.tempoExato ?? 0;
        const tp = p.tempoProducaoMinutos ?? 0;
        const ganhou = te - tp >= 0;
        const nomeCurto = (p.nome || 'Produto').length > 12 ? (p.nome || '').slice(0, 10) + '…' : (p.nome || 'Produto');
        itens.push({
          nome: nomeCurto,
          nomeCompleto: `${p.nome || 'Produto'} (${d.lote})`,
          lote: d.lote,
          tempoExato: te,
          tempoProducao: tp,
          ganhou,
        });
      });
    });
    return itens;
  }, [dadosPorLote]);

  const dadosGraficoLotes = useMemo(
    () =>
      dadosPorLote.map((d) => ({
        lote: d.lote,
        tempoExato: d.tempoExatoTotal,
        tempoProducao: d.tempoProducaoTotal,
        ganhou: d.ganhou,
      })),
    [dadosPorLote]
  );

  const imprimirGraficoAnalise = () => {
    document.body.classList.add('imprimir-analise-grafico');
    window.print();
    document.body.classList.remove('imprimir-analise-grafico');
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-slate-700 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" /> Análise de Tempo por Lote
      </h3>
      <p className="text-sm text-slate-500">
        Produtos com o mesmo LOTE têm seus tempos somados. Tempo Exato − Tempo Produção = Ganho (verde) ou Perda (vermelho). Datas usam horários 07-11 e 12:12-17.
      </p>

      {lotesAgrupados.length === 0 ? (
        <div className="bg-slate-50 rounded-xl p-12 text-center text-slate-500">
          Nenhum produto salvo ainda. Salve produtos no Tempo de Corte com número de LOTE para analisar.
        </div>
      ) : (
        <>
          {/* Filtro por data de produção */}
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <h4 className="font-semibold text-slate-700 mb-2">Filtrar por data de produção</h4>
            <p className="text-xs text-slate-500 mb-2">Selecione o período para ver ganho/perda nos dias filtrados.</p>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Data início</label>
                <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Data fim</label>
                <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
              </div>
              <button onClick={() => { setDataInicio(''); setDataFim(''); }} className="text-sm text-slate-500 hover:underline">Limpar</button>
            </div>
          </div>

          {/* Seletor de lotes */}
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <h4 className="font-semibold text-slate-700 mb-2">Selecionar lotes para análise</h4>
            <p className="text-xs text-slate-500 mb-2">Marque os lotes que deseja comparar. Vazio = todos.</p>
            <div className="flex flex-wrap gap-2 mb-2">
              <button onClick={selecionarTodos} className="text-xs text-indigo-600 hover:underline">Todos</button>
              <button onClick={limparSelecao} className="text-xs text-slate-500 hover:underline">Nenhum</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {lotesAgrupados.map(([lote, itens]) => (
                <label key={lote} className="flex flex-col gap-0.5 px-3 py-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100" title={itens.map((p) => p.nome).join(', ')}>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={lotesSelecionados.size === 0 || lotesSelecionados.has(lote)}
                      onChange={() => toggleLote(lote)}
                    />
                    <span className="text-sm font-medium">{lote}</span>
                    <span className="text-xs text-slate-400">({itens.length} itens)</span>
                  </div>
                  <span className="text-xs text-slate-500 truncate max-w-[200px]">{itens.map((p) => p.nome).join(', ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Gráfico de Colunas Agrupadas 3D (visual) por Lote – estilo infográfico */}
          {dadosGraficoLotes.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm area-grafico-analise">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-slate-700">Gráfico de Colunas Agrupadas 3D - por Lote</h4>
                  <p className="text-sm text-slate-500">
                    Cada lote com duas colunas: <span className="text-blue-600 font-semibold">Tempo Exato</span> e{' '}
                    <span className="text-emerald-600 font-semibold">Tempo Produção</span> (verde = ganhou, vermelho = perdeu).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={imprimirGraficoAnalise}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm"
                >
                  Imprimir gráfico
                </button>
              </div>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dadosGraficoLotes}
                      margin={{ top: 40, right: 30, left: 10, bottom: 60 }}
                      barCategoryGap="25%"
                    >
                    <defs>
                      <linearGradient id="tempoExatoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                      </linearGradient>
                      <linearGradient id="tempoProducaoGanhouGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6ee7b7" />
                        <stop offset="100%" stopColor="#16a34a" />
                      </linearGradient>
                      <linearGradient id="tempoProducaoPerdeuGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fecaca" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="lote" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} interval={0} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatarTempo(v)} domain={[0, 'auto']} width={60} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatarTempo(value),
                        name === 'tempoExato' ? 'Tempo Exato' : 'Tempo Produção',
                      ]}
                      contentStyle={{ borderRadius: 8 }}
                      labelFormatter={(label) => `Lote ${label}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: 10 }} />
                    <Bar
                      dataKey="tempoExato"
                      name="Tempo Exato"
                      fill="url(#tempoExatoGrad)"
                      barSize={28}
                      radius={[4, 4, 0, 0]}
                      background={{ fill: '#e5e7eb' }}
                    >
                      <LabelList
                        dataKey="tempoExato"
                        position="top"
                        formatter={(v: number) => formatarTempo(v)}
                        style={{ fontSize: 10, fontWeight: 600, fill: '#1e40af' }}
                      />
                    </Bar>
                    <Bar
                      dataKey="tempoProducao"
                      name="Tempo Produção"
                      barSize={28}
                      radius={[4, 4, 0, 0]}
                    >
                      {dadosGraficoLotes.map((d, i) => (
                        <Cell
                          key={i}
                          fill={d.ganhou ? 'url(#tempoProducaoGanhouGrad)' : 'url(#tempoProducaoPerdeuGrad)'}
                          stroke="#0f172a"
                          strokeWidth={0.5}
                        />
                      ))}
                      <LabelList
                        dataKey="tempoProducao"
                        position="top"
                        formatter={(v: number) => formatarTempo(v)}
                        style={{ fontSize: 10, fontWeight: 600 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-6 mt-4 text-xs flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-blue-500" /> Tempo Exato
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-emerald-500" /> Produção (ganhou)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-red-500" /> Produção (perdeu)
                </span>
              </div>
            </div>
          )}

          {/* Caixa total dos lotes selecionados */}
          {dadosPorLote.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-xl p-6 border-2 border-indigo-200">
              <h4 className="font-bold text-slate-800 mb-4">Total dos lotes selecionados ({dadosPorLote.length} {dadosPorLote.length === 1 ? 'lote' : 'lotes'})</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-100 rounded-xl p-4 text-center">
                  <p className="text-sm text-green-700 font-medium">Tempo Exato Total</p>
                  <p className="text-2xl font-bold text-green-800">{formatarTempo(totaisGerais.tempoExatoTotal)}</p>
                </div>
                <div className="bg-amber-100 rounded-xl p-4 text-center">
                  <p className="text-sm text-amber-700 font-medium">Tempo Produção Total</p>
                  <p className="text-2xl font-bold text-amber-800">{formatarTempo(totaisGerais.tempoProducaoTotal)}</p>
                </div>
                <div className={`rounded-xl p-4 text-center ${totaisGerais.ganhou ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  <p className={`text-sm font-medium ${totaisGerais.ganhou ? 'text-emerald-700' : 'text-red-700'}`}>Ganho ou Perda</p>
                  <p className={`text-2xl font-bold ${totaisGerais.ganhou ? 'text-emerald-800' : 'text-red-800'}`}>
                    {totaisGerais.ganhou ? '+' : ''}{formatarTempo(totaisGerais.ganhoOuPerda)}
                  </p>
                  <p className="text-xs mt-1">{totaisGerais.ganhou ? 'Ganhou tempo' : 'Perdeu tempo'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Gráfico de linhas (barras verticais) + caixa ganho/perda por lote */}
          <div className="space-y-4">
            {dadosPorLote.map((d) => (
              <div key={d.lote} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <h4 className="font-semibold text-slate-700 mb-1">Lote: {d.lote}</h4>
                <p className="text-sm text-slate-500 mb-3">Produtos: {d.itens.map((p) => p.nome).join(', ')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-green-600">Tempo Exato Total</p>
                    <p className="text-xl font-bold text-green-800">{formatarTempo(d.tempoExatoTotal)}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs text-amber-600">Tempo Produção Total</p>
                    <p className="text-xl font-bold text-amber-800">{formatarTempo(d.tempoProducaoTotal)}</p>
                  </div>
                </div>
                <div className={`rounded-xl p-4 mb-4 ${d.ganhou ? 'bg-emerald-100 border-2 border-emerald-300' : 'bg-red-100 border-2 border-red-300'}`}>
                  <p className={`font-bold text-lg ${d.ganhou ? 'text-emerald-800' : 'text-red-800'}`}>
                    {d.ganhou ? 'Ganhou' : 'Perdeu'} {formatarTempo(Math.abs(d.ganhoOuPerda))}
                  </p>
                </div>
                {d.statusDatas.emDia !== null && (
                  <p className={`text-sm font-semibold ${d.statusDatas.emDia ? 'text-green-600' : 'text-red-600'}`}>
                    Datas: {d.statusDatas.texto}
                  </p>
                )}
                {/* Mini gráfico individual por produto no lote */}
                <div className="mt-4 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={d.itens.map((p) => ({
                      nome: (p.nome || '').length > 10 ? (p.nome || '').slice(0, 8) + '…' : (p.nome || 'P'),
                      tempoExato: p.tempoExato ?? 0,
                      tempoProducao: p.tempoProducaoMinutos ?? 0,
                      ganhou: (p.tempoExato ?? 0) - (p.tempoProducaoMinutos ?? 0) >= 0,
                    }))} margin={{ top: 25, right: 5, left: 5, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="nome" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 8 }} tickFormatter={(v) => formatarTempo(v)} width={40} />
                      <Tooltip formatter={(v: number) => formatarTempo(v)} />
                      <Line type="monotone" dataKey="tempoExato" name="Exato" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} connectNulls>
                        <LabelList dataKey="tempoExato" position="top" formatter={(v: number) => formatarTempo(v)} style={{ fontSize: 8 }} />
                      </Line>
                      <Line
                        type="monotone"
                        dataKey="tempoProducao"
                        name="Produção"
                        stroke="#94a3b8"
                        strokeWidth={1}
                        dot={(props: { cx?: number; cy?: number; payload?: { ganhou?: boolean } }) => (
                          <circle cx={props.cx} cy={props.cy} r={4} fill={(props.payload?.ganhou ?? true) ? '#22c55e' : '#ef4444'} stroke="white" strokeWidth={1} />
                        )}
                        connectNulls
                      >
                        <LabelList dataKey="tempoProducao" position="top" formatter={(v: number) => formatarTempo(v)} style={{ fontSize: 8 }} />
                      </Line>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
