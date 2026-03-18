import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PecaCorte, ConfiguracaoChapa, EixoCodigo, GrupoCorte, DadosProjeto, ProjetoSalvo, ItemProducao, PecaAcabada } from '../../types/corte';

interface CorteStore {
  // Dados do projeto
  projeto: DadosProjeto;
  setProjeto: (projeto: Partial<DadosProjeto>) => void;
  
  // Configuração da chapa
  configuracao: ConfiguracaoChapa;
  setConfiguracao: (config: Partial<ConfiguracaoChapa>) => void;
  
  // Rotação do desenho
  rotacaoDesenho: number;
  girarDesenho: () => void;
  
  // Peças lançadas
  pecas: PecaCorte[];
  grupoAtualId: string;
  adicionarPeca: (peca: Omit<PecaCorte, 'id' | 'grupoId'>) => void;
  removerPeca: (id: string) => void;
  limparPecas: () => void;
  restaurarPecas: (pecas: Array<Partial<PecaCorte> & Pick<PecaCorte, 'codigo' | 'medida' | 'quantidade'>>) => void;
  novoGrupo: () => void;
  
  // Projetos salvos (catálogo)
  projetosSalvos: ProjetoSalvo[];
  salvarProjeto: () => void;
  carregarProjeto: (id: string) => void;
  removerProjetoSalvo: (id: string) => void;
  
  // Lista de produção
  itensProducao: ItemProducao[];
  adicionarItemProducao: (item: Omit<ItemProducao, 'id' | 'quantidadePorChapa'>) => void;
  removerItemProducao: (id: string) => void;
  limparProducao: () => void;
  calcularChapasNecessarias: () => { chapas: number; detalhes: string };
  
  // Calcular peças acabadas
  calcularPecasAcabadas: () => PecaAcabada[];
  
  // Cálculos
  calcularGrupos: () => GrupoCorte[];
  calcularConsumo: () => {
    totalLargura: number;
    totalComprimento: number;
    sobraLargura: number;
    sobraComprimento: number;
    grupos: GrupoCorte[];
    pecasAcabadas: PecaAcabada[];
  };
}

export const useCorteStore = create<CorteStore>()(
  persist(
    (set, get) => ({
      projeto: {
        nomePeca: '',
        nomeProduto: '',
        dataCriacao: new Date().toLocaleDateString('pt-BR'),
      },
      
      configuracao: {
        larguraTotal: 2200,
        comprimentoTotal: 2750,
        espessuraSerra: 4,
      },
      
      rotacaoDesenho: 0,
      
      pecas: [],
      grupoAtualId: crypto.randomUUID(),
      
      projetosSalvos: [],
      
      itensProducao: [],
      
      setProjeto: (projeto) => set((state) => ({
        projeto: { ...state.projeto, ...projeto }
      })),
      
      setConfiguracao: (config) => set((state) => ({
        configuracao: { ...state.configuracao, ...config }
      })),
      
      girarDesenho: () => set((state) => ({
        rotacaoDesenho: (state.rotacaoDesenho + 90) % 360
      })),
      
      novoGrupo: () => set({ grupoAtualId: crypto.randomUUID() }),
      
      adicionarPeca: (peca) => set((state) => {
        const novoGrupoId = peca.codigo === 3 ? crypto.randomUUID() : state.grupoAtualId;
        return {
          pecas: [...state.pecas, { ...peca, id: crypto.randomUUID(), grupoId: novoGrupoId }],
          grupoAtualId: novoGrupoId
        };
      }),
      
      removerPeca: (id) => set((state) => ({
        pecas: state.pecas.filter(p => p.id !== id)
      })),
      
      limparPecas: () => set({ pecas: [], grupoAtualId: crypto.randomUUID() }),
      
      restaurarPecas: (pecasOriginais) => {
        if (!pecasOriginais || pecasOriginais.length === 0) {
          set({ pecas: [], grupoAtualId: crypto.randomUUID() });
          return;
        }
        const mapaGrupo = new Map<string, string>();
        let grupoAtual = crypto.randomUUID();
        const novasPecas: PecaCorte[] = pecasOriginais.map((p) => {
          const grupoIdAntigo = (p as PecaCorte).grupoId;
          let novoGrupoId: string;
          if (grupoIdAntigo) {
            novoGrupoId = mapaGrupo.get(grupoIdAntigo) ?? (() => {
              const novo = crypto.randomUUID();
              mapaGrupo.set(grupoIdAntigo, novo);
              return novo;
            })();
          } else {
            novoGrupoId = p.codigo === 3 ? (grupoAtual = crypto.randomUUID()) : grupoAtual;
          }
          return {
            id: crypto.randomUUID(),
            codigo: p.codigo,
            medida: p.medida,
            quantidade: p.quantidade,
            grupoId: novoGrupoId,
          };
        });
        set({ pecas: novasPecas, grupoAtualId: novasPecas[novasPecas.length - 1]?.grupoId ?? crypto.randomUUID() });
      },
      
      salvarProjeto: () => {
        const state = get();
        if (state.pecas.length === 0 || !state.projeto.nomeProduto) return;
        
        const novoProjeto: ProjetoSalvo = {
          id: crypto.randomUUID(),
          nomeProduto: state.projeto.nomeProduto,
          nomePeca: state.projeto.nomePeca,
          pecas: [...state.pecas],
          configuracao: { ...state.configuracao },
          dataCriacao: new Date().toLocaleDateString('pt-BR')
        };
        
        set((state) => ({
          projetosSalvos: [...state.projetosSalvos, novoProjeto].sort((a, b) => 
            a.nomeProduto.localeCompare(b.nomeProduto)
          )
        }));
      },
      
      carregarProjeto: (id: string) => {
        const state = get();
        const projeto = state.projetosSalvos.find(p => p.id === id);
        if (!projeto) return;
        
        set({
          pecas: projeto.pecas.map(p => ({ ...p, id: crypto.randomUUID() })),
          configuracao: { ...projeto.configuracao },
          projeto: { nomeProduto: projeto.nomeProduto, nomePeca: projeto.nomePeca, dataCriacao: projeto.dataCriacao },
          grupoAtualId: crypto.randomUUID()
        });
      },
      
      removerProjetoSalvo: (id) => set((state) => ({
        projetosSalvos: state.projetosSalvos.filter(p => p.id !== id)
      })),
      
      calcularPecasAcabadas: () => {
        const grupos = get().calcularGrupos();
        const pecasAcabadas: PecaAcabada[] = [];
        
        grupos.forEach(grupo => {
          const pecasLong = grupo.pecas.filter(p => p.codigo === 3);
          const pecasTrans = grupo.pecas.filter(p => p.codigo !== 3);
          
          pecasLong.forEach(pl => {
            pecasTrans.forEach(pt => {
              const qtdTotal = pl.quantidade * pt.quantidade;
              pecasAcabadas.push({
                medidaLongitudinal: pl.medida,
                medidaTransversal: pt.medida,
                quantidade: qtdTotal
              });
            });
          });
        });
        
        return pecasAcabadas;
      },
      
      adicionarItemProducao: (item) => set((state) => {
        // Calcular quantas peças dessa saem por chapa baseado no plano atual
        const grupos = get().calcularGrupos();
        let quantidadePorChapa = 1;
        
        grupos.forEach(grupo => {
          const pecasLong = grupo.pecas.filter(p => p.codigo === 3 && p.medida === item.medidaLongitudinal);
          const pecasTrans = grupo.pecas.filter(p => p.codigo !== 3 && p.medida === item.medidaTransversal);
          
          pecasLong.forEach(pl => {
            pecasTrans.forEach(pt => {
              quantidadePorChapa = pl.quantidade * pt.quantidade;
            });
          });
        });
        
        return {
          itensProducao: [...state.itensProducao, { ...item, id: crypto.randomUUID(), quantidadePorChapa }]
        };
      }),
      
      removerItemProducao: (id) => set((state) => ({
        itensProducao: state.itensProducao.filter(i => i.id !== id)
      })),
      
      limparProducao: () => set({ itensProducao: [] }),
      
      calcularChapasNecessarias: () => {
        const { itensProducao } = get();
        
        if (itensProducao.length === 0) {
          return { chapas: 0, detalhes: 'Nenhum item na lista de produção' };
        }
        
        let maxChapas = 1;
        const detalhesItens: string[] = [];
        
        itensProducao.forEach(item => {
          if (item.quantidadePorChapa > 0) {
            const chapasNecessarias = Math.ceil(item.quantidadeNecessaria / item.quantidadePorChapa);
            maxChapas = Math.max(maxChapas, chapasNecessarias);
            detalhesItens.push(`${item.medidaLongitudinal}x${item.medidaTransversal}: ${item.quantidadeNecessaria} peças ÷ ${item.quantidadePorChapa}/chapa = ${chapasNecessarias} chapas`);
          }
        });
        
        return { 
          chapas: maxChapas, 
          detalhes: detalhesItens.join('\n')
        };
      },
      
      calcularGrupos: () => {
        const { configuracao, pecas } = get();
        const larguraTotal = Number(configuracao?.larguraTotal) || 2200;
        const comprimentoTotal = Number(configuracao?.comprimentoTotal) || 2750;
        const espessuraSerra = Number(configuracao?.espessuraSerra) || 4;
        const cfg = { larguraTotal, comprimentoTotal, espessuraSerra };
        const gruposMap = new Map<string, GrupoCorte>();
        
        pecas.forEach(peca => {
          if (!gruposMap.has(peca.grupoId)) {
            gruposMap.set(peca.grupoId, {
              id: peca.grupoId,
              larguraDisponivel: cfg.larguraTotal,
              comprimentoDisponivel: cfg.comprimentoTotal,
              consumoLargura: 0,
              consumoComprimento: 0,
              pecas: []
            });
          }
        });
        
        pecas.forEach(peca => {
          const grupo = gruposMap.get(peca.grupoId);
          if (grupo) {
            const medida = Number(peca.medida) || 0;
            const qtd = Number(peca.quantidade) || 1;
            const consumo = (medida + cfg.espessuraSerra) * qtd;
            grupo.pecas.push(peca);
            if (peca.codigo === 3) {
              grupo.consumoLargura += consumo;
            } else {
              grupo.consumoComprimento += consumo;
            }
          }
        });
        
        gruposMap.forEach(grupo => {
          grupo.larguraDisponivel = cfg.larguraTotal - grupo.consumoLargura;
          grupo.comprimentoDisponivel = cfg.comprimentoTotal - grupo.consumoComprimento;
        });
        
        return Array.from(gruposMap.values());
      },
      
      calcularConsumo: () => {
        const { configuracao } = get();
        const grupos = get().calcularGrupos();
        const pecasAcabadas = get().calcularPecasAcabadas();
        
        const totalLargura = grupos.reduce((sum, g) => sum + g.consumoLargura, 0);
        const maxConsumoComprimento = Math.max(...grupos.map(g => g.consumoComprimento), 0);
        
        return {
          totalLargura,
          totalComprimento: maxConsumoComprimento,
          sobraLargura: configuracao.larguraTotal - totalLargura,
          sobraComprimento: configuracao.comprimentoTotal - maxConsumoComprimento,
          grupos,
          pecasAcabadas
        };
      },
    }),
    {
      name: 'planos-corte-ade',
      partialize: (state) => ({
        projetosSalvos: state.projetosSalvos,
        configuracao: state.configuracao
      }),
      merge: (persistedState, currentState) => {
        const p = persistedState as { projetosSalvos?: unknown; configuracao?: { larguraTotal?: number; comprimentoTotal?: number; espessuraSerra?: number } };
        const def = { larguraTotal: 2200, comprimentoTotal: 2750, espessuraSerra: 4 };
        const config = p?.configuracao && typeof p.configuracao === 'object'
          ? {
              larguraTotal: Number(p.configuracao.larguraTotal) || def.larguraTotal,
              comprimentoTotal: Number(p.configuracao.comprimentoTotal) || def.comprimentoTotal,
              espessuraSerra: Number(p.configuracao.espessuraSerra) || def.espessuraSerra,
            }
          : def;
        return {
          ...currentState,
          projetosSalvos: Array.isArray(p?.projetosSalvos) ? p.projetosSalvos : currentState.projetosSalvos,
          configuracao: config,
        };
      },
    }
  )
);

export const getCorCodigo = (codigo: EixoCodigo): string => {
  switch (codigo) {
    case 3: return 'bg-green-100 border-green-300 text-green-800';
    case 4:
    case 44: return 'bg-blue-100 border-blue-300 text-blue-800';
    default: return 'bg-gray-100 border-gray-300 text-gray-800';
  }
};

export const getEixoNome = (codigo: EixoCodigo): string => {
  return codigo === 3 ? 'LONGITUDINAL' : 'TRANSVERSAL';
};
