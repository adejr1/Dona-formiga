import type { GrupoCorte, ConfiguracaoChapa, PecaAcabada } from '../../types/corte';

interface VisualizacaoCorteProps {
  grupos: GrupoCorte[];
  configuracao: ConfiguracaoChapa;
  projeto: { nomePeca: string; nomeProduto: string };
  rotacao: number;
  pecasAcabadas: PecaAcabada[];
  isPreview?: boolean;
  layoutConfig?: {
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
  };
  onLayoutChange?: (config: VisualizacaoCorteProps['layoutConfig']) => void;
  rotacaoFolha?: number;
}

interface PecaVisual {
  x: number;
  y: number;
  width: number;
  height: number;
  medidaTransversal: number;
  medidaLongitudinal: number;
  codigo: number;
  grupoIndex: number;
}

export default function VisualizacaoCorte({ grupos, configuracao, projeto, rotacao, pecasAcabadas, isPreview = false, layoutConfig, rotacaoFolha = 0 }: VisualizacaoCorteProps) {
  const larguraTotal = Number(configuracao?.larguraTotal) || 2200;
  const comprimentoTotal = Number(configuracao?.comprimentoTotal) || 2750;
  const espessuraSerra = Number(configuracao?.espessuraSerra) || 4;
  
  const defLayout = {
    desenhoX: 5, desenhoY: 35, desenhoLargura: 130, desenhoAltura: 240, desenhoRotacao: 0, desenhoEscalaX: 100, desenhoEscalaY: 100,
    infoX: 140, infoY: 35, infoLargura: 65, infoAltura: 200, infoRotacao: 0, fontSize: 100, fontSizeInfo: 100,
    observacoes: '', obsX: 5, obsY: 250, obsLargura: 200, obsAltura: 35, obsRotacao: 0, obsFontSize: 100
  };
  const layout = layoutConfig && typeof layoutConfig === 'object' ? { ...defLayout, ...layoutConfig } : defLayout;
  
  const maxWidth = 600;
  const maxHeight = 450;
  const chapaLargura = Math.max(larguraTotal, 1);
  const chapaComprimento = Math.max(comprimentoTotal, 1);
  const scale = Math.min(maxWidth / chapaLargura, maxHeight / chapaComprimento);
  const svgWidth = chapaLargura * scale;
  const svgHeight = chapaComprimento * scale;
  
  const pecasVisuais: PecaVisual[] = [];
  let offsetXGlobal = 0;
  
  grupos.forEach((grupo, grupoIndex) => {
    const pecasLongitudinais = grupo.pecas.filter(p => p.codigo === 3);
    const pecasTransversais = grupo.pecas.filter(p => p.codigo !== 3);
    if (pecasLongitudinais.length === 0) return;
    let offsetXGrupo = offsetXGlobal;
    pecasLongitudinais.forEach(pecaLong => {
      const medLong = Number(pecaLong.medida) || 0;
      const qtdLong = Math.max(1, Number(pecaLong.quantidade) || 1);
      for (let l = 0; l < qtdLong; l++) {
        let offsetY = 0;
        pecasTransversais.forEach(pecaTrans => {
          const medTrans = Number(pecaTrans.medida) || 0;
          const qtdTrans = Math.max(1, Number(pecaTrans.quantidade) || 1);
          for (let t = 0; t < qtdTrans; t++) {
            pecasVisuais.push({
              x: offsetXGrupo, y: offsetY,
              width: medLong, height: medTrans,
              medidaTransversal: medTrans, medidaLongitudinal: medLong,
              codigo: pecaTrans.codigo ?? 4, grupoIndex: grupoIndex
            });
            offsetY += medTrans + espessuraSerra;
          }
        });
        offsetXGrupo += medLong + espessuraSerra;
      }
    });
    offsetXGlobal = offsetXGrupo;
  });
  
  const totalConsumoLargura = offsetXGlobal;
  const maxConsumoComprimento = Math.max(...pecasVisuais.map(p => p.y + p.height), 0);
  
  const getCorPeca = (codigo: number) => {
    if (codigo === 3) return { fill: '#bbf7d0', stroke: '#22c55e', text: '#166534' };
    return { fill: '#bfdbfe', stroke: '#3b82f6', text: '#1e40af' };
  };
  
  if (pecasVisuais.length === 0) {
    return <div className="bg-slate-100 rounded-xl p-8 text-center text-slate-400"><p className="text-lg">Adicione peças com código 3 e 4/44 para visualizar o plano de corte</p></div>;
  }
  
  const todasPecas = grupos.flatMap(g => g.pecas);
  
  const renderDesenhoSVG = (width: number, height: number) => {
    const scaleX = (width / chapaLargura) * (layout.desenhoEscalaX / 100);
    const scaleY = (height / chapaComprimento) * (layout.desenhoEscalaY / 100);
    const currentSvgWidth = chapaLargura * scaleX;
    const currentSvgHeight = chapaComprimento * scaleY;
    const fontMult = layout.fontSize / 100;
    
    return (
      <svg width={currentSvgWidth} height={currentSvgHeight} viewBox={`0 0 ${currentSvgWidth} ${currentSvgHeight}`} style={{ width: currentSvgWidth, height: currentSvgHeight }}>
        <rect x={0} y={0} width={currentSvgWidth} height={currentSvgHeight} fill="#fef9c3" stroke="#94a3b8" strokeWidth={0.5} />
        {pecasVisuais.map((peca, index) => {
          const cor = getCorPeca(peca.codigo);
          const drawX = peca.x * scaleX;
          const drawY = peca.y * scaleY;
          const drawWidth = Math.max(peca.width * scaleX, 0.5);
          const drawHeight = Math.max(peca.height * scaleY, 0.5);
          const medidaTexto = `${peca.medidaTransversal}×${peca.medidaLongitudinal}`;
          
          // Se altura > largura, girar texto para acompanhar a medida maior
          const isVertical = drawHeight > drawWidth;
          const fontSize = Math.max(2, Math.min(isVertical ? drawHeight / 6 : drawWidth / 6, 6) * fontMult);
          
          return (
            <g key={`p-${index}`}>
              <rect x={drawX} y={drawY} width={drawWidth} height={drawHeight} fill={cor.fill} stroke={cor.stroke} strokeWidth={0.3} />
              {drawWidth > 5 && drawHeight > 4 && (
                <text 
                  x={drawX + drawWidth / 2} 
                  y={drawY + drawHeight / 2} 
                  textAnchor="middle" 
                  dominantBaseline="middle" 
                  fontSize={fontSize} 
                  fontWeight="700" 
                  fill={cor.text}
                  transform={isVertical ? `rotate(-90 ${drawX + drawWidth / 2} ${drawY + drawHeight / 2})` : undefined}
                >{medidaTexto}</text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };
  
  // Pré-visualização A4
  if (isPreview) {
    const isPaisagem = rotacaoFolha === 90 || rotacaoFolha === 270;
    const folhaLargura = isPaisagem ? '297mm' : '210mm';
    const folhaAltura = isPaisagem ? '210mm' : '297mm';
    
    return (
      <div className="bg-slate-200 p-4 rounded-xl flex justify-center overflow-auto">
        <div className="bg-white shadow-2xl relative" style={{ width: folhaLargura, minHeight: folhaAltura, transform: 'scale(0.5)', transformOrigin: 'top center' }}>
          <div className="p-2 flex flex-col" style={{ width: folhaLargura, height: folhaAltura }}>
            <div className="flex justify-between items-start px-3 py-2 border-b-2 border-slate-700 mb-2">
              <div>
                <h1 className="text-lg font-bold text-slate-800">Planos de Corte Ade</h1>
                <p className="text-xs text-slate-600"><strong>Peça:</strong> {projeto.nomePeca || '-'}</p>
                <p className="text-xs text-slate-600"><strong>Produto:</strong> {projeto.nomeProduto || '-'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-600"><strong>Chapa:</strong> {larguraTotal} × {comprimentoTotal} mm</p>
                <p className="text-xs text-slate-600"><strong>Serra:</strong> {espessuraSerra} mm</p>
                <p className="text-xs text-slate-600"><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <div className="relative flex-1 overflow-visible" style={{ height: '245mm' }}>
              <div className="absolute overflow-visible" style={{ left: `${layout.desenhoX}mm`, top: `${layout.desenhoY}mm`, transform: `rotate(${layout.desenhoRotacao}deg)`, transformOrigin: 'top left' }}>
                {renderDesenhoSVG(layout.desenhoLargura, layout.desenhoAltura)}
              </div>
              <div className="absolute overflow-hidden bg-white border-2 border-black" style={{ left: `${layout.infoX}mm`, top: `${layout.infoY}mm`, width: `${layout.infoLargura}mm`, height: `${layout.infoAltura}mm`, transform: `rotate(${layout.infoRotacao}deg)`, transformOrigin: 'top left', boxSizing: 'border-box' }}>
                <div className="p-2" style={{ fontSize: `${(9 * layout.fontSizeInfo) / 100}pt` }}>
                  <h4 className="font-bold mb-1 border-b border-slate-300 pb-0.5">Lista de Peças</h4>
                  <table className="w-full border-collapse" style={{ fontSize: `${(8 * layout.fontSizeInfo) / 100}pt` }}>
                    <thead><tr><th className="border border-slate-300 px-1 py-0.5 bg-slate-200">Cód.</th><th className="border border-slate-300 px-1 py-0.5 bg-slate-200">Medida</th><th className="border border-slate-300 px-1 py-0.5 bg-slate-200">Qtd</th></tr></thead>
                    <tbody>
                      {todasPecas.map((peca, i) => (
                        <tr key={i}>
                          <td className="border border-slate-300 px-1 py-0.5 text-center" style={{ backgroundColor: peca.codigo === 3 ? '#bbf7d0' : '#bfdbfe' }}>{peca.codigo}</td>
                          <td className="border border-slate-300 px-1 py-0.5 text-center">{peca.medida}mm</td>
                          <td className="border border-slate-300 px-1 py-0.5 text-center">{peca.quantidade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-1 text-slate-600"><strong>Total:</strong> {pecasVisuais.length} peças</p>
                </div>
              </div>
              {layout.observacoes && (
                <div className="absolute bg-amber-50 rounded p-2" style={{ left: `${layout.obsX}mm`, top: `${layout.obsY}mm`, width: `${layout.obsLargura}mm`, transform: `rotate(${layout.obsRotacao}deg)`, transformOrigin: 'top left' }}>
                  <h5 className="font-bold text-slate-700 mb-1" style={{ fontSize: `${(12 * layout.obsFontSize) / 100}pt` }}>Observações:</h5>
                  <p className="text-slate-600 whitespace-pre-wrap" style={{ fontSize: `${(10 * layout.obsFontSize) / 100}pt` }}>{layout.observacoes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Renderização normal na tela
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-700 text-lg">Plano de Corte Visual</h3>
        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">📐 {larguraTotal} × {comprimentoTotal} mm</span>
      </div>
      <div className="flex justify-center overflow-auto p-4">
        <svg width={svgWidth + 50} height={svgHeight + 40} className="border-2 border-slate-300 rounded-lg bg-slate-50 shadow-inner" style={{ transform: `rotate(${rotacao}deg)` }}>
          <rect x={25} y={20} width={svgWidth} height={svgHeight} fill="#fef9c3" stroke="#64748b" strokeWidth="2" />
          {pecasVisuais.map((peca, index) => {
            const cor = getCorPeca(peca.codigo);
            const drawX = 25 + peca.x * scale;
            const drawY = 20 + peca.y * scale;
            const drawWidth = Math.max(peca.width * scale, 2);
            const drawHeight = Math.max(peca.height * scale, 2);
            const fontSize = Math.max(8, Math.min(drawWidth / 4, drawHeight / 2.5, 14));
            // Formato: Transversal × Longitudinal
            const medidaTexto = `${peca.medidaTransversal}×${peca.medidaLongitudinal}`;
            return (
              <g key={`peca-${index}`}>
                <rect x={drawX} y={drawY} width={drawWidth} height={drawHeight} fill={cor.fill} stroke={cor.stroke} strokeWidth="1" />
                <text x={drawX + drawWidth / 2} y={drawY + drawHeight / 2} textAnchor="middle" dominantBaseline="middle" fontSize={fontSize} fontWeight="bold" fill={cor.text}>{medidaTexto}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="grid grid-cols-4 gap-4 mt-4 p-4 bg-slate-100 rounded-lg">
        <div className="text-center"><p className="text-2xl font-bold text-indigo-600">{pecasVisuais.length}</p><p className="text-xs text-slate-500">Peças totais</p></div>
        <div className="text-center"><p className="text-2xl font-bold text-amber-600">{grupos.length}</p><p className="text-xs text-slate-500">Grupos</p></div>
        <div className="text-center"><p className="text-2xl font-bold text-green-600">{Math.max(0, larguraTotal - totalConsumoLargura).toLocaleString('pt-BR')}</p><p className="text-xs text-slate-500">mm sobra largura</p></div>
        <div className="text-center"><p className="text-2xl font-bold text-blue-600">{Math.max(0, comprimentoTotal - maxConsumoComprimento).toLocaleString('pt-BR')}</p><p className="text-xs text-slate-500">mm sobra comprimento</p></div>
      </div>
    </div>
  );
}
