/**
 * Horários de trabalho:
 * - Base: 07:00-11:00 e 12:12-17:00
 * - Opcionais: 05:00-07:00 e 11:00-12:12
 */
export function calcularMinutosUteis(
  dataInicio: string,
  dataFim: string,
  incluirExtraManha: boolean,
  incluirExtraAlmoco: boolean
): number {
  if (!dataInicio || !dataFim) return 0;
  const dInicio = new Date(dataInicio);
  const dFim = new Date(dataFim);
  if (dInicio >= dFim) return 0;

  const segmentosBase: { startMin: number; endMin: number }[] = [
    { startMin: 7 * 60, endMin: 11 * 60 },
    { startMin: 12 * 60 + 12, endMin: 17 * 60 },
  ];
  if (incluirExtraManha) {
    segmentosBase.unshift({ startMin: 5 * 60, endMin: 7 * 60 });
  }
  if (incluirExtraAlmoco) {
    segmentosBase.splice(2, 0, { startMin: 11 * 60, endMin: 12 * 60 + 12 });
  }

  let total = 0;
  const diaMs = 24 * 60 * 60 * 1000;
  let atual = new Date(dInicio);
  atual.setHours(0, 0, 0, 0);
  const fimDia = new Date(dFim);
  fimDia.setHours(23, 59, 59, 999);

  while (atual <= fimDia) {
    const diaInicio = new Date(atual);
    diaInicio.setHours(0, 0, 0, 0);
    const diaFim = new Date(atual);
    diaFim.setHours(23, 59, 59, 999);

    const diaStart = Math.max(dInicio.getTime(), diaInicio.getTime());
    const diaEnd = Math.min(dFim.getTime(), diaFim.getTime());

    const startMinOfDay = ((diaStart - diaInicio.getTime()) / 60000);
    const endMinOfDay = ((diaEnd - diaInicio.getTime()) / 60000);

    for (const seg of segmentosBase) {
      const overlapStart = Math.max(seg.startMin, startMinOfDay);
      const overlapEnd = Math.min(seg.endMin, endMinOfDay);
      if (overlapEnd > overlapStart) {
        total += overlapEnd - overlapStart;
      }
    }
    atual.setDate(atual.getDate() + 1);
  }
  return total;
}

const ORDEM_MAT = ['AGLO12', 'AGLO15', 'AGLO25', 'MDF12', 'MDF15', 'MDF18', 'MDF25'];

function chaveMaterial(m: string): string {
  const n = (m || '').toUpperCase();
  const tipo = n.includes('AGLO') ? 'AGLO' : n.includes('MDF') ? 'MDF' : '';
  const nums = n.match(/\d+/g) || [];
  const esp = nums.length ? parseInt(nums[nums.length - 1].slice(0, 2), 10) : 0;
  if (tipo && esp) return tipo + esp;
  return 'OUTROS';
}

export function ordemMaterialSort(a: string, b: string): number {
  const ka = chaveMaterial(a);
  const kb = chaveMaterial(b);
  const ia = ORDEM_MAT.indexOf(ka);
  const ib = ORDEM_MAT.indexOf(kb);
  const oa = ia >= 0 ? ia : ORDEM_MAT.length;
  const ob = ib >= 0 ? ib : ORDEM_MAT.length;
  if (oa !== ob) return oa - ob;
  return (a || '').localeCompare(b || '');
}
