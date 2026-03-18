// Tipos para a calculadora de plano de corte

export type EixoCodigo = 3 | 4 | 44;

export interface DadosProjeto {
  nomePeca: string;
  nomeProduto: string;
  dataCriacao: string;
}

export interface PecaCorte {
  id: string;
  codigo: EixoCodigo;
  medida: number;
  quantidade: number;
  grupoId: string;
}

export interface ProjetoSalvo {
  id: string;
  nomeProduto: string;
  nomePeca: string;
  pecas: PecaCorte[];
  configuracao: ConfiguracaoChapa;
  dataCriacao: string;
}

export interface PecaAcabada {
  medidaLongitudinal: number;
  medidaTransversal: number;
  quantidade: number;
}

export interface GrupoCorte {
  id: string;
  larguraDisponivel: number;
  comprimentoDisponivel: number;
  consumoLargura: number;
  consumoComprimento: number;
  pecas: PecaCorte[];
}

export interface ConfiguracaoChapa {
  larguraTotal: number;
  comprimentoTotal: number;
  espessuraSerra: number;
}

export interface ResultadoCalculo {
  consumoLargura: number;
  consumoComprimento: number;
  sobraLargura: number;
  sobraComprimento: number;
  pecas: PecaCalculada[];
}

export interface PecaCalculada extends PecaCorte {
  consumo: number;
  eixo: 'LONGITUDINAL' | 'TRANSVERSAL';
}

export interface ItemProducao {
  id: string;
  pecaSalvaId: string;
  nome: string;
  medidaLongitudinal: number;
  medidaTransversal: number;
  quantidadeNecessaria: number;
  quantidadePorChapa: number;
}
