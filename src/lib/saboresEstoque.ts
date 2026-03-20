/** Linhas de sabores (uma por linha no texto do cardápio) */
export function linhasSabores(sabores?: string): string[] {
  return String(sabores || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Com 2+ sabores, o estoque é controlado separadamente por linha */
export function produtoMultiSabor(sabores?: string): boolean {
  return linhasSabores(sabores).length >= 2;
}

export type EstoquePorSaborMap = Record<string, number>;

/** Garante uma chave numérica por linha atual de sabores */
export function normalizarEstoquePorSabor(
  sabores: string | undefined,
  atual: EstoquePorSaborMap | undefined
): EstoquePorSaborMap {
  const lines = linhasSabores(sabores);
  if (lines.length < 2) return {};
  const prev =
    atual && typeof atual === "object" && !Array.isArray(atual) ? atual : {};
  const out: EstoquePorSaborMap = {};
  for (const l of lines) {
    out[l] = Math.max(0, Number(prev[l]) || 0);
  }
  return out;
}

export function somaEstoquePorSabor(map: EstoquePorSaborMap): number {
  return Object.values(map).reduce((acc, v) => acc + Math.max(0, Number(v) || 0), 0);
}

/** Total usado no cardápio / filtros: multi = soma dos sabores; senão quantidade */
export function totalEstoqueProduto(p: {
  quantidade?: number;
  sabores?: string;
  estoquePorSabor?: EstoquePorSaborMap;
}): number {
  if (produtoMultiSabor(p.sabores)) {
    const m = normalizarEstoquePorSabor(p.sabores, p.estoquePorSabor);
    return somaEstoquePorSabor(m);
  }
  return Math.max(0, Number(p.quantidade) || 0);
}

export function qtdDisponivelSabor(
  nomeSabor: string,
  estoquePorSabor: EstoquePorSaborMap | undefined
): number {
  return Math.max(0, Number(estoquePorSabor?.[nomeSabor]) || 0);
}
