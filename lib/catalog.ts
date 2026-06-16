// ============================================================
// Catálogo de productos B2C que se venden vía B2B.
// DATOS DE EJEMPLO para la demo — precios de LISTA (sin
// descuento web), editables en un solo lugar.
//
// Sobre estos precios de lista, lib/pricing.ts aplica:
//   - descuento web vigente (20% AR / 60% exterior)
//   - +5% corporativo (AR, 10+ cupos)
//   - +20% Alianzas (AR, con código)
// ============================================================

export type ProductType = "curso" | "carrera" | "workshop";

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  /** Duración aproximada, para mostrar en la tarjeta. */
  duration: string;
  /** Precio de lista en ARS (cliente Argentina). */
  listPriceARS: number;
  /** Precio de lista en USD (cliente del exterior). */
  listPriceUSD: number;
}

export const PRODUCTS: Product[] = [
  // ---- Cursos ----
  {
    id: "intro-ia",
    name: "Introducción a Inteligencia Artificial",
    type: "curso",
    duration: "4 semanas",
    listPriceARS: 180_000,
    listPriceUSD: 150,
  },
  {
    id: "python",
    name: "Python para Data",
    type: "curso",
    duration: "8 semanas",
    listPriceARS: 260_000,
    listPriceUSD: 220,
  },
  {
    id: "javascript",
    name: "JavaScript",
    type: "curso",
    duration: "8 semanas",
    listPriceARS: 260_000,
    listPriceUSD: 220,
  },
  {
    id: "marketing-digital",
    name: "Marketing Digital",
    type: "curso",
    duration: "8 semanas",
    listPriceARS: 240_000,
    listPriceUSD: 200,
  },
  {
    id: "ux-ui",
    name: "Diseño UX/UI",
    type: "curso",
    duration: "10 semanas",
    listPriceARS: 300_000,
    listPriceUSD: 250,
  },

  // ---- Carreras ----
  {
    id: "desarrollo-web",
    name: "Desarrollo Web Full Stack",
    type: "carrera",
    duration: "6 meses",
    listPriceARS: 720_000,
    listPriceUSD: 620,
  },
  {
    id: "data-science",
    name: "Data Science",
    type: "carrera",
    duration: "6 meses",
    listPriceARS: 760_000,
    listPriceUSD: 650,
  },
  {
    id: "data-analytics",
    name: "Data Analytics",
    type: "carrera",
    duration: "5 meses",
    listPriceARS: 680_000,
    listPriceUSD: 580,
  },
  {
    id: "ciberseguridad",
    name: "Ciberseguridad",
    type: "carrera",
    duration: "6 meses",
    listPriceARS: 780_000,
    listPriceUSD: 660,
  },

  // ---- Workshops ----
  {
    id: "ws-prompting",
    name: "Workshop: Prompting para equipos",
    type: "workshop",
    duration: "1 jornada",
    listPriceARS: 90_000,
    listPriceUSD: 75,
  },
  {
    id: "ws-ia-productividad",
    name: "Workshop: IA aplicada a la productividad",
    type: "workshop",
    duration: "1 jornada",
    listPriceARS: 110_000,
    listPriceUSD: 90,
  },
  {
    id: "ws-liderazgo-datos",
    name: "Workshop: Liderazgo basado en datos",
    type: "workshop",
    duration: "2 jornadas",
    listPriceARS: 140_000,
    listPriceUSD: 120,
  },
];

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  curso: "Curso",
  carrera: "Carrera",
  workshop: "Workshop",
};

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
