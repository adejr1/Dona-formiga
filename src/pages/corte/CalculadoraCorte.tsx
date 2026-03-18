import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Calculator, Layers, Printer, Save, Database, FolderOpen, Eye, Move, Type, MessageSquare, Maximize2, History, RotateCcw, RotateCw, FileText, ChevronUp, ChevronDown, ChevronRight, GripVertical, Clock, BarChart3, Upload, ClipboardList, TrendingUp, Table, Calendar, Package, PanelLeftClose, PanelLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ordemMaterialSort } from '../../utils/horarioTrabalho';
import { useCorteStore, getCorCodigo, getEixoNome } from '../../store/corte/useCorteStore';
import type { EixoCodigo } from '../../types/corte';
import VisualizacaoCorte from '../../components/corte/VisualizacaoCorte';
import AnaliseTempoSection from '../../components/corte/AnaliseTempoSection';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
// @ts-ignore
import Highcharts3d from 'highcharts/highcharts-3d';
if (typeof Highcharts3d === 'function') Highcharts3d(Highcharts);

type AbaPrincipal = 'projeto' | 'catalogo' | 'historico' | 'relatorio' | 'sobra' | 'tempoCorte' | 'analiseTempo' | 'lotes' | 'boletimPontuacao' | 'boletimCalculadora' | 'boletimTabelaDias' | 'boletimResumoDias' | 'boletimGrafico';

interface LayoutConfig {
  desenhoX: number;
  desenhoY: number;
  desenhoLargura: number;
  desenhoAltura: number;
  desenhoRotacao: number;
  desenhoEscalaX: number;
  desenhoEscalaY: number;
  infoX: number;
  infoY: number;
  infoLargura: number;
  infoAltura: number;
  infoRotacao: number;
  fontSize: number;
  fontSizeInfo: number;
  observacoes: string;
  obsX: number;
  obsY: number;
  obsLargura: number;
  obsAltura: number;
  obsRotacao: number;
  obsFontSize: number;
  quantidadeChapas: number;
  espessuraMaterial: number;
  tipoMaterial: 'aglomerado' | 'mdf';
  plano: number;
  etapas: number;
}

interface HistoricoImpressao {
  id: string;
  data: string;
  dataHora: string;
  projeto: { nomeProduto: string; nomePeca: string };
  configuracao: { larguraTotal: number; comprimentoTotal: number; espessuraSerra: number };
  layoutConfig: LayoutConfig;
  pecas: { codigo: EixoCodigo; medida: number; quantidade: number }[];
  grupos: any[];
}

interface RelatorioItem {
  id: string;
  corteNumero: number;
  nomePeca: string;
  quantidade: number;
  medidaMenor: number;
  medidaMaior: number;
  material: 'aglomerado' | 'mdf';
  espessura: number;
  lote: string;
  inicio: string;
  termino: string;
  observacao: string;
  planoOrigem: number;
  dataInclusao: string;
}

interface TempoCorteItem {
  id: string;
  numero: number;
  descricao: string;
  qtd: number;
  medida: string;
  metrosQuadrados: number;
  material: string;
  selecionado: boolean;
}

interface LoteProdutoConfig {
  id: string;
  lote: string;
  produtoNome: string;
  qtd: number;
  dataHoraInicioCorte?: string;
  dataHoraFimEmbalagem?: string;
}

interface PontuacaoProduto {
  nome: string;
  m2: number;
}

const PONTUACOES_PRODUTOS_INICIAL: PontuacaoProduto[] = [
  { nome: 'APARADOR BAR ASTURIAS', m2: 0.8 },
  { nome: 'APARADOR BARI 1.0', m2: 1.2 },
  { nome: 'APARADOR BUFFET BERLIM', m2: 1.3 },
  { nome: 'APARADOR LUIS XV', m2: 1.2 },
  { nome: 'APARADOR MEMPHIS', m2: 1.6 },
  { nome: 'APARADOR MADERATTO', m2: 1.2 },
  { nome: 'ARMARIO BERLIM', m2: 0.8 },
  { nome: 'ARMARIO LIVREIRO SMART', m2: 0.45 },
  { nome: 'ARMARIO OSLO', m2: 2.5 },
  { nome: 'BALCÃO BERLIM', m2: 0.7 },
  { nome: 'BALCÃO OSLO', m2: 3 },
  { nome: 'BANDEIJA ASTURIAS', m2: 0.15 },
  { nome: 'BAR ADEGA BALI', m2: 0.7 },
  { nome: 'BUFFET ASTURIAS', m2: 1.2 },
  { nome: 'BUFFET ASTURIAS 0.92', m2: 0.9 },
  { nome: 'BUFFET ASTURIAS 1.8', m2: 1.5 },
  { nome: 'BUFFET AÇORES/DUBLIN 1.4', m2: 2.3 },
  { nome: 'BUFFET AÇORES/DUBLIN 1.9', m2: 2.5 },
  { nome: 'BUFFET ANDORRA/SIERRA 1.3', m2: 1.4 },
  { nome: 'BUFFET ANDORRA/SIERRA 1.72', m2: 1.7 },
  { nome: 'BUFFET APARADOR SMART', m2: 0.65 },
  { nome: 'BUFFET ARGO 1.0', m2: 1.3 },
  { nome: 'BUFFET ARGO 1.4', m2: 1.8 },
  { nome: 'BUFFET MADERATTO 3 PTS', m2: 1.6 },
  { nome: 'BUFFET MADERATTO 4 PTS', m2: 2 },
  { nome: 'BUFFET MAGNUM 0.9', m2: 1.2 },
  { nome: 'BUFFET MAGNUM 1.4', m2: 1.65 },
  { nome: 'BUFFET MAGNUM 1.9', m2: 2.1 },
  { nome: 'BUFFET PASSION', m2: 2.5 },
  { nome: 'BUFFET UNION', m2: 1.8 },
  { nome: 'EXPOSITOR 2.1', m2: 1.3 },
  { nome: 'EXPOSITOR FEIRA 2.2', m2: 1.3 },
  { nome: 'EXPOSITOR FEIRA 2.5', m2: 2.5 },
  { nome: 'EXPOSITOR FEIRA 2.7', m2: 2.8 },
  { nome: 'EXPOSITOR LOJAS CEM', m2: 2.5 },
  { nome: 'GAVETEIRO BERLIM', m2: 0.7 },
  { nome: 'GAVETEIRO OSLO', m2: 1 },
  { nome: 'HOME LENI', m2: 3.5 },
  { nome: 'HOME RENO', m2: 3.2 },
  { nome: 'HOME ROYAL', m2: 2.5 },
  { nome: 'KIT DIVISORIA DUPLA GRANDE SMART', m2: 0.25 },
  { nome: 'KIT DIVISORIA DUPLA PEQUENA SMART', m2: 0.22 },
  { nome: 'KIT DIVISORIA TRIPLA SMART', m2: 0.33 },
  { nome: 'LIVREIRO VERSALES', m2: 1 },
  { nome: 'MESA CAB. LUCCA/ARRUNA', m2: 1 },
  { nome: 'MESA CAB. LUIS XV', m2: 1.2 },
  { nome: 'MESA CAB. URBAN/CITY/SIENA/RATTAN', m2: 0.8 },
  { nome: 'MESA CENTRO HOLAMBRA', m2: 1 },
  { nome: 'MESA CENTRO PRATIKA', m2: 1 },
  { nome: 'MESA DE CENTRO MADERATTO', m2: 0.75 },
  { nome: 'MESA DE COMPUTADOR SMART', m2: 0.5 },
  { nome: 'MESA ESCRITORIO BERLIM', m2: 0.8 },
  { nome: 'MESA ESCRITORIO OSLO', m2: 1.8 },
  { nome: 'MODULO ARBO 0.9', m2: 1.4 },
  { nome: 'NICHO ASPEN 1.35', m2: 0.9 },
  { nome: 'NICHO ASPEN 1.8', m2: 1 },
  { nome: 'NICHO ASPEN 2.17', m2: 1.25 },
  { nome: 'NICHO DIOR 1.1', m2: 0.5 },
  { nome: 'NICHO DIOR 1.6', m2: 0.6 },
  { nome: 'NICHO DIOR 2.0', m2: 0.7 },
  { nome: 'NICHO LUXO 1.35', m2: 1 },
  { nome: 'NICHO LUXO 1.8', m2: 1.2 },
  { nome: 'NICHO LUXO 2.2', m2: 1.5 },
  { nome: 'NICHO SLIM 1.1', m2: 0.4 },
  { nome: 'NICHO SLIM 1.6', m2: 0.5 },
  { nome: 'NICHO SLIM 2.0', m2: 0.6 },
  { nome: 'NICHO SUSPENSO MADERATTO 1.8', m2: 0.9 },
  { nome: 'NICHO SUSPENSO MADERATTO 2.0', m2: 1 },
  { nome: 'NICHO SUSPENSO MADERATTO 2.2', m2: 1.1 },
  { nome: 'NICHO UNIVERSAL 1.35', m2: 1 },
  { nome: 'NICHO UNIVERSAL 1.8', m2: 1.2 },
  { nome: 'NICHO UNIVERSAL 2.2', m2: 1.5 },
  { nome: 'NICHO VERSATTI 1.35', m2: 0.65 },
  { nome: 'NICHO VERSATTI 1.8', m2: 0.8 },
  { nome: 'NICHO VERSATTI 2.2', m2: 0.95 },
  { nome: 'PAINEL ARBO 0.9', m2: 1.4 },
  { nome: 'PAINEL ARBO 1.4', m2: 2.2 },
  { nome: 'PAINEL ARBO 1.9', m2: 3 },
  { nome: 'PAINEL ARBO 2.3', m2: 3.6 },
  { nome: 'PAINEL ASTURIAS', m2: 0.7 },
  { nome: 'PAINEL ASTURIAS 1.8', m2: 1.1 },
  { nome: 'PAINEL AVANTI 1.36', m2: 0.9 },
  { nome: 'PAINEL AVANTI 1.8', m2: 1.3 },
  { nome: 'PAINEL BLISS 1.8', m2: 1.6 },
  { nome: 'PAINEL BLISS 2.2', m2: 1.8 },
  { nome: 'PAINEL BRASIL 1.365', m2: 1 },
  { nome: 'PAINEL DAVOS', m2: 0.9 },
  { nome: 'PAINEL DIJON', m2: 0.9 },
  { nome: 'PAINEL EGEO 1.35', m2: 1.2 },
  { nome: 'PAINEL EGEO 1.8', m2: 1.7 },
  { nome: 'PAINEL EGEO 2.25', m2: 2 },
  { nome: 'PAINEL ESTONE 1.4', m2: 1.2 },
  { nome: 'PAINEL ESTONE 1.8', m2: 1.7 },
  { nome: 'PAINEL ESTONE 2.3', m2: 2 },
  { nome: 'PAINEL FIT 90', m2: 0.4 },
  { nome: 'PAINEL FOX', m2: 0.54 },
  { nome: 'PAINEL GARDEN 1.8', m2: 1.4 },
  { nome: 'PAINEL GARDEN 2.2', m2: 1.8 },
  { nome: 'PAINEL LEGACY 1.6', m2: 1 },
  { nome: 'PAINEL LEGACY 2.0', m2: 1.2 },
  { nome: 'PAINEL MADERATTO 1.8', m2: 1.6 },
  { nome: 'PAINEL MADERATTO 2.0', m2: 1.8 },
  { nome: 'PAINEL MADERATTO 2.2', m2: 2 },
  { nome: 'PAINEL MASTER 1.35', m2: 1.6 },
  { nome: 'PAINEL MASTER 1.8', m2: 2 },
  { nome: 'PAINEL MASTER 2.2', m2: 2.6 },
  { nome: 'PAINEL MAXI', m2: 1 },
  { nome: 'PAINEL MERLOT 1.8', m2: 0.8 },
  { nome: 'PAINEL MURANO', m2: 2 },
  { nome: 'PAINEL PARIS', m2: 1 },
  { nome: 'PAINEL PARIS 2.2', m2: 1.3 },
  { nome: 'PAINEL STUDIO', m2: 1.4 },
  { nome: 'PAINEL STUDIO 2.18', m2: 1.6 },
  { nome: 'PAINEL TOKIO', m2: 0.56 },
  { nome: 'PAINEL TORINO 2', m2: 0.83 },
  { nome: 'PAINEL VEYRON 2.0', m2: 2.6 },
  { nome: 'PAINEL VEYRON 2.4', m2: 3 },
  { nome: 'QUADRO BISOTE', m2: 1.5 },
  { nome: 'RACK ASTURIAS', m2: 0.8 },
  { nome: 'RACK ASTURIAS 1.8', m2: 1.25 },
  { nome: 'RACK ANDES', m2: 1.7 },
  { nome: 'RACK ARUBA/CAYMAN/TREND', m2: 1 },
  { nome: 'RACK ATHOS', m2: 1.4 },
  { nome: 'RACK AUSTIN', m2: 1.2 },
  { nome: 'RACK BLISS 1.8', m2: 1.8 },
  { nome: 'RACK BLISS 2.2', m2: 2.1 },
  { nome: 'RACK BRISE 1.8', m2: 2.2 },
  { nome: 'RACK BRISE 2.2', m2: 2.6 },
  { nome: 'RACK C/ PAINEL AUDAX', m2: 2.2 },
  { nome: 'RACK CARRARA', m2: 1.2 },
  { nome: 'RACK COMODORO 1.8', m2: 1.3 },
  { nome: 'RACK COMODORO 2.2', m2: 1.5 },
  { nome: 'RACK DARIM', m2: 1.8 },
  { nome: 'RACK DENVER', m2: 1 },
  { nome: 'RACK DOMUS', m2: 1.2 },
  { nome: 'RACK FELIX', m2: 1.5 },
  { nome: 'RACK GLOOS 1.8', m2: 1.5 },
  { nome: 'RACK GLOOS 2.2', m2: 1.8 },
  { nome: 'RACK HANOVER 1.8', m2: 2.4 },
  { nome: 'RACK HANOVER 2.2', m2: 3 },
  { nome: 'RACK ITALIA', m2: 1.2 },
  { nome: 'RACK KING/ANDROS/AMBER', m2: 1.3 },
  { nome: 'RACK LEGACY 1.6', m2: 1 },
  { nome: 'RACK LEGACY 1.8', m2: 1.2 },
  { nome: 'RACK LEGACY 2.0', m2: 1.2 },
  { nome: 'RACK LIVERPOOL', m2: 0.8 },
  { nome: 'RACK MADERATTO 1.8', m2: 1.8 },
  { nome: 'RACK MADERATTO 2.2', m2: 2.2 },
  { nome: 'RACK MASTER 1.8', m2: 2.2 },
  { nome: 'RACK MASTER 2.2', m2: 2.6 },
  { nome: 'RACK MERLOT 1.8', m2: 2 },
  { nome: 'RACK MORGAN 1.8', m2: 1.5 },
  { nome: 'RACK MORGAN 2.2', m2: 1.875 },
  { nome: 'RACK NERO', m2: 0.9 },
  { nome: 'RACK REALE', m2: 0.8 },
  { nome: 'RACK STAR', m2: 1 },
  { nome: 'RACK THOR 1.8', m2: 2.4 },
  { nome: 'RACK THOR 2.2', m2: 2.9 },
  { nome: 'RACK THOR 2.6', m2: 4 },
  { nome: 'RACK TITAN', m2: 1 },
  { nome: 'RACK VIGO 1.8', m2: 1.5 },
  { nome: 'RACK VIGO 2.2', m2: 1.8 },
  { nome: 'RACK VINCI', m2: 0.8 },
  { nome: 'RACK VITRAL', m2: 1.4 },
];

export default function CalculadoraCorte() {
  const { configuracao, setConfiguracao, pecas, adicionarPeca, removerPeca, restaurarPecas, calcularConsumo, novoGrupo, projeto, setProjeto, projetosSalvos, salvarProjeto, carregarProjeto, removerProjetoSalvo, itensProducao, adicionarItemProducao, removerItemProducao, limparProducao, calcularChapasNecessarias, rotacaoDesenho, girarDesenho } = useCorteStore();
  
  const LAYOUT_PADRAO: LayoutConfig = {
    desenhoX: 5, desenhoY: 35, desenhoLargura: 130, desenhoAltura: 240, desenhoRotacao: 0, desenhoEscalaX: 100, desenhoEscalaY: 100,
    infoX: 140, infoY: 35, infoLargura: 65, infoAltura: 200, infoRotacao: 0, fontSize: 100, fontSizeInfo: 100,
    observacoes: '', obsX: 5, obsY: 250, obsLargura: 200, obsAltura: 35, obsRotacao: 0, obsFontSize: 100,
    quantidadeChapas: 1, espessuraMaterial: 15, tipoMaterial: 'aglomerado',
    plano: 1, etapas: 1
  };
  
  const [abaAtiva, setAbaAtiva] = useState<AbaPrincipal>('projeto');
  const [sidebarVisivel, setSidebarVisivel] = useState(true);
  const [planoCorteAberto, setPlanoCorteAberto] = useState(true);
  const [tempoProducaoAberto, setTempoProducaoAberto] = useState(false);
  const [boletimAberto, setBoletimAberto] = useState(false);
  const [projetoFoiSalvo, setProjetoFoiSalvo] = useState(true); // true = vazio ou carregado/salvo
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>(() => {
    try {
      const saved = localStorage.getItem('layout-impressao-ade');
      if (!saved) return LAYOUT_PADRAO;
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' ? { ...LAYOUT_PADRAO, ...parsed } : LAYOUT_PADRAO;
    } catch {
      return LAYOUT_PADRAO;
    }
  });
  
  // Histórico de impressões
  const [historicoImpressoes, setHistoricoImpressoes] = useState<HistoricoImpressao[]>(() => {
    try {
      const saved = localStorage.getItem('historico-impressoes-ade');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroCatalogoPasta, setFiltroCatalogoPasta] = useState('');
  const [filtroPontuacaoProduto, setFiltroPontuacaoProduto] = useState('');
  const [pontuacoesProdutos, setPontuacoesProdutos] = useState<PontuacaoProduto[]>(() => {
    try {
      const saved = localStorage.getItem('pontuacoes-produtos-ade');
      if (!saved) return PONTUACOES_PRODUTOS_INICIAL;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : PONTUACOES_PRODUTOS_INICIAL;
    } catch {
      return PONTUACOES_PRODUTOS_INICIAL;
    }
  });
  const [editandoPontuacao, setEditandoPontuacao] = useState<{ index: number; nome: string; m2: number } | null>(null);

  const salvarPontuacoesProdutos = () => {
    setEditandoPontuacao(null);
  };
  useEffect(() => {
    try {
      localStorage.setItem('pontuacoes-produtos-ade', JSON.stringify(pontuacoesProdutos));
    } catch {
      // ignora erro de storage
    }
  }, [pontuacoesProdutos]);
  const adicionarOuEditarPontuacao = (index: number = -1) => {
    if (index >= 0) {
      const p = pontuacoesProdutos[index];
      setEditandoPontuacao({ index, nome: p.nome, m2: p.m2 });
    } else {
      setEditandoPontuacao({ index: -1, nome: '', m2: 0 });
    }
  };
  const aplicarEdicaoPontuacao = () => {
    if (!editandoPontuacao) return;
    const { index, nome, m2 } = editandoPontuacao;
    const nomeTrim = nome.trim();
    if (!nomeTrim) return;
    if (index >= 0) {
      setPontuacoesProdutos(prev => prev.map((p, i) => i === index ? { nome: nomeTrim, m2 } : p));
    } else {
      setPontuacoesProdutos(prev => [...prev, { nome: nomeTrim, m2 }]);
    }
    setEditandoPontuacao(null);
  };

  // Calculadora (Boletim)
  const [vendas90d, setVendas90d] = useState<number[]>(() => Array(15).fill(0));
  const [diasValores, setDiasValores] = useState<number[]>(() => Array(15).fill(0));
  const [produtoCaixaIndices, setProdutoCaixaIndices] = useState<(number | null)[]>(() => Array(8).fill(null));
  const [subtotalConfigs, setSubtotalConfigs] = useState<{ produtoCaixaIndex: number; diaIndices: number[] }[]>(() =>
    Array(5).fill(null).map((_, i) => ({ produtoCaixaIndex: i % 8, diaIndices: [] }))
  );
  const porDia = vendas90d.map(v => (v || 0) / 90);
  const diaResultados = diasValores.map((d, j) => (d || 0) * (porDia[j] || 0));

  // Tabela dos Dias (ano, pontuação por dia do mês)
  const MESES_BR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const getDiasNoMes = (ano: number, mes: number) => new Date(ano, mes, 0).getDate();
  const [anoTabelaDias, setAnoTabelaDias] = useState(2025);
  const [mesResumoDias, setMesResumoDias] = useState<number>(0); // 0 = todos, 1-12 = mês específico
  const [tabelaDiasPontuacoes, setTabelaDiasPontuacoes] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('tabela-dias-pontuacoes-ade');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const getPontuacaoTabela = (ano: number, mes: number, dia: number) => tabelaDiasPontuacoes[`${ano}-${mes}-${dia}`] ?? 0;
  const setPontuacaoTabela = (ano: number, mes: number, dia: number, valor: number) => {
    setTabelaDiasPontuacoes(prev => {
      const key = `${ano}-${mes}-${dia}`;
      const next = { ...prev };
      next[key] = valor;
      return next;
    });
  };
  useEffect(() => {
    try { localStorage.setItem('tabela-dias-pontuacoes-ade', JSON.stringify(tabelaDiasPontuacoes)); } catch {}
  }, [tabelaDiasPontuacoes]);

  const resumoDiasAnoSelecionado = useMemo(() => {
    const linhas: { data: string; dia: number; mes: number; pontos: number }[] = [];
    let totalPontos = 0;
    Object.entries(tabelaDiasPontuacoes).forEach(([key, valorBruto]) => {
      const valor = Number(valorBruto) || 0;
      if (!valor) return;
      const [anoStr, mesStr, diaStr] = key.split('-');
      const ano = Number(anoStr);
      const mes = Number(mesStr);
      const dia = Number(diaStr);
      if (ano !== anoTabelaDias) return;
      if (mesResumoDias && mes !== mesResumoDias) return;
      linhas.push({
        data: `${String(dia).padStart(2, '0')}/${MESES_BR[mes - 1].toLowerCase()}`,
        dia,
        mes,
        pontos: valor,
      });
      totalPontos += valor;
    });
    linhas.sort((a, b) => {
      if (a.mes === b.mes) return a.dia - b.dia;
      return a.mes - b.mes;
    });
    return {
      linhas,
      totalDias: linhas.length,
      totalPontos,
    };
  }, [tabelaDiasPontuacoes, anoTabelaDias, mesResumoDias]);

  // Dados do gráfico: soma por mês, últimos 13 meses
  const dadosGrafico13Meses = useMemo(() => {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth() + 1;
    const somaPorMes: Record<string, number> = {};
    Object.entries(tabelaDiasPontuacoes).forEach(([key, val]) => {
      const [a, m] = key.split('-').map(Number);
      const k = `${a}-${String(m).padStart(2, '0')}`;
      somaPorMes[k] = (somaPorMes[k] ?? 0) + (val || 0);
    });
    const resultado: { mes: string; mesAno: string; pontuacao: number }[] = [];
    for (let i = 12; i >= 0; i--) {
      let a = anoAtual;
      let m = mesAtual - i;
      while (m <= 0) { m += 12; a -= 1; }
      const k = `${a}-${String(m).padStart(2, '0')}`;
      const pontuacao = somaPorMes[k] ?? 0;
      resultado.push({ mes: MESES_BR[m - 1], mesAno: `${MESES_BR[m - 1]}/${a}`, pontuacao });
    }
    return resultado;
  }, [tabelaDiasPontuacoes]);

  const [graficoOrientacaoImpressao, setGraficoOrientacaoImpressao] = useState<'paisagem' | 'retrato'>('paisagem');
  const [graficoTamanho, setGraficoTamanho] = useState({ w: 800, h: 690 });
  const [arrastandoGrafico, setArrastandoGrafico] = useState(false);
  const refGraficoResize = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  const handleGraficoResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setArrastandoGrafico(true);
    refGraficoResize.current = { startX: e.clientX, startY: e.clientY, startW: graficoTamanho.w, startH: graficoTamanho.h };
  };
  useEffect(() => {
    if (!arrastandoGrafico) return;
    const onMove = (e: MouseEvent) => {
      if (!refGraficoResize.current) return;
      const dx = e.clientX - refGraficoResize.current.startX;
      const dy = e.clientY - refGraficoResize.current.startY;
      setGraficoTamanho({
        w: Math.max(400, refGraficoResize.current.startW + dx),
        h: Math.max(300, refGraficoResize.current.startH + dy)
      });
    };
    const onUp = () => { setArrastandoGrafico(false); refGraficoResize.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [arrastandoGrafico]);

  // LOTES - cadastro de produtos por lote
  const [lotesProdutos, setLotesProdutos] = useState<LoteProdutoConfig[]>(() => {
    try {
      const saved = localStorage.getItem('lotes-produtos-ade');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [novoLoteNome, setNovoLoteNome] = useState('');
  const [novoProdutoIndice, setNovoProdutoIndice] = useState<number | ''>('');
  const [novoQtdProdutoLote, setNovoQtdProdutoLote] = useState<number>(0);
  const [novoInicioCorte, setNovoInicioCorte] = useState('');
  const [novoFimEmbalagem, setNovoFimEmbalagem] = useState('');
  const [filtroLotes, setFiltroLotes] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('lotes-produtos-ade', JSON.stringify(lotesProdutos));
    } catch {}
  }, [lotesProdutos]);

  const atualizarTabelaDiasComLotes = (novos: LoteProdutoConfig[]) => {
    const acumulado: Record<string, number> = {};
    const normalizar = (s: string) =>
      s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

    novos.forEach((lp) => {
      if (!lp.dataHoraInicioCorte) return;
      const data = new Date(lp.dataHoraInicioCorte);
      if (isNaN(data.getTime())) return;
      const ano = data.getFullYear();
      const mes = data.getMonth() + 1;
      const dia = data.getDate();

      const alvo = normalizar(lp.produtoNome);
      const produtoRef = pontuacoesProdutos.find(
        (p) => normalizar(p.nome) === alvo
      );
      if (!produtoRef) return;
      const pontos = (produtoRef.m2 || 0) * (lp.qtd || 0);
      const key = `${ano}-${mes}-${dia}`;
      acumulado[key] = (acumulado[key] ?? 0) + pontos;
    });

    if (Object.keys(acumulado).length === 0) return;

    setTabelaDiasPontuacoes((prev) => {
      const next = { ...prev };
      Object.entries(acumulado).forEach(([k, v]) => {
        next[k] = (next[k] ?? 0) + v;
      });
      return next;
    });
  };

  const imprimirGrafico = () => {
    const styleId = 'print-grafico-page-style';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = styleId; document.head.appendChild(styleEl); }
    const isPaisagem = graficoOrientacaoImpressao === 'paisagem';
    const largura = isPaisagem ? 3508 : 2480;
    const altura = isPaisagem ? 2480 : 3508;
    styleEl.textContent = `
      @page { size: A4 ${isPaisagem ? 'landscape' : 'portrait'}; margin: 8mm; }
      @media print {
        body.imprimir-grafico-boletim .area-grafico-impressao .grafico-3d-container {
          width: ${largura}px !important; height: ${altura}px !important;
          min-width: ${largura}px !important; min-height: ${altura}px !important;
        }
      }
    `;
    document.body.classList.add('imprimir-grafico-boletim');
    document.body.classList.add(isPaisagem ? 'grafico-print-paisagem' : 'grafico-print-retrato');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('imprimir-grafico-boletim', 'grafico-print-paisagem', 'grafico-print-retrato');
      }, 100);
    }, 150);
  };

  const onEnterProximaLinha = (e: React.KeyboardEvent, dataGrid: string, row: number, col: number, maxRow: number) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const nextRow = row >= maxRow ? 0 : row + 1;
    const el = document.querySelector(`input[data-grid="${dataGrid}"][data-row="${nextRow}"][data-col="${col}"]`) as HTMLInputElement | null;
    el?.focus();
  };

  const preencherPontuacaoPorNomeTempoCorte = () => {
    const nome = nomeProdutoTempo.trim().toUpperCase();
    if (!nome) return;
    const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    const alvo = normalizar(nome);
    const listaNormalizada = pontuacoesProdutos.map(p => ({
      ...p,
      nomeNorm: normalizar(p.nome),
    }));
    let encontrado = listaNormalizada.find(p => p.nomeNorm === alvo);
    if (!encontrado) {
      encontrado = listaNormalizada.find(p => p.nomeNorm.includes(alvo));
    }
    if (!encontrado) {
      encontrado = listaNormalizada.find(p => alvo.includes(p.nomeNorm));
    }
    if (encontrado) {
      setPontuacaoProduto(encontrado.m2);
      const qtdTotal = lotesProdutos
        .filter(lp => normalizar(lp.produtoNome) === alvo)
        .reduce((s, lp) => s + (lp.qtd || 0), 0);
      if (qtdTotal > 0) {
        setQtdProduto(qtdTotal);
      }
    }
  };
  
  // Relatório de Peças Produzidas
  const [relatorioItens, setRelatorioItens] = useState<RelatorioItem[]>(() => {
    try {
      const saved = localStorage.getItem('relatorio-pecas-ade');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [relatorioCabecalho, setRelatorioCabecalho] = useState({
    lote: '',
    nomeProduto: '',
    tempo: '',
    dataInicio: '',
    dataTermino: ''
  });
  const [sobraMarcados, setSobraMarcados] = useState<Set<string>>(new Set());
  const [sobraItens, setSobraItens] = useState<Array<{ id: string; dataAdicao: string; cabecalho: { lote: string; nomeProduto: string; tempo: string; dataInicio: string; dataTermino: string }; itens: RelatorioItem[] }>>(() => {
    try {
      const saved = localStorage.getItem('sobra-pecas-ade');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  
  // Tempo de Corte
  const [pontuacaoProduto, setPontuacaoProduto] = useState<number>(() => {
    const saved = localStorage.getItem('tempo-corte-pontuacao-ade');
    return saved ? Number(saved) : 0;
  });
  const [qtdProduto, setQtdProduto] = useState<number>(() => {
    const saved = localStorage.getItem('tempo-corte-qtd-ade');
    return saved ? Number(saved) : 0;
  });
  const [pontosDiaTodo, setPontosDiaTodo] = useState<number>(() => {
    const saved = localStorage.getItem('tempo-corte-pontos-ade');
    return saved ? Number(saved) : 0;
  });
  const [tempoDiaTodo, setTempoDiaTodo] = useState<number>(() => {
    const saved = localStorage.getItem('tempo-corte-tempodia-ade');
    return saved ? Number(saved) : 0;
  });
  const [porcentagem, setPorcentagem] = useState<number>(() => {
    const saved = localStorage.getItem('tempo-corte-porcentagem-ade');
    return saved ? Number(saved) : 0;
  });
  const [nomeProdutoTempo, setNomeProdutoTempo] = useState<string>(() => {
    const saved = localStorage.getItem('tempo-corte-nome-ade');
    return saved || '';
  });
  const [tempoProducaoInput, setTempoProducaoInput] = useState<string>('00:00:00');
  const [loteTempoCorte, setLoteTempoCorte] = useState('');
  const [dataHoraInicioExato, setDataHoraInicioExato] = useState('');
  const [dataHoraTerminoExato, setDataHoraTerminoExato] = useState('');
  const [dataHoraInicioProducao, setDataHoraInicioProducao] = useState('');
  const [dataHoraTerminoProducao, setDataHoraTerminoProducao] = useState('');
  const [horarioExtraManha, setHorarioExtraManha] = useState(false);
  const [horarioExtraAlmoco, setHorarioExtraAlmoco] = useState(false);
  const [tempoCorteItens, setTempoCorteItens] = useState<TempoCorteItem[]>(() => {
    try {
      const saved = localStorage.getItem('tempo-corte-itens-ade');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  
  // Cálculos derivados
  // Pontuação da Remessa = Pontos do Dia Todo ÷ Pontuação do Produto
  const pontuacaoRemessaProduzida = pontuacaoProduto > 0 ? pontosDiaTodo / pontuacaoProduto : 0;
  // Para % por peça e tempo cada peça, considerar apenas METROS² (cancelando efeito da QTD)
  const totalMetrosQuadradosAll = tempoCorteItens.reduce(
    (acc, item) => acc + (item.metrosQuadrados || 0),
    0
  );
  const totalMetrosQuadrados = tempoCorteItens
    .filter(i => i.selecionado)
    .reduce((acc, item) => acc + (item.metrosQuadrados || 0), 0);
  // Tempo Exato = (Pontuação da Remessa ÷ Tempo do Dia Todo) = X, depois Qtd de Produto ÷ X
  const x = tempoDiaTodo > 0 ? pontuacaoRemessaProduzida / tempoDiaTodo : 0;
  const tempoExato = x > 0 ? qtdProduto / x : 0; // em minutos (base: todas as peças)
  const tempoExatoSelecionadas = tempoCorteItens.filter(i => i.selecionado).reduce((acc, item) => {
    const metrosConsiderados = (item.metrosQuadrados || 0);
    const porcentagemPorPeca =
      totalMetrosQuadradosAll > 0 && porcentagem > 0
        ? (metrosConsiderados * porcentagem) / totalMetrosQuadradosAll
        : 0;
    const tempoCadaPeca = porcentagem > 0 ? (tempoExato * porcentagemPorPeca) / porcentagem : 0;
    return acc + tempoCadaPeca;
  }, 0);
  
  // Função para converter minutos em HH:MM:SS
  const formatarTempo = (minutos: number) => {
    if (!minutos || minutos <= 0 || isNaN(minutos)) return '00:00:00';
    const totalSegundos = Math.round(minutos * 60);
    const horas = Math.floor(totalSegundos / 3600);
    const mins = Math.floor((totalSegundos % 3600) / 60);
    const segs = totalSegundos % 60;
    return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };
  // Converter HH:MM:SS ou HH:MM para minutos
  const parseTempoToMinutos = (s: string): number => {
    if (!s || typeof s !== 'string') return 0;
    const partes = s.trim().split(/[:h]/i).map(p => parseInt(p, 10) || 0);
    if (partes.length >= 3) return partes[0] * 60 + partes[1] + partes[2] / 60;
    if (partes.length === 2) return partes[0] * 60 + partes[1];
    if (partes.length === 1) return partes[0];
    return 0;
  };
  
  // Produtos salvos de Tempo de Corte
  const [produtosTempoCorteSalvos, setProdutosTempoCorteSalvos] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('produtos-tempo-corte-ade');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  
  // Salvar produtos de tempo de corte no localStorage
  useEffect(() => {
    localStorage.setItem('produtos-tempo-corte-ade', JSON.stringify(produtosTempoCorteSalvos));
  }, [produtosTempoCorteSalvos]);
  
  // Salvar tempo de corte no localStorage
  useEffect(() => {
    localStorage.setItem('tempo-corte-itens-ade', JSON.stringify(tempoCorteItens));
  }, [tempoCorteItens]);
  
  useEffect(() => {
    localStorage.setItem('tempo-corte-pontuacao-ade', String(pontuacaoProduto));
  }, [pontuacaoProduto]);
  
  useEffect(() => {
    localStorage.setItem('tempo-corte-qtd-ade', String(qtdProduto));
  }, [qtdProduto]);
  
  useEffect(() => {
    localStorage.setItem('tempo-corte-pontos-ade', String(pontosDiaTodo));
  }, [pontosDiaTodo]);
  
  useEffect(() => {
    localStorage.setItem('tempo-corte-tempodia-ade', String(tempoDiaTodo));
  }, [tempoDiaTodo]);
  
  useEffect(() => {
    localStorage.setItem('tempo-corte-porcentagem-ade', String(porcentagem));
  }, [porcentagem]);
  
  useEffect(() => {
    localStorage.setItem('tempo-corte-nome-ade', nomeProdutoTempo);
  }, [nomeProdutoTempo]);
  
  // Limpar histórico com mais de 7 dias
  useEffect(() => {
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    const historicoFiltrado = historicoImpressoes.filter(h => new Date(h.dataHora) >= seteDiasAtras);
    if (historicoFiltrado.length !== historicoImpressoes.length) {
      setHistoricoImpressoes(historicoFiltrado);
      localStorage.setItem('historico-impressoes-ade', JSON.stringify(historicoFiltrado));
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('layout-impressao-ade', JSON.stringify(layoutConfig));
  }, [layoutConfig]);
  
  useEffect(() => {
    localStorage.setItem('historico-impressoes-ade', JSON.stringify(historicoImpressoes));
  }, [historicoImpressoes]);
  
  useEffect(() => {
    localStorage.setItem('relatorio-pecas-ade', JSON.stringify(relatorioItens));
  }, [relatorioItens]);

  useEffect(() => {
    localStorage.setItem('sobra-pecas-ade', JSON.stringify(sobraItens));
  }, [sobraItens]);
  
  // Funções do Relatório - NÃO junta peças da mesma medida com material/espessura diferente
  const adicionarAoRelatorio = (impressao: HistoricoImpressao) => {
    const tipoMat = impressao.layoutConfig?.tipoMaterial ?? 'aglomerado';
    const espMat = impressao.layoutConfig?.espessuraMaterial ?? 15;
    const pecasAgrupadas = new Map<string, { menor: number; maior: number; total: number }>();
    
    impressao.grupos.forEach((grupo: any) => {
      const pecasLong = grupo.pecas.filter((p: any) => p.codigo === 3);
      const pecasTrans = grupo.pecas.filter((p: any) => p.codigo !== 3);
      
      pecasLong.forEach((pecaLong: any) => {
        pecasTrans.forEach((pecaTrans: any) => {
          const menor = Math.min(pecaTrans.medida, pecaLong.medida);
          const maior = Math.max(pecaTrans.medida, pecaLong.medida);
          const chave = `${menor}x${maior}-${tipoMat}-${espMat}`;
          const total = pecaTrans.quantidade * pecaLong.quantidade * (impressao.layoutConfig?.quantidadeChapas ?? 1);
          
          if (pecasAgrupadas.has(chave)) {
            pecasAgrupadas.get(chave)!.total += total;
          } else {
            pecasAgrupadas.set(chave, { menor, maior, total });
          }
        });
      });
    });
    
    setRelatorioItens(prev => {
      const novosItens = [...prev];
      
      pecasAgrupadas.forEach((dados) => {
        const existente = novosItens.find(
          item => item.medidaMenor === dados.menor && item.medidaMaior === dados.maior && item.material === tipoMat && item.espessura === espMat
        );
        
        if (existente) {
          existente.quantidade += dados.total;
        } else {
          novosItens.push({
            id: Date.now().toString() + Math.random(),
            corteNumero: novosItens.length + 1,
            nomePeca: impressao.projeto.nomePeca || '',
            quantidade: dados.total,
            medidaMenor: dados.menor,
            medidaMaior: dados.maior,
            material: tipoMat,
            espessura: espMat,
            lote: '',
            inicio: '',
            termino: '',
            observacao: '',
            planoOrigem: impressao.layoutConfig.plano,
            dataInclusao: new Date().toLocaleDateString('pt-BR')
          });
        }
      });
      
      return novosItens;
    });
  };
  
  const moverItemRelatorio = (id: string, direcao: 'cima' | 'baixo') => {
    setRelatorioItens(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index === -1) return prev;
      
      const novosItens = [...prev];
      if (direcao === 'cima' && index > 0) {
        [novosItens[index - 1], novosItens[index]] = [novosItens[index], novosItens[index - 1]];
      } else if (direcao === 'baixo' && index < novosItens.length - 1) {
        [novosItens[index], novosItens[index + 1]] = [novosItens[index + 1], novosItens[index]];
      }
      
      // Atualizar números de corte
      novosItens.forEach((item, i) => {
        item.corteNumero = i + 1;
      });
      
      return novosItens;
    });
  };
  
  const editarItemRelatorio = (id: string, campo: keyof RelatorioItem, valor: any) => {
    setRelatorioItens(prev => prev.map(item => 
      item.id === id ? { ...item, [campo]: valor } : item
    ));
  };
  
  const removerItemRelatorio = (id: string) => {
    setRelatorioItens(prev => {
      const novosItens = prev.filter(item => item.id !== id);
      // Renumerar cortes
      novosItens.forEach((item, i) => {
        item.corteNumero = i + 1;
      });
      return novosItens;
    });
  };
  
  const adicionarLinhaManual = () => {
    setRelatorioItens(prev => [...prev, {
      id: Date.now().toString(),
      corteNumero: prev.length + 1,
      nomePeca: '',
      quantidade: 0,
      medidaMenor: 0,
      medidaMaior: 0,
      material: 'aglomerado',
      espessura: 15,
      lote: '',
      inicio: '',
      termino: '',
      observacao: '',
      planoOrigem: 0,
      dataInclusao: new Date().toLocaleDateString('pt-BR')
    }]);
  };
  
  const limparRelatorio = () => {
    if (confirm('Tem certeza que deseja limpar todo o relatório?')) {
      setRelatorioItens([]);
    }
  };
  
  // Funções do Tempo de Corte
  const adicionarTempoCorteItem = () => {
    setTempoCorteItens(prev => [...prev, {
      id: Date.now().toString(),
      numero: prev.length + 1,
      descricao: '',
      qtd: 0,
      medida: '',
      metrosQuadrados: 0,
      material: '',
      selecionado: true
    }]);
  };
  
  const editarTempoCorteItem = (id: string, campo: keyof TempoCorteItem, valor: any) => {
    setTempoCorteItens(prev => prev.map(item => 
      item.id === id ? { ...item, [campo]: valor } : item
    ));
  };
  
  const removerTempoCorteItem = (id: string) => {
    setTempoCorteItens(prev => {
      const novosItens = prev.filter(item => item.id !== id);
      return novosItens.map((item, i) => ({ ...item, numero: i + 1 }));
    });
  };
  
  const limparTempoCorte = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados de tempo de corte?')) {
      setTempoCorteItens([]);
      setPontuacaoProduto(0);
      setQtdProduto(0);
      setPontosDiaTodo(0);
      setTempoDiaTodo(0);
      setPorcentagem(0);
      setNomeProdutoTempo('');
      setTempoProducaoInput('00:00:00');
      setLoteTempoCorte('');
      setDataHoraInicioExato('');
      setDataHoraTerminoExato('');
      setDataHoraInicioProducao('');
      setDataHoraTerminoProducao('');
      setHorarioExtraManha(false);
      setHorarioExtraAlmoco(false);
    }
  };
  
  const gerarProdutoTempoCorte = () => {
    if (!nomeProdutoTempo.trim()) {
      alert('Por favor, preencha o nome do produto antes de gerar.');
      return;
    }
    
    const tempoProducaoMin = parseTempoToMinutos(tempoProducaoInput);
    
    const produto = {
      id: Date.now().toString(),
      nome: nomeProdutoTempo,
      pontuacaoProduto,
      qtdProduto,
      pontosDiaTodo,
      tempoDiaTodo,
      porcentagem,
      itens: tempoCorteItens,
      tempoExato: tempoExatoSelecionadas,
      tempoProducaoMinutos: tempoProducaoMin,
      lote: loteTempoCorte,
      dataHoraInicioExato,
      dataHoraTerminoExato,
      dataHoraInicioProducao,
      dataHoraTerminoProducao,
      horarioExtraManha,
      horarioExtraAlmoco,
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
      dataCriacaoISO: new Date().toISOString()
    };
    
    setProdutosTempoCorteSalvos(prev => {
      const existente = prev.find(p => p.nome.toLowerCase() === nomeProdutoTempo.toLowerCase());
      if (existente) {
        return prev.map(p => p.id === existente.id ? produto : p);
      }
      return [...prev, produto];
    });
    
    alert(`Produto "${nomeProdutoTempo}" salvo com sucesso!`);
  };
  
  const carregarProdutoTempoCorte = (produto: any) => {
    setNomeProdutoTempo(produto.nome);
    setPontuacaoProduto(produto.pontuacaoProduto);
    setQtdProduto(produto.qtdProduto);
    setPontosDiaTodo(produto.pontosDiaTodo);
    setTempoDiaTodo(produto.tempoDiaTodo);
    setPorcentagem(produto.porcentagem);
    setTempoCorteItens(produto.itens);
    setTempoProducaoInput(produto.tempoProducaoMinutos != null ? formatarTempo(produto.tempoProducaoMinutos) : '00:00:00');
    setLoteTempoCorte(produto.lote ?? '');
    setDataHoraInicioExato(produto.dataHoraInicioExato ?? '');
    setDataHoraTerminoExato(produto.dataHoraTerminoExato ?? '');
    setDataHoraInicioProducao(produto.dataHoraInicioProducao ?? '');
    setDataHoraTerminoProducao(produto.dataHoraTerminoProducao ?? '');
    setHorarioExtraManha(produto.horarioExtraManha ?? false);
    setHorarioExtraAlmoco(produto.horarioExtraAlmoco ?? false);
  };
  
  const removerProdutoTempoCorteSalvo = (id: string) => {
    if (confirm('Deseja remover este produto salvo?')) {
      setProdutosTempoCorteSalvos(prev => prev.filter(p => p.id !== id));
    }
  };

  const importarExcelTempoCorte = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });
        if (!json || !Array.isArray(json) || json.length < 2) { alert('Planilha vazia ou sem cabeçalho.'); return; }
        const row0 = json[0];
        if (!row0 || !Array.isArray(row0)) { alert('Cabeçalho inválido.'); return; }
        const header = row0.map((h: unknown) => String(h != null ? h : '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
        const safe = (s: string) => (typeof s === 'string' ? s : '');
        let descIdx = header.findIndex(h => safe(h).includes('descri') || safe(h) === 'descricao'); if (descIdx < 0) descIdx = 1;
        let qtdIdx = header.findIndex(h => safe(h) === 'qtd' || safe(h).includes('quant') || safe(h) === 'quantidade'); if (qtdIdx < 0) qtdIdx = 2;
        let medIdx = header.findIndex(h => safe(h).includes('medida')); if (medIdx < 0) medIdx = 3;
        let m2Idx = header.findIndex(h => safe(h).includes('metro') || safe(h).includes('m2') || safe(h).includes('m²')); if (m2Idx < 0) m2Idx = 4;
        let matIdx = header.findIndex(h => safe(h).includes('material')); if (matIdx < 0) matIdx = 5;
        const novos: TempoCorteItem[] = [];
        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (!row || !Array.isArray(row)) continue;
          const desc = String(row[descIdx] != null ? row[descIdx] : '').trim();
          const qtd = Number(row[qtdIdx]) || 0;
          const med = String(row[medIdx] != null ? row[medIdx] : '').trim();
          const m2 = Number(row[m2Idx]) || 0;
          const mat = String(row[matIdx] != null ? row[matIdx] : '').trim().toUpperCase();
          if (!desc && !qtd && !med && !m2 && !mat) continue;
          novos.push({
            id: crypto.randomUUID(),
            numero: novos.length + 1,
            descricao: desc,
            qtd,
            medida: med,
            metrosQuadrados: m2,
            material: mat,
            selecionado: true
          });
        }
        const ordenados = [...novos].sort((a, b) => ordemMaterialSort(a.material, b.material));
        ordenados.forEach((item, i) => { item.numero = i + 1; });
        setTempoCorteItens(prev => [...prev, ...ordenados]);
        alert(`${ordenados.length} linhas importadas e ordenadas por material.`);
      } catch (err) {
        alert('Erro ao ler o arquivo Excel: ' + (err as Error).message);
      }
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };
  
   const imprimirTempoCorte = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Tempo de Corte - ${nomeProdutoTempo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 10mm; background: #fff; }
    @page { size: A4 landscape; margin: 10mm; }
    .cabecalho { text-align: center; margin-bottom: 5mm; border-bottom: 2px solid #000; padding-bottom: 3mm; }
    .cabecalho h1 { font-size: 18pt; }
    .produto-nome { font-size: 14pt; font-weight: bold; margin-top: 2mm; }
    .caixas { display: flex; flex-wrap: wrap; gap: 2mm; margin-bottom: 5mm; justify-content: center; }
    .caixa { border: 1px solid #000; padding: 2mm; text-align: center; min-width: 38mm; }
    .caixa label { display: block; font-size: 7pt; font-weight: bold; text-transform: uppercase; margin-bottom: 1mm; }
    .caixa .valor { font-size: 11pt; font-weight: bold; }
    .caixa-destaque { background: #eee; border: 2px solid #000; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #000; padding: 1.5mm; text-align: center; font-size: 9pt; }
    th { background: #ddd; font-weight: bold; }
    .ocultar-impressao { display: none !important; }
    .rodape { margin-top: 5mm; display: flex; justify-content: flex-end; }
    .total-final { border: 2px solid #000; padding: 3mm; text-align: center; min-width: 70mm; }
    .total-final label { font-size: 9pt; font-weight: bold; display: block; }
    .total-final .valor { font-size: 16pt; font-weight: bold; }
  </style>
</head>
<body>
  <div class="cabecalho">
    <h1>RELATÓRIO: TEMPO DE CORTE</h1>
    <div class="produto-nome">PRODUTO: ${nomeProdutoTempo || 'AVULSO'}</div>
  </div>
  <div class="caixas">
    <div class="caixa"><label>PONTOS PRODUTO</label><div class="valor">${pontuacaoProduto}</div></div>
    <div class="caixa"><label>QTD PRODUTO</label><div class="valor">${qtdProduto}</div></div>
    <div class="caixa"><label>PONTOS DIA TODO</label><div class="valor">${pontosDiaTodo}</div></div>
    <div class="caixa caixa-destaque"><label>TEMPO DIA TODO</label><div class="valor">${formatarTempo(tempoDiaTodo)}</div></div>
    <div class="caixa"><label>PORCENTAGEM</label><div class="valor">${porcentagem}%</div></div>
    <div class="caixa caixa-destaque"><label>TEMPO EXATO</label><div class="valor">${formatarTempo(tempoExatoSelecionadas)}</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Nº</th>
        <th>DESCRIÇÃO</th>
        <th>QTD</th>
        <th>MEDIDA</th>
        <th>M²</th>
        <th>MATERIAL</th>
        <th>TEMPO ESTIMADO</th>
      </tr>
    </thead>
    <tbody>
      ${tempoCorteItens.map(item => {
        const percPeca =
          totalMetrosQuadradosAll > 0 && porcentagem > 0
            ? ((item.metrosQuadrados || 0) * porcentagem) / totalMetrosQuadradosAll
            : 0;
        const tempoItem = porcentagem > 0 ? (tempoExato * percPeca) / porcentagem : 0;
        return `
          <tr class="${item.selecionado ? '' : 'ocultar-impressao'}">
            <td>${item.numero}</td>
            <td>${item.descricao || '-'}</td>
            <td>${item.qtd}</td>
            <td>${item.medida}</td>
            <td>${item.metrosQuadrados.toFixed(4)}</td>
            <td>${item.material || 'NÃO INFORMADO'}</td>
            <td>${formatarTempo(tempoItem)}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>
  <div class="rodape">
    <div class="total-final">
      <label>TEMPO TOTAL POR CADA PEÇA (selecionadas)</label>
      <div class="valor">${formatarTempo(tempoExatoSelecionadas)}</div>
    </div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };
  
  const toggleSobraMarcado = (id: string) => {
    setSobraMarcados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const imprimirRelatorio = () => {
    const itensParaImprimir = relatorioItens.filter(i => !sobraMarcados.has(i.id));
    const itensParaSobra = relatorioItens.filter(i => sobraMarcados.has(i.id));

    if (itensParaSobra.length > 0) {
      const entrada: { id: string; dataAdicao: string; cabecalho: { lote: string; nomeProduto: string; tempo: string; dataInicio: string; dataTermino: string }; itens: RelatorioItem[] } = {
        id: Date.now().toString(),
        dataAdicao: new Date().toISOString(),
        cabecalho: { ...relatorioCabecalho },
        itens: itensParaSobra
      };
      setSobraItens(prev => [...prev, entrada]);
      setRelatorioItens(prev => {
        const novos = prev.filter(i => !sobraMarcados.has(i.id));
        novos.forEach((item, i) => { item.corteNumero = i + 1; });
        return novos;
      });
      setSobraMarcados(new Set());
    }

    const itensNoPrint = itensParaImprimir;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório de Peças Produzidas</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 10mm; }
    
    @page { size: A4 landscape; margin: 10mm; }
    
    .cabecalho { text-align: center; margin-bottom: 5mm; }
    .cabecalho h1 { font-size: 14pt; margin-bottom: 2mm; }
    .cabecalho .info { display: flex; justify-content: space-between; font-size: 10pt; }
    .cabecalho .info div { border: 1px solid #000; padding: 2mm 5mm; text-align: left; }
    .cabecalho .info .produto { flex: 2; margin: 0 3mm; }
    .cabecalho .info .lote, .cabecalho .info .tempo { flex: 1; }
    .cabecalho .info strong { margin-right: 3mm; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 3mm; }
    th, td { border: 1px solid #000; padding: 2mm; text-align: center; font-size: 9pt; }
    th { background: #e2e8f0; font-weight: bold; text-transform: uppercase; }
    .col-manual { background: #f9f9f9; min-width: 20mm; }
    .material { min-width: 30mm; text-transform: uppercase; }
    
    .rodape { margin-top: 5mm; display: flex; justify-content: space-between; font-size: 9pt; }
  </style>
</head>
<body>
  <div class="cabecalho">
    <h1>RELATÓRIO DE PEÇAS PRODUZIDAS</h1>
    <div class="info">
      <div class="lote"><strong>LOTE</strong> ${relatorioCabecalho.lote || '____________'}</div>
      <div class="produto"><strong>PRODUTO</strong> ${relatorioCabecalho.nomeProduto || '____________'}</div>
      <div class="tempo"><strong>TEMPO</strong> ${relatorioCabecalho.tempo || '____________'}</div>
    </div>
    <div class="info" style="margin-top: 3mm;">
      <div class="lote"><strong>DATA DE INÍCIO</strong> ${relatorioCabecalho.dataInicio || '____/____/______'}</div>
      <div class="lote"><strong>DATA DE TÉRMINO</strong> ${relatorioCabecalho.dataTermino || '____/____/______'}</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th style="width: 12mm;">CORTE</th>
        <th style="width: 35mm;">PEÇA</th>
        <th style="width: 15mm;">QTD</th>
        <th style="width: 25mm;">MEDIDA</th>
        <th class="material">MATERIAL</th>
        <th class="col-manual">INÍCIO</th>
        <th class="col-manual">TÉRMINO</th>
        <th class="col-manual">OBS</th>
      </tr>
    </thead>
    <tbody>
      ${itensNoPrint.map(item => `
        <tr>
          <td>${item.corteNumero}º</td>
          <td>${item.nomePeca || '-'}</td>
          <td>${item.quantidade}</td>
          <td>${item.medidaMenor}×${item.medidaMaior}</td>
          <td class="material">${item.material === 'mdf' ? 'MDF' : 'AGLO'} - ${item.espessura}MM</td>
          <td class="col-manual">${item.inicio || ''}</td>
          <td class="col-manual">${item.termino || ''}</td>
          <td class="col-manual">${item.observacao || ''}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="rodape">
    <span>Data: ${new Date().toLocaleDateString('pt-BR')}</span>
  </div>
</body>
</html>`;
    
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 300);
    }
  };
  
  const [novaPeca, setNovaPeca] = useState({ codigo: 3 as EixoCodigo, medida: 0, quantidade: 1 });
  const [novoItemProducao, setNovoItemProducao] = useState({ medidaLongitudinal: 0, medidaTransversal: 0, quantidadeNecessaria: 1 });
  const [rotacaoFolha, setRotacaoFolha] = useState(0);
  
  const girarFolha = () => setRotacaoFolha((prev) => (prev + 90) % 360);
  
  const resultado = calcularConsumo();
  const { chapas: chapasNecessarias } = calcularChapasNecessarias();
  
  const handleAdicionar = () => { if (novaPeca.medida > 0 && novaPeca.quantidade > 0) { adicionarPeca(novaPeca); setProjetoFoiSalvo(false); setNovaPeca({ codigo: 3, medida: 0, quantidade: 1 }); } };
  const handleAdicionarProducao = () => { if (novoItemProducao.medidaLongitudinal > 0 && novoItemProducao.medidaTransversal > 0 && novoItemProducao.quantidadeNecessaria > 0) { adicionarItemProducao({ ...novoItemProducao, nome: '', pecaSalvaId: '' }); setNovoItemProducao({ medidaLongitudinal: 0, medidaTransversal: 0, quantidadeNecessaria: 1 }); } };
  const handleSalvarProjeto = () => {
    if (pecas.length === 0 || !projeto.nomeProduto) return;
    const duplicado = projetosSalvos.some(p => 
      p.nomeProduto.trim().toLowerCase() === projeto.nomeProduto.trim().toLowerCase() && 
      (p.nomePeca || '').trim().toLowerCase() === (projeto.nomePeca || '').trim().toLowerCase()
    );
    if (duplicado && !confirm('Já existe um projeto com este Nome do Produto e Nome da Peça. Deseja mesmo assim salvar (duplicar)?')) return;
    salvarProjeto();
    setProjetoFoiSalvo(true);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleAdicionar(); };
  const resetLayout = () => setLayoutConfig(LAYOUT_PADRAO);
  
  // Reset completo do projeto
  const resetProjeto = () => {
    const temConteudo = pecas.length > 0 || projeto.nomeProduto.trim() || projeto.nomePeca.trim();
    const msg = !projetoFoiSalvo && temConteudo 
      ? 'Seu projeto ainda não foi salvo. Tem certeza que deseja apagá-lo?' 
      : 'Tem certeza que deseja resetar todo o projeto? Esta ação não pode ser desfeita.';
    if (!confirm(msg)) return;
      // Limpar peças
      pecas.forEach(p => removerPeca(p.id));
      // Limpar produção
      limparProducao();
      // Resetar projeto
      setProjeto({ nomeProduto: '', nomePeca: '' });
      // Resetar layout
      setLayoutConfig(LAYOUT_PADRAO);
      // Resetar rotação
      setRotacaoFolha(0);
      setProjetoFoiSalvo(true);
  };
  
  // Carregar do histórico
  const carregarDoHistorico = (item: HistoricoImpressao) => {
    // Garantir layoutConfig válido (itens antigos podem ter estrutura incompleta)
    const layoutMerged = item.layoutConfig ? { ...LAYOUT_PADRAO, ...item.layoutConfig } : LAYOUT_PADRAO;
    setLayoutConfig(layoutMerged);
    setProjeto(item.projeto);
    setConfiguracao(item.configuracao);
    restaurarPecas(item.pecas);
    setProjetoFoiSalvo(true);
    setAbaAtiva('projeto');
  };
  
  // Deletar item do histórico
  const deletarDoHistorico = (id: string) => {
    setHistoricoImpressoes(prev => prev.filter(h => h.id !== id));
  };
  
    // Função de impressão - LAYOUT FIXO E PRECISO
  const imprimir = () => {
    // Calcular peças visuais
    const pecasVisuais: { x: number; y: number; width: number; height: number; medidaTrans: number; medidaLong: number; codigo: number }[] = [];
    let offsetXGlobal = 0;
    
    resultado.grupos.forEach(grupo => {
      const pecasLong = grupo.pecas.filter(p => p.codigo === 3);
      const pecasTrans = grupo.pecas.filter(p => p.codigo !== 3);
      if (pecasLong.length === 0) return;
      let offsetXGrupo = offsetXGlobal;
      
      pecasLong.forEach(pecaLong => {
        for (let l = 0; l < pecaLong.quantidade; l++) {
          let offsetY = 0;
          pecasTrans.forEach(pecaTrans => {
            for (let t = 0; t < pecaTrans.quantidade; t++) {
              pecasVisuais.push({
                x: offsetXGrupo, y: offsetY,
                width: pecaLong.medida, height: pecaTrans.medida,
                medidaTrans: pecaTrans.medida, medidaLong: pecaLong.medida,
                codigo: pecaTrans.codigo
              });
              offsetY += pecaTrans.medida + configuracao.espessuraSerra;
            }
          });
          offsetXGrupo += pecaLong.medida + configuracao.espessuraSerra;
        }
      });
      offsetXGlobal = offsetXGrupo;
    });
    
    const todasPecas = resultado.grupos.flatMap(g => g.pecas);
    
    // AGRUPAR PEÇAS POR MEDIDA (normalizado: menor x maior)
    const pecasAgrupadas = new Map<string, { menor: number; maior: number; total: number }>();
    
    pecasVisuais.forEach(p => {
      const menor = Math.min(p.medidaTrans, p.medidaLong);
      const maior = Math.max(p.medidaTrans, p.medidaLong);
      const chave = `${menor}x${maior}`;
      
      if (pecasAgrupadas.has(chave)) {
        pecasAgrupadas.get(chave)!.total += 1;
      } else {
        pecasAgrupadas.set(chave, { menor, maior, total: 1 });
      }
    });
    
    // Converter para array e ordenar
    const listaPecasAgrupadas = Array.from(pecasAgrupadas.entries()).map(([chave, dados]) => ({
      chave,
      ...dados,
      totalGeral: dados.total * layoutConfig.quantidadeChapas
    }));
    
    // Dimensões para A4 paisagem = 297mm x 210mm
    // Área útil: 260mm x 180mm
    
    const margem = 30; // mm (3cm)
    const deslocamentoDireita = 15; // mm (1.5cm) - mover desenho e info para direita
    const recuoInfoDireita = 15; // mm (1.5cm) - recuar informações da direita para esquerda
    const desenhoW = 190; // mm
    const infoW = 60; // mm (6cm)
    const cabecalhoH = 25; // mm (aumentado para fonte maior)
    const obsH = 20; // mm (2cm)
    
    // Fontes do layoutConfig (em percentual)
    const fonteDesenho = layoutConfig.fontSize || 100;
    const fonteInfo = layoutConfig.fontSizeInfo || 100;
    const fonteObs = layoutConfig.obsFontSize || 100;
    
    // Calcular escala para o desenho caber (180mm - 25mm cabeçalho - 20mm obs - 5mm margens = 130mm)
    const desenhoH = 130; // mm
    const scale = Math.min(desenhoW / configuracao.comprimentoTotal, desenhoH / configuracao.larguraTotal);
    
    // Gerar SVG com texto seguindo a linha maior e fonte editável
    const svgRects = pecasVisuais.map(p => {
      const fill = p.codigo === 3 ? '#bbf7d0' : '#bfdbfe';
      const stroke = p.codigo === 3 ? '#22c55e' : '#3b82f6';
      
      // Desenho deitado: trocar x/y
      const drawX = p.y * scale;
      const drawY = p.x * scale;
      const drawW = Math.max(p.height * scale, 1);
      const drawH = Math.max(p.width * scale, 1);
      
      // Texto segue a linha maior da peça
      const isHorizontal = drawW >= drawH;
      const baseFontSize = Math.max(5, Math.min(Math.min(drawW, drawH) / 4, 8));
      const fontSize = baseFontSize * (fonteDesenho / 100); // aplica percentual
      const texto = `${p.medidaTrans}×${p.medidaLong}`;
      
      if (isHorizontal) {
        // Texto horizontal (segue a largura)
        return `<rect x="${drawX}" y="${drawY}" width="${drawW}" height="${drawH}" fill="${fill}" stroke="${stroke}" stroke-width="0.5"/>
<text x="${drawX + drawW/2}" y="${drawY + drawH/2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="${fontSize}" font-weight="bold" fill="#333">${texto}</text>`;
      } else {
        // Texto vertical (segue a altura) - rotacionar -90 graus
        return `<rect x="${drawX}" y="${drawY}" width="${drawW}" height="${drawH}" fill="${fill}" stroke="${stroke}" stroke-width="0.5"/>
<text x="${drawX + drawW/2}" y="${drawY + drawH/2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="${fontSize}" font-weight="bold" fill="#333" transform="rotate(-90 ${drawX + drawW/2} ${drawY + drawH/2})">${texto}</text>`;
      }
    }).join('\n');
    
    const svgWidth = configuracao.comprimentoTotal * scale;
    const svgHeight = configuracao.larguraTotal * scale;
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Plano de Corte</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    
    @page { size: A4 landscape; margin: ${margem}mm; }
    
    .pagina { 
      width: 260mm; 
      height: 180mm;
      display: flex;
      flex-direction: column;
    }
    
    .cabecalho {
      border-bottom: 2px solid #334155;
      padding-bottom: 2mm;
      margin-bottom: 2mm;
    }
    .cabecalho h1 { font-size: 16pt; }
    .cabecalho p { font-size: 11pt; margin: 0.5mm 0; }
    .cabecalho .info-direita { margin-left: -${recuoInfoDireita}mm; }
    
    .conteudo {
      display: flex;
      gap: 4mm;
      margin-left: ${deslocamentoDireita}mm;
    }
    
    .desenho {
      width: ${desenhoW}mm;
      height: ${desenhoH}mm;
      background: #fef9c3;
      border: 1px solid #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    
    .informacoes {
      width: ${infoW}mm;
      border: 1px solid #000;
      padding: 2mm;
    }
    .informacoes h4 { font-size: ${10 * fonteInfo / 100}pt; border-bottom: 1px solid #ccc; padding-bottom: 1mm; margin-bottom: 1mm; }
    .informacoes table { width: 100%; border-collapse: collapse; font-size: ${8 * fonteInfo / 100}pt; }
    .informacoes th, .informacoes td { border: 1px solid #000; padding: 0.5mm; text-align: center; }
    .informacoes th { background: #e2e8f0; }
    .informacoes .total { font-size: ${8 * fonteInfo / 100}pt; margin-top: 2mm; }
    .informacoes .total p { margin: 0.3mm 0; font-size: ${8 * fonteInfo / 100}pt; }
    
    .observacoes {
      margin-top: 2mm;
      height: ${obsH}mm;
      background: #fef3c7;
      border: 1px solid #f59e0b;
      padding: 1.5mm;
      overflow: hidden;
    }
    .observacoes h5 { font-size: ${9 * fonteObs / 100}pt; margin-bottom: 0.5mm; }
    .observacoes p { font-size: ${8 * fonteObs / 100}pt; }
    
    .code-3 { background: #bbf7d0; }
    .code-4 { background: #bfdbfe; }
  </style>
</head>
<body>
  <div class="pagina">
    <div class="cabecalho">
      <div style="display: flex; justify-content: space-between;">
        <div>
          <h1>Planos de Corte Ade</h1>
          <p><strong>Peça:</strong> ${projeto.nomePeca || '-'}</p>
          <p><strong>Produto:</strong> ${projeto.nomeProduto || '-'}</p>
        </div>
        <div style="text-align: center;">
          <p style="font-size: 14pt; font-weight: bold;">Plano: ${layoutConfig.plano || 1}</p>
          <p style="font-size: 14pt; font-weight: bold;">Etapa: ${layoutConfig.etapas || 1}</p>
        </div>
        <div class="info-direita" style="text-align: right;">
          <p><strong>Chapa:</strong> ${configuracao.larguraTotal} × ${configuracao.comprimentoTotal} mm</p>
          <p><strong>Material:</strong> ${layoutConfig.tipoMaterial === 'mdf' ? 'MDF' : 'Aglomerado'} ${layoutConfig.espessuraMaterial}mm</p>
          <p><strong>Qtd Chapas:</strong> ${layoutConfig.quantidadeChapas} | <strong>Serra:</strong> ${configuracao.espessuraSerra}mm</p>
          <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
    </div>
    
    <div class="conteudo">
      <div class="desenho">
        <svg width="${svgWidth}mm" height="${svgHeight}mm" viewBox="0 0 ${svgWidth} ${svgHeight}">
          ${svgRects}
        </svg>
      </div>
      <div class="informacoes">
        <h4>Lista de Peças</h4>
        <table>
          <thead><tr><th>Cód</th><th>Medida</th><th>Qtd</th></tr></thead>
          <tbody>
            ${todasPecas.map(p => `<tr><td class="${p.codigo === 3 ? 'code-3' : 'code-4'}">${p.codigo}</td><td>${p.medida}</td><td>${p.quantidade}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="total">
          <p style="font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 0.5mm; margin-bottom: 0.5mm;">Total por Peça (${layoutConfig.quantidadeChapas} chapas):</p>
          ${listaPecasAgrupadas.map(p => `<p>${p.menor}×${p.maior}: <strong>${p.totalGeral}</strong> peças</p>`).join('')}
        </div>
      </div>
    </div>
    
    ${layoutConfig.observacoes ? `<div class="observacoes"><h5>Observações:</h5><p>${layoutConfig.observacoes}</p></div>` : ''}
  </div>
</body>
</html>`;
    
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 300);
    }
    
    const novoHistorico: HistoricoImpressao = {
      id: Date.now().toString(),
      data: new Date().toLocaleDateString('pt-BR'),
      dataHora: new Date().toISOString(),
      projeto: { ...projeto },
      configuracao: { ...configuracao },
      layoutConfig: { ...layoutConfig },
      pecas: [...pecas],
      grupos: [...resultado.grupos]
    };
    
    // Histórico: perguntar se já existir impressão com mesmo nomeProduto e nomePeca
    const existenteHistorico = historicoImpressoes.find(h =>
      (h.projeto.nomeProduto || '').trim().toLowerCase() === (projeto.nomeProduto || '').trim().toLowerCase() &&
      (h.projeto.nomePeca || '').trim().toLowerCase() === (projeto.nomePeca || '').trim().toLowerCase()
    );
    if (existenteHistorico) {
      if (!confirm('Já existe uma impressão no histórico com este Nome do Produto e Nome da Peça. Deseja substituir?')) return;
      setHistoricoImpressoes(prev => [novoHistorico, ...prev.filter(h => h.id !== existenteHistorico.id)]);
    } else {
      setHistoricoImpressoes(prev => [novoHistorico, ...prev]);
    }
    
    adicionarAoRelatorio(novoHistorico);
  };
  
  return (
  <div className="flex h-screen bg-slate-100 overflow-hidden relative">
    {/* --- 1. BARRA LATERAL (SIDEBAR) --- */}
    <aside className={`flex-shrink-0 bg-slate-900 text-white flex flex-col shadow-xl print:hidden transition-all duration-300 overflow-hidden ${sidebarVisivel ? 'w-64 p-4' : 'w-0 min-w-0 p-0'}`}>
      <div className="flex items-center gap-3 px-2 mb-8 border-b border-slate-800 pb-5">
        <Calculator className="w-8 h-8 text-indigo-400" />
        <div>
          <h1 className="text-lg font-bold leading-tight">Sistema Ade</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Planos de Corte</p>
        </div>
      </div>
      
      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar">
        {/* Seção Plano de Corte (primeiro acesso) */}
        <div>
          <button 
            onClick={() => setPlanoCorteAberto(!planoCorteAberto)} 
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-bold text-indigo-300 hover:bg-slate-800/50 transition-all"
          >
            <span className="text-sm uppercase tracking-wide">Plano de Corte</span>
            {planoCorteAberto ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {planoCorteAberto && (
            <div className="ml-2 mt-1 flex flex-col gap-0.5">
              {[
                { id: 'projeto', icon: Save, label: 'Projeto' },
                { id: 'catalogo', icon: Database, label: 'Catálogo' },
                { id: 'historico', icon: History, label: 'Histórico' },
                { id: 'relatorio', icon: FileText, label: 'Relatório' },
                { id: 'sobra', icon: Package, label: 'Sobra' }
              ].map(aba => (
                <button 
                  key={aba.id} 
                  onClick={() => setAbaAtiva(aba.id as AbaPrincipal)} 
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all ${
                    abaAtiva === aba.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <aba.icon className="w-4 h-4" />
                  <span className="text-sm">{aba.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Seção Tempo de Produção */}
        <div className="mt-2">
          <button 
            onClick={() => setTempoProducaoAberto(!tempoProducaoAberto)} 
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-bold text-indigo-300 hover:bg-slate-800/50 transition-all"
          >
            <span className="text-sm uppercase tracking-wide">Tempo de Produção</span>
            {tempoProducaoAberto ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {tempoProducaoAberto && (
            <div className="ml-2 mt-1 flex flex-col gap-0.5">
              <button 
                onClick={() => setAbaAtiva('tempoCorte')} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all ${
                  abaAtiva === 'tempoCorte' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="text-sm">Tempo de Corte</span>
              </button>
              <button 
                onClick={() => setAbaAtiva('lotes')} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all ${
                  abaAtiva === 'lotes' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="text-sm">Lotes</span>
              </button>
              <button 
                onClick={() => setAbaAtiva('analiseTempo')} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all ${
                  abaAtiva === 'analiseTempo' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">Análise de Tempo</span>
              </button>
            </div>
          )}
        </div>
        {/* Seção Boletim */}
        <div className="mt-2">
          <button 
            onClick={() => setBoletimAberto(!boletimAberto)} 
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-bold text-indigo-300 hover:bg-slate-800/50 transition-all"
          >
            <span className="text-sm uppercase tracking-wide">Boletim</span>
            {boletimAberto ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {boletimAberto && (
            <div className="ml-2 mt-1 flex flex-col gap-0.5">
              {[
                { id: 'boletimPontuacao', icon: ClipboardList, label: 'Pontuação dos Produtos' },
                { id: 'boletimCalculadora', icon: Calculator, label: 'Calculadora' },
                { id: 'boletimTabelaDias', icon: Table, label: 'Tabela dos Dias' },
                { id: 'boletimResumoDias', icon: Calendar, label: 'Resumo dos Dias' },
                { id: 'boletimGrafico', icon: TrendingUp, label: 'Gráfico' },
              ].map(aba => (
                <button 
                  key={aba.id} 
                  onClick={() => setAbaAtiva(aba.id as AbaPrincipal)} 
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all ${
                    abaAtiva === aba.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <aba.icon className="w-4 h-4" />
                  <span className="text-sm">{aba.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
      
      <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 text-center opacity-40">
        YOUWARE v1.0
      </div>
    </aside>

    {/* Botão para ocultar/mostrar sidebar */}
    <button
      onClick={() => setSidebarVisivel(!sidebarVisivel)}
      className={`fixed top-4 z-50 p-2 rounded-lg shadow-lg bg-slate-800 hover:bg-slate-700 text-white transition-all print:hidden ${sidebarVisivel ? 'left-[15rem]' : 'left-2'}`}
      title={sidebarVisivel ? 'Ocultar menu' : 'Mostrar menu'}
    >
      {sidebarVisivel ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
    </button>

    {/* --- 2. ÁREA DE CONTEÚDO (LADO DIREITO) --- */}
    <main className="flex-1 overflow-auto bg-slate-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {/* --- ABA PROJETO --- */}
        {abaAtiva === 'projeto' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome do Produto *</label>
                <input type="text" value={projeto.nomeProduto} onChange={(e) => { setProjeto({ nomeProduto: e.target.value }); setProjetoFoiSalvo(false); }} placeholder="Ex: Cômoda 6 Gavetas" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome da Peça</label>
                <input type="text" value={projeto.nomePeca} onChange={(e) => { setProjeto({ nomePeca: e.target.value }); setProjetoFoiSalvo(false); }} placeholder="Ex: Frente de Gaveta" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex gap-2 mb-6">
              <button onClick={handleSalvarProjeto} disabled={pecas.length === 0 || !projeto.nomeProduto} className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"><Save className="w-5 h-5" />Salvar Projeto no Catálogo</button>
              <button onClick={resetProjeto} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"><RotateCcw className="w-5 h-5" />Resetar Projeto</button>
            </div>
            {/* Configurações (ex-aba Configuração) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h4 className="font-semibold text-slate-700 flex items-center gap-2"><Calculator className="w-4 h-4" />Configurações da Chapa</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div><label className="block text-sm font-medium text-slate-600 mb-1">Largura Total (mm)</label><input type="number" value={configuracao.larguraTotal} onChange={(e) => setConfiguracao({ larguraTotal: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-lg font-semibold text-center" /></div>
                <div><label className="block text-sm font-medium text-slate-600 mb-1">Comprimento Total (mm)</label><input type="number" value={configuracao.comprimentoTotal} onChange={(e) => setConfiguracao({ comprimentoTotal: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-lg font-semibold text-center" /></div>
                <div><label className="block text-sm font-medium text-slate-600 mb-1">Espessura da Serra (mm)</label><input type="number" value={configuracao.espessuraSerra} onChange={(e) => setConfiguracao({ espessuraSerra: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-lg font-semibold text-center" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-purple-700 mb-1">Observações (impressão)</label>
                  <textarea
                    value={layoutConfig.observacoes}
                    onChange={(e) => setLayoutConfig({ ...layoutConfig, observacoes: e.target.value })}
                    placeholder="Digite observações que serão impressas no plano de corte..."
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded h-16 resize-vertical"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs text-slate-600">Posição X (mm)</label>
                  <input
                    type="number"
                    value={layoutConfig.obsX}
                    onChange={(e) => setLayoutConfig({ ...layoutConfig, obsX: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-xs border rounded"
                  />
                  <label className="block text-xs text-slate-600 mt-1">Posição Y (mm)</label>
                  <input
                    type="number"
                    value={layoutConfig.obsY}
                    onChange={(e) => setLayoutConfig({ ...layoutConfig, obsY: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-xs border rounded"
                  />
                  <label className="block text-xs text-slate-600 mt-1">Largura (mm)</label>
                  <input
                    type="number"
                    value={layoutConfig.obsLargura}
                    onChange={(e) => setLayoutConfig({ ...layoutConfig, obsLargura: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-xs border rounded"
                  />
                  <label className="block text-xs text-slate-600 mt-1">Fonte Obs (%)</label>
                  <input
                    type="number"
                    value={layoutConfig.obsFontSize}
                    onChange={(e) => setLayoutConfig({ ...layoutConfig, obsFontSize: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-xs border rounded"
                  />
                  <label className="block text-xs text-slate-600 mt-1">
                    Fonte lista de peças (%)<span className="block text-[10px] text-slate-500">Afeta apenas a lista impressa</span>
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={200}
                    value={layoutConfig.fontSizeInfo}
                    onChange={(e) =>
                      setLayoutConfig({
                        ...layoutConfig,
                        fontSizeInfo: Math.max(10, Number(e.target.value) || 0),
                      })
                    }
                    className="w-full px-2 py-1 text-xs border rounded"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200 mb-4">
                <div><label className="block text-sm font-medium text-indigo-700 mb-1">Plano (1-100)</label>
                  <select value={layoutConfig.plano} onChange={(e) => setLayoutConfig({...layoutConfig, plano: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-indigo-300 text-lg font-semibold text-center bg-white">
                    {Array.from({length: 100}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-indigo-700 mb-1">Etapas (1-10)</label>
                  <select value={layoutConfig.etapas} onChange={(e) => setLayoutConfig({...layoutConfig, etapas: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-indigo-300 text-lg font-semibold text-center bg-white">
                    {Array.from({length: 10}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-rose-50 rounded-lg border border-rose-200">
                <div><label className="block text-sm font-medium text-rose-700 mb-1">Quantidade de Chapas</label>
                  <input type="number" value={layoutConfig.quantidadeChapas} onChange={(e) => setLayoutConfig({...layoutConfig, quantidadeChapas: Math.max(1, Number(e.target.value))})} min={1} className="w-full px-4 py-3 rounded-xl border border-rose-300 text-lg font-semibold text-center text-rose-800 bg-white" />
                </div>
                <div><label className="block text-sm font-medium text-rose-700 mb-1">Tipo de Material</label>
                  <select value={layoutConfig.tipoMaterial} onChange={(e) => setLayoutConfig({...layoutConfig, tipoMaterial: e.target.value as 'aglomerado' | 'mdf'})} className="w-full px-4 py-3 rounded-xl border border-rose-300 text-lg font-semibold text-center text-rose-800 bg-white">
                    <option value="aglomerado">Aglomerado</option>
                    <option value="mdf">MDF</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-rose-700 mb-1">Espessura (mm)</label>
                  <select value={layoutConfig.espessuraMaterial} onChange={(e) => setLayoutConfig({...layoutConfig, espessuraMaterial: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-rose-300 text-lg font-semibold text-center text-rose-800 bg-white">
                    <option value={6}>6mm</option>
                    <option value={9}>9mm</option>
                    <option value={12}>12mm</option>
                    <option value={15}>15mm</option>
                    <option value={18}>18mm</option>
                    <option value={25}>25mm</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

            
            {abaAtiva === 'catalogo' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2"><FolderOpen className="w-5 h-5" />Projetos Salvos ({projetosSalvos.length})</h3>
                {projetosSalvos.length === 0 ? <p className="text-slate-400 text-center py-8">Nenhum projeto salvo ainda.</p> : (
                  (() => {
                    const pastaDe = (nomeProduto: string) => {
                      const base = (nomeProduto || '').trim().replace(/\s+\d+(?:[.,]\d+)?$/, '').trim();
                      return base || nomeProduto || 'Outros';
                    };
                    const porPasta = new Map<string, typeof projetosSalvos>();
                    projetosSalvos.forEach(proj => {
                      const pasta = pastaDe(proj.nomeProduto);
                      if (!porPasta.has(pasta)) porPasta.set(pasta, []);
                      porPasta.get(pasta)!.push(proj);
                    });
                    let pastas = Array.from(porPasta.entries()).sort((a, b) => a[0].localeCompare(b[0]));
                    const f = (filtroCatalogoPasta || '').trim().toLowerCase();
                    if (f) pastas = pastas.filter(([pasta]) => pasta.toLowerCase().includes(f));
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-slate-600">Buscar pasta:</label>
                          <input type="text" value={filtroCatalogoPasta} onChange={(e) => setFiltroCatalogoPasta(e.target.value)} placeholder="Ex: NICHO ASPEN" className="flex-1 max-w-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        {pastas.map(([pasta, projs]) => (
                          <div key={pasta} className="border-2 border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-100 px-4 py-2 font-semibold text-slate-700 flex items-center gap-2">
                              <FolderOpen className="w-4 h-4" />{pasta} ({projs.length})
                            </div>
                            <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {projs.map(proj => (
                                <div key={proj.id} className="p-4 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 transition-all">
                                  <div className="flex justify-between items-start mb-2"><div><p className="font-bold text-slate-800">{proj.nomeProduto}</p>{proj.nomePeca && <p className="text-sm text-slate-500">{proj.nomePeca}</p>}</div><button onClick={() => removerProjetoSalvo(proj.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></div>
                                  <p className="text-xs text-slate-400 mb-2">{proj.dataCriacao} • {proj.pecas.length} cortes</p>
                                  <button onClick={() => { carregarProjeto(proj.id); setProjetoFoiSalvo(true); setAbaAtiva('projeto'); }} className="w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"><FolderOpen className="w-4 h-4" />Carregar</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            )}
            
            {abaAtiva === 'tempoCorte' && (
              <div className="space-y-6">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2"><Clock className="w-5 h-5" />TEMPO DE CORTE</h3>
                
                {/* Nome do Produto */}
                <div className="bg-indigo-50 p-4 rounded-xl flex flex-col md:flex-row md:items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-indigo-700 mb-2">PRODUTO</label>
                    <input
                      type="text"
                      value={nomeProdutoTempo}
                      onChange={(e) => setNomeProdutoTempo(e.target.value.toUpperCase())}
                      placeholder="DIGITE O NOME DO PRODUTO"
                      className="w-full px-4 py-3 rounded-lg border border-indigo-300 font-bold uppercase"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={preencherPontuacaoPorNomeTempoCorte}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm"
                  >
                    Buscar pontuação no Boletim
                  </button>
                </div>
                
                {/* Caixas de entrada */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-slate-50 rounded-xl">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">PONTUAÇÃO DO PRODUTO¹</label>
                    <input type="number" value={pontuacaoProduto} onChange={(e) => setPontuacaoProduto(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-center font-bold" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">QTD DE PRODUTO²</label>
                    <input type="number" value={qtdProduto} onChange={(e) => setQtdProduto(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-center font-bold" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">PONTOS DO DIA TODO³</label>
                    <input type="number" value={pontosDiaTodo} onChange={(e) => setPontosDiaTodo(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-center font-bold" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">TEMPO DO DIA TODO⁴</label>
                    <input type="number" value={tempoDiaTodo} onChange={(e) => setTempoDiaTodo(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-center font-bold" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">PORCENTAGEM⁵</label>
                    <input type="number" value={porcentagem} onChange={(e) => setPorcentagem(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-center font-bold" />
                  </div>
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <label className="block text-sm font-medium text-indigo-700 mb-1">PONTUAÇÃO DA REMESSA⁶</label>
                    <p className="text-2xl font-bold text-indigo-800 text-center">{pontuacaoRemessaProduzida.toFixed(2)}</p>
                  </div>
                {/* NOVO CAMPO DE TEMPO EXATO EM HORAS */}
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <label className="block text-sm font-medium text-blue-700 mb-1">TEMPO EXATO⁷ (selecionadas)</label>
                    <p className="text-2xl font-bold text-blue-800 text-center">{formatarTempo(tempoExatoSelecionadas)}</p>
                  </div>
                </div>
                
                {/* Horários de trabalho - Legenda */}
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-300 text-xs">
                  <p className="font-semibold text-slate-700 mb-1">Horários contados: 07:00-11:00 e 12:12-17:00</p>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={horarioExtraManha} onChange={(e) => setHorarioExtraManha(e.target.checked)} />
                      <span>Incluir 05:00-07:00</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={horarioExtraAlmoco} onChange={(e) => setHorarioExtraAlmoco(e.target.checked)} />
                      <span>Incluir 11:00-12:12</span>
                    </label>
                  </div>
                </div>
                {/* Linha 1: Tempo Exato + LOTE + Data/Hora Início e Término (Planejado) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-green-100 p-3 rounded-xl border-2 border-green-300">
                    <label className="block text-xs font-medium text-green-700 mb-1">TEMPO EXATO⁷ (selecionadas)</label>
                    <p className="text-xl font-bold text-green-800">{formatarTempo(tempoExatoSelecionadas)}</p>
                  </div>
                  <div className="bg-slate-100 p-3 rounded-xl border-2 border-slate-300">
                    <label className="block text-xs font-medium text-slate-700 mb-1">LOTE</label>
                    <input type="text" value={loteTempoCorte} onChange={(e) => setLoteTempoCorte(e.target.value)} placeholder="Ex: 001" className="w-full px-2 py-1.5 rounded border border-slate-400 text-sm font-semibold uppercase" />
                  </div>
                  <div className="bg-green-50 p-3 rounded-xl border-2 border-green-200">
                    <label className="block text-xs font-medium text-green-700 mb-1">Data/Hora Início (Planejado)</label>
                    <input type="datetime-local" value={dataHoraInicioExato} onChange={(e) => setDataHoraInicioExato(e.target.value)} className="w-full px-2 py-1.5 rounded border border-green-400 text-sm" />
                  </div>
                  <div className="bg-green-50 p-3 rounded-xl border-2 border-green-200">
                    <label className="block text-xs font-medium text-green-700 mb-1">Data/Hora Término (Planejado)</label>
                    <input type="datetime-local" value={dataHoraTerminoExato} onChange={(e) => setDataHoraTerminoExato(e.target.value)} className="w-full px-2 py-1.5 rounded border border-green-400 text-sm" />
                  </div>
                </div>
                {/* Linha 2: Tempo Produção + Data/Hora Início e Término (Produção) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-amber-50 p-3 rounded-xl border-2 border-amber-300">
                    <label className="block text-xs font-medium text-amber-800 mb-1">TEMPO DA PRODUÇÃO</label>
                    <input
                      type="text"
                      value={tempoProducaoInput}
                      onChange={(e) => setTempoProducaoInput(e.target.value)}
                      placeholder="00:00:00"
                      className="w-24 px-2 py-1.5 rounded-lg border-2 border-amber-500 text-center font-bold text-amber-900"
                    />
                  </div>
                  <div className="md:col-span-1" />
                  <div className="bg-amber-50 p-3 rounded-xl border-2 border-amber-200">
                    <label className="block text-xs font-medium text-amber-700 mb-1">Data/Hora Início (Produção)</label>
                    <input type="datetime-local" value={dataHoraInicioProducao} onChange={(e) => setDataHoraInicioProducao(e.target.value)} className="w-full px-2 py-1.5 rounded border border-amber-400 text-sm" />
                  </div>
                  <div className="bg-amber-50 p-3 rounded-xl border-2 border-amber-200">
                    <label className="block text-xs font-medium text-amber-700 mb-1">Data/Hora Término (Produção)</label>
                    <input type="datetime-local" value={dataHoraTerminoProducao} onChange={(e) => setDataHoraTerminoProducao(e.target.value)} className="w-full px-2 py-1.5 rounded border border-amber-400 text-sm" />
                  </div>
                </div>
                
                {/* Importar Excel */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Importar Excel
                    <input type="file" accept=".xlsx,.xls" onChange={importarExcelTempoCorte} className="hidden" />
                  </label>
                  <span className="text-xs text-slate-500">Colunas: Nº, DESCRIÇÃO, QTD, MEDIDA, METROS², MATERIAL. Após importar, itens são ordenados por material.</span>
                </div>
                {/* Tabela */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-300">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-2 py-2 text-center font-medium text-sm border">✓</th>
                        <th className="px-2 py-2 text-center font-medium text-sm border">Nº</th>
                        <th className="px-2 py-2 text-center font-medium text-sm border">DESCRIÇÃO</th>
                        <th className="px-2 py-2 text-center font-medium text-sm border">QTD</th>
                        <th className="px-2 py-2 text-center font-medium text-sm border">MEDIDA</th>
                        <th className="px-2 py-2 text-center font-medium text-sm border">METROS²</th>
                        <th className="px-2 py-2 text-center font-medium text-sm border">MATERIAL</th>
                        <th className="px-2 py-2 text-center font-medium text-sm border bg-yellow-100">% POR PEÇA</th>
                        <th className="px-2 py-2 text-center font-medium text-sm border bg-blue-100">TEMPO CADA PEÇA⁸</th>
                        <th className="px-2 py-2 text-center font-medium text-sm border">AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tempoCorteItens.map((item, index) => {
                        const metrosConsiderados = (item.metrosQuadrados || 0);
                        const porcentagemPorPeca =
                          totalMetrosQuadradosAll > 0 && porcentagem > 0
                            ? (metrosConsiderados * porcentagem) / totalMetrosQuadradosAll
                            : 0;
                        const tempoCadaPeca =
                          porcentagem > 0 ? (tempoExato * porcentagemPorPeca) / porcentagem : 0;
                        
                        return (
                          <tr key={item.id} className={`hover:bg-slate-50 ${item.selecionado ? 'bg-green-50' : 'print:hidden'}`}>
                            <td className="px-2 py-2 text-center border">
                              <input type="checkbox" checked={item.selecionado} onChange={(e) => editarTempoCorteItem(item.id, 'selecionado', e.target.checked)} className="w-5 h-5 cursor-pointer" />
                            </td>
                            <td className="px-2 py-2 text-center border font-bold">{index + 1}</td>
                            <td className="px-2 py-2 border"><input type="text" value={item.descricao} onChange={(e) => editarTempoCorteItem(item.id, 'descricao', e.target.value)} className="w-full px-1 py-1 text-sm border rounded uppercase" /></td>
                            <td className="px-2 py-2 border"><input type="number" value={item.qtd} onChange={(e) => editarTempoCorteItem(item.id, 'qtd', Number(e.target.value))} className="w-full px-1 py-1 text-sm border rounded text-center" /></td>
                            <td className="px-2 py-2 border"><input type="text" value={item.medida} onChange={(e) => editarTempoCorteItem(item.id, 'medida', e.target.value)} className="w-full px-1 py-1 text-sm border rounded text-center uppercase" /></td>
                            <td className="px-2 py-2 border"><input type="number" step="0.01" value={item.metrosQuadrados} onChange={(e) => editarTempoCorteItem(item.id, 'metrosQuadrados', Number(e.target.value))} className="w-full px-1 py-1 text-sm border rounded text-center" /></td>
                            <td className="px-2 py-2 border"><input type="text" value={item.material} onChange={(e) => editarTempoCorteItem(item.id, 'material', e.target.value)} className="w-full px-1 py-1 text-sm border rounded text-center uppercase" /></td>
                            <td className="px-2 py-2 text-center border bg-yellow-50 font-bold">{porcentagemPorPeca.toFixed(2)}%</td>
                            <td className="px-2 py-2 text-center border bg-blue-50 font-bold">{formatarTempo(tempoCadaPeca)}</td>
                            <td className="px-2 py-2 text-center border">
                              <button onClick={() => removerTempoCorteItem(item.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Totais */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-indigo-100 p-4 rounded-xl">
                    <p className="text-sm text-indigo-600">TOTAL METROS²</p>
                    <p className="text-3xl font-bold text-indigo-800">{totalMetrosQuadrados.toFixed(4)}</p>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-xl">
                    <p className="text-sm text-blue-600">TOTAL TEMPO CADA PEÇA (selecionadas)</p>
                    <p className="text-3xl font-bold text-blue-800">{formatarTempo(tempoCorteItens.filter(i => i.selecionado).reduce((acc, item) => {
                      const metrosConsiderados = (item.metrosQuadrados || 0);
                      const porcentagemPorPeca =
                        totalMetrosQuadradosAll > 0 && porcentagem > 0
                          ? (metrosConsiderados * porcentagem) / totalMetrosQuadradosAll
                          : 0;
                      const tempoCadaPeca =
                        porcentagem > 0 ? (tempoExato * porcentagemPorPeca) / porcentagem : 0;
                      return acc + tempoCadaPeca;
                    }, 0))}</p>
                  </div>
                  <div className="flex gap-2 items-end">
                    <button onClick={adicionarTempoCorteItem} className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"><Plus className="w-4 h-4" />ADICIONAR LINHA</button>
                    <button onClick={gerarProdutoTempoCorte} className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"><Save className="w-4 h-4" />GERAR</button>
                    <button onClick={imprimirTempoCorte} className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"><Printer className="w-4 h-4" />IMPRIMIR</button>
                    <button onClick={limparTempoCorte} className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                
                {/* Produtos Salvos */}
                {produtosTempoCorteSalvos.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-semibold text-slate-700 mb-3">PRODUTOS SALVOS ({produtosTempoCorteSalvos.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {produtosTempoCorteSalvos.map(produto => (
                        <div key={produto.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                          <div className="flex-1">
                            <p className="font-bold text-slate-700 text-sm">{produto.nome}</p>
                            <p className="text-xs text-slate-400">{produto.dataCriacao} • {produto.itens?.length || 0} itens</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => carregarProdutoTempoCorte(produto)} className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700">CARREGAR</button>
                            <button onClick={() => removerProdutoTempoCorteSalvo(produto.id)} className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {abaAtiva === 'analiseTempo' && (
              <AnaliseTempoSection
                produtos={produtosTempoCorteSalvos}
                formatarTempo={formatarTempo}
                removerProduto={removerProdutoTempoCorteSalvo}
              />
            )}
            {abaAtiva === 'lotes' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Lotes de Produção
                </h3>
                <p className="text-sm text-slate-500">
                  Cadastre quais produtos entram em cada lote. Depois, ao informar o nome do produto em Tempo de Corte,
                  a quantidade total será preenchida automaticamente.
                </p>
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Lote</label>
                      <input
                        type="text"
                        value={novoLoteNome}
                        onChange={(e) => setNovoLoteNome(e.target.value.toUpperCase())}
                        placeholder="Ex: LOTE 001"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Produto</label>
                      <select
                        value={novoProdutoIndice === '' ? '' : novoProdutoIndice}
                        onChange={(e) =>
                          setNovoProdutoIndice(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      >
                        <option value="">-- escolher --</option>
                        {pontuacoesProdutos.map((p, idx) => (
                          <option key={idx} value={idx}>
                            {p.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Qtd. no lote</label>
                      <input
                        type="number"
                        value={novoQtdProdutoLote || ''}
                        onChange={(e) => setNovoQtdProdutoLote(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                        min={0}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Início do corte</label>
                      <input
                        type="datetime-local"
                        value={novoInicioCorte}
                        onChange={(e) => setNovoInicioCorte(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Fim da embalagem</label>
                      <input
                        type="datetime-local"
                        value={novoFimEmbalagem}
                        onChange={(e) => setNovoFimEmbalagem(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!novoLoteNome.trim() || novoProdutoIndice === '' || novoQtdProdutoLote <= 0) return;
                        const produtoNome = pontuacoesProdutos[Number(novoProdutoIndice)]?.nome || '';
                        const novoRegistro: LoteProdutoConfig = {
                          id: Date.now().toString(),
                          lote: novoLoteNome.trim().toUpperCase(),
                          produtoNome,
                          qtd: novoQtdProdutoLote,
                          dataHoraInicioCorte: novoInicioCorte || undefined,
                          dataHoraFimEmbalagem: novoFimEmbalagem || undefined,
                        };
                        setLotesProdutos((prev) => [...prev, novoRegistro]);
                        atualizarTabelaDiasComLotes([novoRegistro]);
                        setNovoQtdProdutoLote(0);
                        setNovoInicioCorte('');
                        setNovoFimEmbalagem('');
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg"
                    >
                      Adicionar ao lote
                    </button>
                  </div>
                </div>
                {lotesProdutos.length === 0 ? (
                        <div className="bg-slate-50 rounded-xl p-6 text-center text-slate-500">
                    Nenhum lote cadastrado ainda. Use o formulário acima para adicionar produtos aos lotes.
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                      <h4 className="font-semibold text-slate-700">Lotes cadastrados</h4>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={filtroLotes}
                          onChange={(e) => setFiltroLotes(e.target.value)}
                          placeholder="Filtrar por lote ou produto..."
                          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-3 py-2 text-left border border-slate-200">Lote</th>
                            <th className="px-3 py-2 text-left border border-slate-200">Produto</th>
                            <th className="px-3 py-2 text-right border border-slate-200">Qtd.</th>
                            <th className="px-3 py-2 text-center border border-slate-200">Início Corte</th>
                            <th className="px-3 py-2 text-center border border-slate-200">Fim Embalagem</th>
                            <th className="px-3 py-2 text-center border border-slate-200">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lotesProdutos
                            .filter((lp) => {
                              if (!filtroLotes.trim()) return true;
                              const f = filtroLotes.trim().toLowerCase();
                              return (
                                lp.lote.toLowerCase().includes(f) ||
                                lp.produtoNome.toLowerCase().includes(f)
                              );
                            })
                            .map((lp) => (
                            <tr key={lp.id} className="odd:bg-white even:bg-slate-50">
                              <td className="px-3 py-1.5 border border-slate-100 font-semibold text-slate-800">
                                {lp.lote}
                              </td>
                              <td className="px-3 py-1.5 border border-slate-100 text-slate-700">{lp.produtoNome}</td>
                              <td className="px-3 py-1.5 border border-slate-100 text-right font-semibold">
                                {lp.qtd}
                              </td>
                              <td className="px-3 py-1.5 border border-slate-100 text-center text-xs">
                                {lp.dataHoraInicioCorte
                                  ? new Date(lp.dataHoraInicioCorte).toLocaleString('pt-BR')
                                  : '-'}
                              </td>
                              <td className="px-3 py-1.5 border border-slate-100 text-center text-xs">
                                {lp.dataHoraFimEmbalagem
                                  ? new Date(lp.dataHoraFimEmbalagem).toLocaleString('pt-BR')
                                  : '-'}
                              </td>
                              <td className="px-3 py-1.5 border border-slate-100 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLotesProdutos((prev) => prev.filter((item) => item.id !== lp.id))
                                  }
                                  className="text-red-500 hover:text-red-700 text-xs"
                                >
                                  Remover
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- BOLETIM --- */}
            {abaAtiva === 'boletimPontuacao' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2"><ClipboardList className="w-5 h-5" />Pontuação dos Produtos</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => adicionarOuEditarPontuacao(-1)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm">Adicionar / Editar</button>
                  <button onClick={salvarPontuacoesProdutos} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm">Salvar</button>
                </div>
                {editandoPontuacao && (
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200 flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-indigo-700 mb-1">Produto</label>
                      <input type="text" value={editandoPontuacao.nome} onChange={(e) => setEditandoPontuacao(prev => prev ? { ...prev, nome: e.target.value } : null)} className="w-full px-3 py-2 rounded-lg border border-indigo-300 text-sm" placeholder="Nome do produto" />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium text-indigo-700 mb-1">MT²</label>
                      <input type="number" step="0.01" value={editandoPontuacao.m2 || ''} onChange={(e) => setEditandoPontuacao(prev => prev ? { ...prev, m2: Number(e.target.value) || 0 } : null)} className="w-full px-3 py-2 rounded-lg border border-indigo-300 text-sm" />
                    </div>
                    <button onClick={aplicarEdicaoPontuacao} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm">Aplicar</button>
                    <button onClick={() => setEditandoPontuacao(null)} className="px-4 py-2 bg-slate-400 text-white font-semibold rounded-lg text-sm">Cancelar</button>
                  </div>
                )}
                <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col md:flex-row md:items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Buscar produto</label>
                    <input
                      type="text"
                      value={filtroPontuacaoProduto}
                      onChange={(e) => setFiltroPontuacaoProduto(e.target.value)}
                      placeholder="Digite parte do nome do produto"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div className="text-xs text-slate-500">
                    <p>Total de produtos: <span className="font-semibold text-slate-700">{pontuacoesProdutos.length}</span></p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl border border-slate-200 max-h-[480px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">Produto</th>
                        <th className="px-3 py-2 text-center font-semibold text-slate-700 w-24">MT²</th>
                        <th className="px-3 py-2 text-center font-semibold text-slate-700 w-20">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pontuacoesProdutos.filter(p => {
                        const f = filtroPontuacaoProduto.trim().toLowerCase();
                        if (!f) return true;
                        return p.nome.toLowerCase().includes(f);
                      }).map((p, idx) => (
                        <tr key={p.nome + idx} className="border-t border-slate-200 odd:bg-white even:bg-slate-50">
                          <td className="px-3 py-1.5 whitespace-nowrap text-slate-700">{p.nome}</td>
                          <td className="px-3 py-1.5 text-center font-semibold text-slate-900">{p.m2.toFixed(2)}</td>
                          <td className="px-3 py-1.5 text-center">
                            <button onClick={() => adicionarOuEditarPontuacao(pontuacoesProdutos.indexOf(p))} className="text-indigo-600 hover:underline text-xs">Editar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {abaAtiva === 'boletimCalculadora' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2"><Calculator className="w-5 h-5" />Calculadora</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 px-2 py-1 text-center font-semibold w-28">Vendas em 90 dias</th>
                        <th className="border border-slate-300 px-2 py-1 text-center font-semibold w-24">Vendas por dia</th>
                        <th className="border border-slate-300 px-2 py-1 text-center font-semibold w-12">DIAS</th>
                        {Array.from({ length: 15 }, (_, i) => (
                          <th key={i} className="border border-slate-300 px-1 py-1 text-center font-semibold w-16">Dia {i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-slate-50">
                        <td colSpan={3} className="border border-slate-300 px-2 py-1 text-xs text-slate-500">Valor do dia</td>
                        {Array.from({ length: 15 }, (_, i) => (
                            <td key={i} className="border border-slate-300 p-0">
                            <input type="number" step="0.01" inputMode="decimal" value={diasValores[i] || ''} onChange={(e) => setDiasValores(prev => { const n = [...prev]; n[i] = Number(e.target.value) || 0; return n; })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const next = document.querySelector('input[data-grid="calculadoraVendas"][data-row="0"]') as HTMLInputElement; next?.focus(); } }} data-grid="calculadoraDias" data-row={0} data-col={i} className="input-numerico w-full px-1 py-0.5 text-center text-xs border-0 focus:ring-1 focus:ring-indigo-500" placeholder="Dia" />
                          </td>
                        ))}
                      </tr>
                      {Array.from({ length: 15 }, (_, row) => (
                        <tr key={row}>
                          <td className="border border-slate-300 p-0">
                            <input type="number" step="0.01" inputMode="decimal" value={vendas90d[row] || ''} onChange={(e) => setVendas90d(prev => { const n = [...prev]; n[row] = Number(e.target.value) || 0; return n; })} onKeyDown={(e) => onEnterProximaLinha(e, 'calculadoraVendas', row, 0, 14)} data-grid="calculadoraVendas" data-row={row} data-col={0} className="input-numerico w-full px-1 py-0.5 text-center border-0 focus:ring-1 focus:ring-indigo-500" />
                          </td>
                          <td className="border border-slate-300 px-2 py-1 text-center bg-slate-50 font-medium">{porDia[row]?.toFixed(2) ?? '0.00'}</td>
                          <td className="border border-slate-300 px-1 py-1 text-center bg-slate-50 text-slate-500">{row + 1}</td>
                          {Array.from({ length: 15 }, (_, col) => (
                            <td key={col} className="border border-slate-300 px-1 py-1 text-center bg-slate-50">
                              {row === col ? ((diasValores[col] || 0) * (porDia[col] || 0)).toFixed(2) : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-500">Vendas = editável. Por dia = Vendas / 90. Cada coluna Dia: valor na 1ª linha, resultado (dia × por dia) abaixo. Dia 1 usa por dia linha 1, Dia 2 usa linha 2, etc.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="p-3 bg-white rounded-xl border border-slate-200">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Produto {i + 1}</label>
                      <select value={produtoCaixaIndices[i] ?? ''} onChange={(e) => setProdutoCaixaIndices(prev => { const n = [...prev]; n[i] = e.target.value === '' ? null : Number(e.target.value); return n; })} className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm">
                        <option value="">-- escolher --</option>
                        {pontuacoesProdutos.map((p, idx) => (
                          <option key={idx} value={idx}>{p.nome} (MT²: {p.m2.toFixed(2)})</option>
                        ))}
                      </select>
                      {produtoCaixaIndices[i] != null && (
                        <p className="text-xs text-slate-500 mt-1">MT²: {pontuacoesProdutos[produtoCaixaIndices[i]!]?.m2.toFixed(2)}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {Array.from({ length: 5 }, (_, i) => {
                    const cfg = subtotalConfigs[i];
                    const prodIdx = cfg?.produtoCaixaIndex ?? 0;
                    const prod = produtoCaixaIndices[prodIdx] != null ? pontuacoesProdutos[produtoCaixaIndices[prodIdx]!] : null;
                    const m2 = prod?.m2 ?? 0;
                    const somaDias = (cfg?.diaIndices ?? []).reduce((s, j) => s + diaResultados[j], 0);
                    const subtotal = m2 * somaDias;
                    return (
                      <div key={i} className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                        <h4 className="font-semibold text-indigo-700 mb-2">Sub total {i + 1}</h4>
                        <div className="mb-2">
                          <label className="block text-xs text-indigo-600 mb-1">Produto (caixa 1-8)</label>
                          <select value={cfg?.produtoCaixaIndex ?? 0} onChange={(e) => setSubtotalConfigs(prev => { const n = [...prev]; n[i] = { ...n[i], produtoCaixaIndex: Number(e.target.value), diaIndices: n[i]?.diaIndices ?? [] }; return n; })} className="w-full px-2 py-1 rounded border border-indigo-300 text-sm">
                            {Array.from({ length: 8 }, (_, j) => (
                              <option key={j} value={j}>Caixa {j + 1} {produtoCaixaIndices[j] != null ? `(${pontuacoesProdutos[produtoCaixaIndices[j]!]?.nome})` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-indigo-600 mb-1">Dias a somar (por dia × dia)</label>
                          <div className="flex flex-wrap gap-1">
                            {Array.from({ length: 15 }, (_, j) => (
                              <label key={j} className="flex items-center gap-0.5 text-xs">
                                <input type="checkbox" checked={(cfg?.diaIndices ?? []).includes(j)} onChange={(e) => setSubtotalConfigs(prev => { const n = [...prev]; const diaIndices = n[i]?.diaIndices ?? []; if (e.target.checked) n[i] = { ...n[i], produtoCaixaIndex: n[i]?.produtoCaixaIndex ?? 0, diaIndices: [...diaIndices, j].sort((a,b)=>a-b) }; else n[i] = { ...n[i], produtoCaixaIndex: n[i]?.produtoCaixaIndex ?? 0, diaIndices: diaIndices.filter(x => x !== j) }; return n; })} />
                                D{j + 1}
                              </label>
                            ))}
                          </div>
                        </div>
                        <p className="mt-2 font-bold text-indigo-800">MT² × Soma = {subtotal.toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="p-4 bg-indigo-100 rounded-xl border-2 border-indigo-300">
                  <h4 className="font-bold text-indigo-800 text-lg">Total</h4>
                  <p className="text-xl font-bold text-indigo-900">
                    {Array.from({ length: 5 }, (_, i) => {
                      const cfg = subtotalConfigs[i];
                      const prodIdx = cfg?.produtoCaixaIndex ?? 0;
                      const prod = produtoCaixaIndices[prodIdx] != null ? pontuacoesProdutos[produtoCaixaIndices[prodIdx]!] : null;
                      const m2 = prod?.m2 ?? 0;
                      const somaDias = (cfg?.diaIndices ?? []).reduce((s, j) => s + diaResultados[j], 0);
                      return m2 * somaDias;
                    }).reduce((a, b) => a + b, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
            {abaAtiva === 'boletimTabelaDias' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2"><Table className="w-5 h-5" />Tabela dos Dias</h3>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600">Ano:</span>
                    <select value={anoTabelaDias} onChange={(e) => setAnoTabelaDias(Number(e.target.value))} className="px-3 py-2 rounded-lg border-2 border-cyan-400 bg-cyan-50 text-cyan-900 font-medium text-sm">
                      {Array.from({ length: 21 }, (_, i) => 2025 + i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="overflow-x-auto rounded-xl overflow-hidden shadow-lg border-2 border-cyan-400">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500">
                        <th className="border-2 border-cyan-700 px-2 py-1.5 text-center font-bold text-white sticky left-0 z-10 bg-cyan-600">Dia</th>
                        {MESES_BR.map((nome, mes) => (
                          <th key={mes} className="border-2 border-cyan-700 px-1 py-1.5 text-center font-bold text-white min-w-[72px]">{nome}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 31 }, (_, i) => {
                        const dia = i + 1;
                        const coresLinha = ['bg-amber-50', 'bg-orange-50', 'bg-rose-50', 'bg-pink-50', 'bg-fuchsia-50', 'bg-violet-50', 'bg-indigo-50', 'bg-sky-50', 'bg-cyan-50', 'bg-teal-50'];
                        const cor = coresLinha[i % 10];
                        return (
                          <tr key={dia} className={`hover:bg-yellow-100 ${cor}`}>
                            <td className="border-2 border-cyan-300 px-2 py-1 text-center font-bold text-cyan-900 sticky left-0 bg-inherit z-10">{dia}</td>
                            {MESES_BR.map((_, mes) => {
                              const mesNum = mes + 1;
                              const diasNoMes = getDiasNoMes(anoTabelaDias, mesNum);
                              const coresMes = ['bg-amber-100/50', 'bg-orange-100/50', 'bg-rose-100/50', 'bg-pink-100/50', 'bg-fuchsia-100/50', 'bg-violet-100/50', 'bg-indigo-100/50', 'bg-sky-100/50', 'bg-cyan-100/50', 'bg-teal-100/50', 'bg-emerald-100/50', 'bg-lime-100/50'];
                              if (dia > diasNoMes) return <td key={mes} className={`border-2 border-slate-200 ${coresMes[mes]}`} />;
                              const val = getPontuacaoTabela(anoTabelaDias, mesNum, dia);
                              return (
                                <td key={mes} className={`border-2 border-cyan-200 p-0 ${coresMes[mes]}`}>
                                  <input type="number" step="0.01" inputMode="decimal" value={val || ''} onChange={(e) => setPontuacaoTabela(anoTabelaDias, mesNum, dia, Number(e.target.value) || 0)} onKeyDown={(e) => onEnterProximaLinha(e, 'tabelaDias', dia - 1, mes, 30)} data-grid="tabelaDias" data-row={dia - 1} data-col={mes} className="input-numerico w-full px-1 py-0.5 text-center border-0 focus:ring-2 focus:ring-cyan-400 focus:bg-white min-w-[60px] bg-transparent" />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      <tr className="bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 font-bold text-white">
                        <td className="border-2 border-cyan-800 px-2 py-1.5 text-center sticky left-0 bg-teal-600 z-10">Soma</td>
                        {MESES_BR.map((_, mes) => {
                          const mesNum = mes + 1;
                          const diasNoMes = getDiasNoMes(anoTabelaDias, mesNum);
                          const soma = Array.from({ length: diasNoMes }, (_, i) => getPontuacaoTabela(anoTabelaDias, mesNum, i + 1)).reduce((a, b) => a + b, 0);
                          return <td key={mes} className="border-2 border-cyan-800 px-2 py-1.5 text-center">{soma.toFixed(2)}</td>;
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-500">Calendário do Brasil (Gregoriano). Edite a pontuação de cada dia. A soma de cada mês aparece ao final da coluna.</p>
              </div>
            )}
            {abaAtiva === 'boletimResumoDias' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Resumo dos Dias com Pontuação
                    </h3>
                    <p className="text-sm text-slate-500">
                      Mostra apenas os dias que têm pontuação na Tabela dos Dias, com total de dias e de pontos
                      (estilo planilha).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      document.body.classList.add('imprimir-resumo-dias');
                      window.print();
                      document.body.classList.remove('imprimir-resumo-dias');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm"
                  >
                    <Printer className="w-4 h-4 mr-1 inline-block" /> Imprimir resumo
                  </button>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600">Ano:</span>
                    <select
                      value={anoTabelaDias}
                      onChange={(e) => setAnoTabelaDias(Number(e.target.value))}
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    >
                      {Array.from({ length: 21 }, (_, i) => 2025 + i).map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600">Mês:</span>
                    <select
                      value={mesResumoDias}
                      onChange={(e) => setMesResumoDias(Number(e.target.value))}
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    >
                      <option value={0}>Todos</option>
                      {MESES_BR.map((m, idx) => (
                        <option key={m} value={idx + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {resumoDiasAnoSelecionado.linhas.length === 0 ? (
                  <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-500">
                    Nenhum dia com pontuação para o filtro selecionado.
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-300 overflow-hidden shadow-sm area-resumo-dias">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-yellow-300">
                        <tr>
                          <th className="px-3 py-2 text-center font-bold text-slate-900 border border-slate-700">
                            DIA
                          </th>
                          <th className="px-3 py-2 text-center font-bold text-slate-900 border border-slate-700">
                            PONTUAÇÃO
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumoDiasAnoSelecionado.linhas.map((linha, idx) => (
                          <tr key={`${linha.data}-${idx}`} className="bg-yellow-50">
                            <td className="px-3 py-1.5 text-center font-semibold text-slate-900 border border-slate-400">
                              {linha.data}
                            </td>
                            <td className="px-3 py-1.5 text-right font-semibold text-slate-900 border border-slate-400">
                              {linha.pontos.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-200">
                          <td className="px-3 py-2 text-center font-bold text-slate-900 border border-slate-700">
                            TOTAL DE DIAS
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900 border border-slate-700">
                            {resumoDiasAnoSelecionado.totalDias}
                          </td>
                        </tr>
                        <tr className="bg-slate-200">
                          <td className="px-3 py-2 text-center font-bold text-slate-900 border border-slate-700">
                            PONTUAÇÃO TOTAL
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900 border border-slate-700">
                            {resumoDiasAnoSelecionado.totalPontos.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {abaAtiva === 'boletimGrafico' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 no-print-grafico">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-2"><TrendingUp className="w-5 h-5" />Gráfico de Pontuação por Mês (3D)</h3>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span>Largura:</span>
                      <input type="number" value={graficoTamanho.w} onChange={(e) => setGraficoTamanho(p => ({ ...p, w: Math.max(400, Number(e.target.value) || 400) }))} className="w-20 px-2 py-1 rounded border border-slate-300 text-center" min={400} />
                      <span>px</span>
                      <button type="button" onClick={() => setGraficoTamanho(p => ({ ...p, w: Math.max(400, p.w - 50) }))} className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 rounded">−</button>
                      <button type="button" onClick={() => setGraficoTamanho(p => ({ ...p, w: p.w + 50 }))} className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 rounded">+</button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span>Altura (eixo Y):</span>
                      <input type="number" value={graficoTamanho.h} onChange={(e) => setGraficoTamanho(p => ({ ...p, h: Math.max(300, Number(e.target.value) || 300) }))} className="w-20 px-2 py-1 rounded border border-slate-300 text-center" min={300} />
                      <span>px</span>
                      <button type="button" onClick={() => setGraficoTamanho(p => ({ ...p, h: Math.max(300, p.h - 50) }))} className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 rounded">−</button>
                      <button type="button" onClick={() => setGraficoTamanho(p => ({ ...p, h: p.h + 50 }))} className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 rounded">+</button>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <span>Orientação:</span>
                      <select value={graficoOrientacaoImpressao} onChange={(e) => setGraficoOrientacaoImpressao(e.target.value as 'paisagem' | 'retrato')} className="px-2 py-1 rounded border border-slate-300">
                        <option value="paisagem">Paisagem (A4)</option>
                        <option value="retrato">Retrato (A4)</option>
                      </select>
                    </label>
                    <button onClick={imprimirGrafico} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-2"><Printer className="w-4 h-4" />Imprimir</button>
                  </div>
                </div>
                <div className="area-grafico-impressao bg-white rounded-xl p-4 border-2 border-slate-200 shadow-lg">
                  <p className="text-sm text-slate-600 mb-2 no-print-grafico">Últimos 13 meses — Ajuste Largura/Altura acima ou arraste o canto</p>
                  <div className="relative grafico-3d-container border-2 border-dashed border-indigo-400 rounded-lg overflow-hidden bg-slate-50" style={{ width: graficoTamanho.w, height: graficoTamanho.h }}>
                    <button type="button" onMouseDown={handleGraficoResizeStart} className="absolute bottom-0 right-0 w-10 h-10 cursor-se-resize flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white rounded-tl-lg z-10 no-print-grafico" title="Arraste para redimensionar">
                      <GripVertical className="w-5 h-5 rotate-90" />
                    </button>
                    <HighchartsReact
                      highcharts={Highcharts}
                      options={{
                        chart: {
                          type: 'column',
                          width: graficoTamanho.w,
                          height: graficoTamanho.h,
                          options3d: { enabled: true, alpha: 10, beta: 0, depth: 60, viewDistance: 30 },
                          style: { fontFamily: 'inherit' }
                        },
                        title: { text: 'Pontuação por Mês', style: { fontSize: '18px' } },
                        xAxis: {
                          categories: dadosGrafico13Meses.map(d => d.mesAno),
                          labels: { style: { fontSize: '11px' }, rotation: -35 }
                        },
                        yAxis: {
                          title: { text: 'Pontuação' },
                          min: 0
                        },
                        plotOptions: {
                          column: {
                            depth: 35,
                            dataLabels: { enabled: true, format: '{y:.1f}', style: { fontWeight: 'bold', textOutline: 'none' } },
                            borderWidth: 2,
                            borderColor: '#1e293b'
                          }
                        },
                        tooltip: { pointFormat: '<b>{point.y:.1f}</b> pt' },
                        series: [{
                          name: 'Pontuação',
                          data: dadosGrafico13Meses.map((d, i) => ({
                            y: d.pontuacao,
                            color: ['#06b6d4', '#0d9488', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#ec4899', '#a855f7', '#6366f1', '#3b82f6', '#0ea5e9'][i % 13]
                          }))
                        }]
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {abaAtiva === 'historico' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2"><History className="w-5 h-5" />Histórico de Impressões (últimos 7 dias)</h3>
                
                {/* Filtro de datas */}
                <div className="flex gap-4 items-end p-4 bg-slate-50 rounded-xl">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Data Início</label>
                    <input type="date" value={filtroDataInicio} onChange={(e) => setFiltroDataInicio(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Data Fim</label>
                    <input type="date" value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300" />
                  </div>
                  <button onClick={() => { setFiltroDataInicio(''); setFiltroDataFim(''); }} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm font-medium">Limpar Filtro</button>
                </div>
                
                {historicoImpressoes.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">Nenhuma impressão registrada nos últimos 7 dias.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {historicoImpressoes
                      .filter(h => {
                        if (!filtroDataInicio && !filtroDataFim) return true;
                        const dataItem = new Date(h.dataHora);
                        if (filtroDataInicio && dataItem < new Date(filtroDataInicio)) return false;
                        if (filtroDataFim && dataItem > new Date(filtroDataFim + 'T23:59:59')) return false;
                        return true;
                      })
                      .map(item => (
                        <div key={item.id} className="p-4 rounded-lg border-2 border-slate-200 bg-white hover:border-indigo-300 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-slate-800">{item.projeto.nomeProduto || 'Sem nome'}</p>
                              {item.projeto.nomePeca && <p className="text-sm text-slate-500">{item.projeto.nomePeca}</p>}
                            </div>
                            <button onClick={() => deletarDoHistorico(item.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                          </div>
                          <p className="text-xs text-slate-400 mb-1">{item.data} • {item.pecas.length} cortes</p>
                          <p className="text-xs text-indigo-600 mb-2">Plano: {item.layoutConfig?.plano ?? 1} | Etapa: {item.layoutConfig?.etapas ?? 1}</p>
                          <button onClick={() => carregarDoHistorico(item)} className="w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"><History className="w-4 h-4" />Carregar</button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
            
            {abaAtiva === 'relatorio' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-2"><FileText className="w-5 h-5" />Relatório de Peças Produzidas</h3>
                  <div className="flex gap-2">
                    <button onClick={imprimirRelatorio} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-2"><Printer className="w-4 h-4" />Imprimir</button>
                    <button onClick={adicionarLinhaManual} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" />Adicionar Linha</button>
                    <button onClick={limparRelatorio} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2"><Trash2 className="w-4 h-4" />Limpar</button>
                  </div>
                </div>
                
                {/* Cabeçalho editável */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-slate-50 rounded-xl">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">LOTE</label>
                    <input type="text" value={relatorioCabecalho.lote} onChange={(e) => setRelatorioCabecalho({...relatorioCabecalho, lote: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300" placeholder="Número do lote" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 mb-1">PRODUTO</label>
                    <input type="text" value={relatorioCabecalho.nomeProduto} onChange={(e) => setRelatorioCabecalho({...relatorioCabecalho, nomeProduto: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300" placeholder="Nome do produto" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">TEMPO</label>
                    <input type="text" value={relatorioCabecalho.tempo} onChange={(e) => setRelatorioCabecalho({...relatorioCabecalho, tempo: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300" placeholder="Tempo" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">DATA DE INÍCIO</label>
                    <input type="text" value={relatorioCabecalho.dataInicio} onChange={(e) => setRelatorioCabecalho({...relatorioCabecalho, dataInicio: e.target.value})} placeholder="____/____/______" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-center" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">DATA DE TÉRMINO</label>
                    <input type="text" value={relatorioCabecalho.dataTermino} onChange={(e) => setRelatorioCabecalho({...relatorioCabecalho, dataTermino: e.target.value})} placeholder="____/____/______" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-center" />
                  </div>
                </div>
                
                {/* Tabela do relatório */}
                {relatorioItens.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">Nenhuma peça no relatório. Imprima planos de corte para adicionar automaticamente.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-300">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-2 py-2 text-center font-medium text-sm border bg-amber-50" title="Marcar como sobra: ao imprimir, peças marcadas vão para aba Sobra e não são impressas">SOBRA</th>
                          <th className="px-3 py-2 text-center font-medium text-sm border">CORTE</th>
                          <th className="px-3 py-2 text-center font-medium text-sm border">PEÇA</th>
                          <th className="px-2 py-2 text-center font-medium text-sm border">QTD</th>
                          <th className="px-2 py-2 text-center font-medium text-sm border">MEDIDA</th>
                          <th className="px-4 py-2 text-center font-medium text-sm border uppercase">MATERIAL</th>
                          <th className="px-2 py-2 text-center font-medium text-sm border bg-yellow-100">INÍCIO</th>
                          <th className="px-2 py-2 text-center font-medium text-sm border bg-yellow-100">TÉRMINO</th>
                          <th className="px-2 py-2 text-center font-medium text-sm border bg-yellow-100">OBS</th>
                          <th className="px-2 py-2 text-center font-medium text-sm border">AÇÕES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatorioItens.map((item, index) => (
                          <tr key={item.id} className={`hover:bg-slate-50 ${sobraMarcados.has(item.id) ? 'bg-amber-50' : ''}`}>
                            <td className="px-2 py-2 text-center border bg-amber-50/50">
                              <label className="flex items-center justify-center gap-1 cursor-pointer" title="Marcar como sobra">
                                <input type="checkbox" checked={sobraMarcados.has(item.id)} onChange={() => toggleSobraMarcado(item.id)} className="w-4 h-4 rounded border-slate-300 text-amber-600" />
                                <span className="text-xs text-amber-700">Sobra</span>
                              </label>
                            </td>
                            <td className="px-2 py-2 text-center border">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-bold">{item.corteNumero}º</span>
                                <div className="flex gap-1">
                                  <button onClick={() => moverItemRelatorio(item.id, 'cima')} disabled={index === 0} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                                  <button onClick={() => moverItemRelatorio(item.id, 'baixo')} disabled={index === relatorioItens.length - 1} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-2 border"><input type="text" value={item.nomePeca} onChange={(e) => editarItemRelatorio(item.id, 'nomePeca', e.target.value)} onKeyDown={(e) => onEnterProximaLinha(e, 'relatorio', index, 1, Math.max(0, relatorioItens.length - 1))} data-grid="relatorio" data-row={index} data-col={1} className="w-full px-1 py-1 text-sm border rounded" /></td>
                            <td className="px-2 py-2 border"><input type="number" value={item.quantidade} onChange={(e) => editarItemRelatorio(item.id, 'quantidade', Number(e.target.value))} onKeyDown={(e) => onEnterProximaLinha(e, 'relatorio', index, 2, Math.max(0, relatorioItens.length - 1))} data-grid="relatorio" data-row={index} data-col={2} className="w-full px-1 py-1 text-sm border rounded text-center font-bold" /></td>
                            <td className="px-2 py-2 border"><input type="text" value={`${item.medidaMenor}×${item.medidaMaior}`} onChange={(e) => {
                              const partes = e.target.value.split(/[×xX]/);
                              if (partes.length === 2) {
                                editarItemRelatorio(item.id, 'medidaMenor', Number(partes[0].trim()) || 0);
                                editarItemRelatorio(item.id, 'medidaMaior', Number(partes[1].trim()) || 0);
                              }
                            }} onKeyDown={(e) => onEnterProximaLinha(e, 'relatorio', index, 3, Math.max(0, relatorioItens.length - 1))} data-grid="relatorio" data-row={index} data-col={3} className="w-full px-1 py-1 text-sm border rounded text-center font-mono" /></td>
                            <td className="px-2 py-2 text-center border text-sm uppercase">{item.material === 'mdf' ? 'MDF' : 'AGLO'} - {item.espessura}MM</td>
                            <td className="px-2 py-2 border bg-yellow-50"><input type="text" value={item.inicio} onChange={(e) => editarItemRelatorio(item.id, 'inicio', e.target.value)} onKeyDown={(e) => onEnterProximaLinha(e, 'relatorio', index, 5, Math.max(0, relatorioItens.length - 1))} data-grid="relatorio" data-row={index} data-col={5} className="w-full px-1 py-1 text-sm border rounded" /></td>
                            <td className="px-2 py-2 border bg-yellow-50"><input type="text" value={item.termino} onChange={(e) => editarItemRelatorio(item.id, 'termino', e.target.value)} onKeyDown={(e) => onEnterProximaLinha(e, 'relatorio', index, 6, Math.max(0, relatorioItens.length - 1))} data-grid="relatorio" data-row={index} data-col={6} className="w-full px-1 py-1 text-sm border rounded" /></td>
                            <td className="px-2 py-2 border bg-yellow-50"><input type="text" value={item.observacao} onChange={(e) => editarItemRelatorio(item.id, 'observacao', e.target.value)} onKeyDown={(e) => onEnterProximaLinha(e, 'relatorio', index, 7, Math.max(0, relatorioItens.length - 1))} data-grid="relatorio" data-row={index} data-col={7} className="w-full px-1 py-1 text-sm border rounded" /></td>
                            <td className="px-2 py-2 text-center border">
                              <button onClick={() => removerItemRelatorio(item.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
              </div>
            )}

            {abaAtiva === 'sobra' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2"><Package className="w-5 h-5" />Peças em Sobra</h3>
                <p className="text-sm text-slate-500">Peças marcadas como sobra ao imprimir o relatório aparecem aqui, com todas as informações do relatório.</p>
                {sobraItens.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">Nenhuma peça em sobra. Marque peças no Relatório e clique em Imprimir para enviá-las aqui.</p>
                ) : (
                  <div className="space-y-4">
                    {sobraItens.map(entrada => (
                      <div key={entrada.id} className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white">
                        <div className="bg-amber-50 px-4 py-3 flex items-center justify-between border-b border-amber-200">
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span><strong>Lote:</strong> {entrada.cabecalho.lote || '-'}</span>
                            <span><strong>Produto:</strong> {entrada.cabecalho.nomeProduto || '-'}</span>
                            <span><strong>Tempo:</strong> {entrada.cabecalho.tempo || '-'}</span>
                            <span><strong>Data início:</strong> {entrada.cabecalho.dataInicio || '-'}</span>
                            <span><strong>Data término:</strong> {entrada.cabecalho.dataTermino || '-'}</span>
                            <span className="text-slate-500">{new Date(entrada.dataAdicao).toLocaleString('pt-BR')}</span>
                          </div>
                          <button onClick={() => setSobraItens(prev => prev.filter(e => e.id !== entrada.id))} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead><tr className="bg-slate-100 text-left text-sm">
                              <th className="px-3 py-2 border">CORTE</th>
                              <th className="px-3 py-2 border">PEÇA</th>
                              <th className="px-2 py-2 border">QTD</th>
                              <th className="px-2 py-2 border">MEDIDA</th>
                              <th className="px-3 py-2 border">MATERIAL</th>
                              <th className="px-2 py-2 border">INÍCIO</th>
                              <th className="px-2 py-2 border">TÉRMINO</th>
                              <th className="px-2 py-2 border">OBS</th>
                            </tr></thead>
                            <tbody>
                              {entrada.itens.map(item => (
                                <tr key={item.id} className="border-b border-slate-100">
                                  <td className="px-3 py-2 font-bold">{item.corteNumero}º</td>
                                  <td className="px-3 py-2">{item.nomePeca || '-'}</td>
                                  <td className="px-2 py-2 text-center font-bold">{item.quantidade}</td>
                                  <td className="px-2 py-2 text-center font-mono">{item.medidaMenor}×{item.medidaMaior}</td>
                                  <td className="px-3 py-2 text-sm uppercase">{item.material === 'mdf' ? 'MDF' : 'AGLO'} - {item.espessura}MM</td>
                                  <td className="px-2 py-2">{item.inicio || ''}</td>
                                  <td className="px-2 py-2">{item.termino || ''}</td>
                                  <td className="px-2 py-2">{item.observacao || ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
        
        {abaAtiva === 'projeto' && (
        <>
        {/* Lançamento de Peças */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2"><span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">1</span>Lançamento de Peças</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div><label className="block text-sm font-medium text-slate-700 mb-2">Código</label><select value={novaPeca.codigo} onChange={(e) => setNovaPeca({ ...novaPeca, codigo: Number(e.target.value) as EixoCodigo })} className={`w-full px-4 py-3 rounded-xl border-2 transition-all text-lg font-semibold cursor-pointer ${novaPeca.codigo === 3 ? 'bg-green-50 border-green-400 text-green-800' : 'bg-blue-50 border-blue-400 text-blue-800'}`}><option value={3}>3 - Longitudinal</option><option value={4}>4 - Transversal</option><option value={44}>44 - Transversal</option></select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-2">Medida (mm)</label><input type="number" value={novaPeca.medida || ''} onChange={(e) => setNovaPeca({ ...novaPeca, medida: Number(e.target.value) })} onKeyDown={handleKeyDown} placeholder="Ex: 1328" className="w-full px-4 py-3 rounded-xl border border-slate-300 text-lg" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-2">Quantidade</label><input type="number" value={novaPeca.quantidade} onChange={(e) => setNovaPeca({ ...novaPeca, quantidade: Number(e.target.value) })} onKeyDown={handleKeyDown} min={1} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-lg" /></div>
            <div className="flex items-end gap-2"><button onClick={handleAdicionar} disabled={novaPeca.medida <= 0 || novaPeca.quantidade <= 0} className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold rounded-xl flex items-center justify-center gap-2"><Plus className="w-5 h-5" />Adicionar</button><button onClick={novoGrupo} title="Novo Grupo" className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl"><Layers className="w-5 h-5" /></button></div>
          </div>
        </div>
        
        {/* Visualização */}
        {resultado.grupos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2"><span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">2</span>Visualização</h2>
              <div className="flex gap-2"><button onClick={girarDesenho} className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg flex items-center gap-2"><RotateCw className="w-4 h-4" />Girar</button><button onClick={imprimir} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-2"><Printer className="w-4 h-4" />Imprimir</button></div>
            </div>
            <VisualizacaoCorte grupos={resultado.grupos} configuracao={configuracao} projeto={projeto} rotacao={rotacaoDesenho} pecasAcabadas={resultado.pecasAcabadas} />
          </div>
        )}
        
        {/* Tabela de Grupos */}
        {resultado.grupos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2"><span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">3</span>Detalhamento por Grupo</h2>
            <div className="space-y-4">{resultado.grupos.map((grupo, grupoIndex) => (
              <div key={grupo.id} className="border-2 border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-3 flex items-center justify-between"><h3 className="font-semibold text-slate-700 flex items-center gap-2"><Layers className="w-4 h-4 text-amber-500" />Grupo {grupoIndex + 1}</h3><div className="flex gap-4 text-sm"><span className={`px-2 py-1 rounded ${(grupo.larguraDisponivel ?? 0) < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>Largura: {(Number(grupo.larguraDisponivel) || 0).toLocaleString('pt-BR')} mm</span><span className={`px-2 py-1 rounded ${(grupo.comprimentoDisponivel ?? 0) < 0 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>Comprimento: {(Number(grupo.comprimentoDisponivel) || 0).toLocaleString('pt-BR')} mm</span></div></div>
                <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-slate-200 bg-slate-50"><th className="text-left py-2 px-3 font-medium text-slate-600 text-sm">#</th><th className="text-center py-2 px-3 font-medium text-slate-600 text-sm">Código</th><th className="text-center py-2 px-3 font-medium text-slate-600 text-sm">Eixo</th><th className="text-center py-2 px-3 font-medium text-slate-600 text-sm">Medida</th><th className="text-center py-2 px-3 font-medium text-slate-600 text-sm">Qtd</th><th className="text-center py-2 px-3 font-medium text-slate-600 text-sm">Consumo</th><th className="text-center py-2 px-3 font-medium text-slate-600 text-sm">Ações</th></tr></thead>
                  <tbody>{grupo.pecas.map((peca, index) => (<tr key={peca.id} className={`border-b border-slate-100 ${getCorCodigo(peca.codigo)}`}><td className="py-2 px-3 font-medium text-sm">{index + 1}</td><td className="py-2 px-3 text-center font-bold text-sm">{peca.codigo}</td><td className="py-2 px-3 text-center text-xs">{getEixoNome(peca.codigo)}</td><td className="py-2 px-3 text-center font-mono text-sm">{peca.medida}</td><td className="py-2 px-3 text-center font-semibold text-sm">{peca.quantidade}</td><td className="py-2 px-3 text-center font-bold font-mono text-sm">{((peca.medida + configuracao.espessuraSerra) * peca.quantidade).toLocaleString('pt-BR')} mm</td><td className="py-2 px-3 text-center"><button onClick={() => removerPeca(peca.id)} className="p-1 text-red-600 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4" /></button></td></tr>))}</tbody>
                </table></div>
              </div>
            ))}</div>
          </div>
        )}
        
        {pecas.length === 0 && <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 text-center py-12 text-slate-400"><Calculator className="w-16 h-16 mx-auto mb-4 opacity-50" /><p className="text-lg">Nenhuma peça lançada ainda</p></div>}
        </>
        )}
        
      </div>
    </main>
  </div>
);
} // Fecha a function CalculadoraCorte
