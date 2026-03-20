/** Categorias usadas no estoque/cardápio e mapeadas para seções do cardápio visual */
export type CategoriaCatalogo =
  | "bolos"
  | "doces"
  | "combos"
  | "bebidas";

export const SECOES_CATALOGO: {
  id: CategoriaCatalogo;
  titulo: string;
  subtitulo: string;
}[] = [
  {
    id: "bolos",
    titulo: "Nossos Bolos Recheados",
    subtitulo:
      "Camadas fofas, recheios generosos e aquele aroma que faz o coração derreter — feitos com carinho, como em casa.",
  },
  {
    id: "doces",
    titulo: "Docinhos Gourmet",
    subtitulo:
      "Pequenos tesouros de sabor: brigadeiros, trufas e mordidas perfeitas para presentear ou se mimar.",
  },
  {
    id: "combos",
    titulo: "Fatias Supremas",
    subtitulo:
      "Porções generosas para saborear com calma — texturas cremosas e combinações que abraçam o paladar.",
  },
  {
    id: "bebidas",
    titulo: "Bebidas que Abraçam",
    subtitulo:
      "Acompanhamentos quentes e gelados que completam a experiência doce com leveza e conforto.",
  },
];

export function normalizarCategoria(
  raw: string | undefined
): CategoriaCatalogo {
  const c = (raw || "bolos").toLowerCase();
  if (c === "bebidas") return "bebidas";
  if (c === "doces") return "doces";
  if (c === "combos") return "combos";
  return "bolos";
}

export function labelCategoriaAdmin(cat: CategoriaCatalogo): string {
  switch (cat) {
    case "bolos":
      return "Bolos (seção: Nossos Bolos Recheados)";
    case "doces":
      return "Doces (seção: Docinhos Gourmet)";
    case "combos":
      return "Fatias (seção: Fatias Supremas)";
    case "bebidas":
      return "Bebidas (seção: Bebidas que Abraçam)";
    default:
      return cat;
  }
}
