// ============================================================
// Catálogo de productos B2C que se venden vía B2B.
//
// La fuente real es el Google Sheet (ver parseCatalogCsv + getCatalog
// en lib/api.ts). El array PRODUCTS de abajo es el FALLBACK que se usa
// cuando el Sheet no está configurado o falla la lectura — son
// productos y precios de LISTA reales (subconjunto), para que la demo
// se vea auténtica.
//
// Sobre estos precios de lista, lib/pricing.ts aplica:
//   - descuento web vigente (20% AR / 60% exterior)
//   - +5% corporativo (AR, 10+ cupos)
//   - +20% Alianzas (AR, con código)
// ============================================================

export type ProductType = "curso" | "carrera" | "diplomatura" | "workshop";

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
  // ---- Carreras ----
  {
    id: "carrera-ai-automation",
    name: "Carrera de AI Automation",
    type: "carrera",
    duration: "10 semanas",
    listPriceARS: 269_555,
    listPriceUSD: 1692,
  },
  {
    id: "carrera-data-scientist",
    name: "Carrera de Data Scientist",
    type: "carrera",
    duration: "40 semanas",
    listPriceARS: 814_385,
    listPriceUSD: 4959,
  },
  {
    id: "carrera-full-stack",
    name: "Carrera de Desarrollo Full Stack",
    type: "carrera",
    duration: "53 semanas",
    listPriceARS: 898_755,
    listPriceUSD: 5199,
  },
  {
    id: "carrera-marketing-digital",
    name: "Carrera de Marketing Digital",
    type: "carrera",
    duration: "30 semanas",
    listPriceARS: 386_100,
    listPriceUSD: 2526,
  },

  // ---- Cursos ----
  {
    id: "curso-intro-ia",
    name: "Curso de Introducción a la Inteligencia Artificial",
    type: "curso",
    duration: "6 semanas",
    listPriceARS: 83_600,
    listPriceUSD: 660,
  },
  {
    id: "curso-ai-automation",
    name: "Curso de AI Automation",
    type: "curso",
    duration: "4 semanas",
    listPriceARS: 179_520,
    listPriceUSD: 1215,
  },
  {
    id: "curso-python",
    name: "Curso de Python",
    type: "curso",
    duration: "12 semanas",
    listPriceARS: 320_320,
    listPriceUSD: 1530,
  },
  {
    id: "curso-javascript",
    name: "Curso de JavaScript",
    type: "curso",
    duration: "10 semanas",
    listPriceARS: 191_840,
    listPriceUSD: 1242,
  },
  {
    id: "curso-data-analytics",
    name: "Curso de Data Analytics",
    type: "curso",
    duration: "10 semanas",
    listPriceARS: 211_200,
    listPriceUSD: 1242,
  },
  {
    id: "curso-ux-ui",
    name: "Curso de Diseño UX/UI",
    type: "curso",
    duration: "13 semanas",
    listPriceARS: 201_520,
    listPriceUSD: 1242,
  },
];

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  curso: "Curso",
  carrera: "Carrera",
  diplomatura: "Diplomatura",
  workshop: "Workshop",
};

/** Tipos que cotizamos hoy (solo cursos y carreras). */
export const QUOTABLE_TYPES: ProductType[] = ["carrera", "curso"];

/** Orden en que se muestran los grupos de productos. */
export const PRODUCT_TYPE_ORDER: ProductType[] = ["carrera", "curso"];

export function getProduct(
  id: string,
  catalog: Product[] = PRODUCTS,
): Product | undefined {
  return catalog.find((p) => p.id === id);
}

// ============================================================
// Carga desde Google Sheet (CSV publicado).
//
// El equipo publica el Sheet como CSV (Archivo → Compartir →
// Publicar en la web → CSV) y la herramienta lo lee en vivo.
//
// Formato real del Sheet de Ventas B2B (multi-moneda):
//   - Fila de monedas:  ...,ARS,,CLP,,COP,,EUR,,MXN,,PEN,,USD,,UYU,
//   - Fila de columnas: title,type,duration,Amount,Amount USD,Amount,...
//   - Cada moneda ocupa 2 columnas: "Amount" (precio local) y
//     "Amount USD" (su equivalente en USD).
//
// La herramienta usa hoy ARS (Argentina) y USD (Exterior); el
// resto de monedas quedan disponibles para el futuro.
//
// El parser ubica las columnas por nombre/moneda, así que tolera
// reordenamientos. También acepta un formato simple de una sola
// fila de encabezado con columnas: title/nombre, type/tipo,
// duration/duracion, precio_ars, precio_usd.
// ============================================================

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toNumber(raw: string): number {
  const digits = (raw || "").replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function normalizeType(raw: string): ProductType {
  const t = (raw || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (t.startsWith("carrera")) return "carrera";
  if (t.startsWith("diplomatura")) return "diplomatura";
  if (t.startsWith("workshop") || t.startsWith("taller")) return "workshop";
  return "curso";
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

/** Parser CSV mínimo que respeta comillas y comas dentro de campos. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((f) => f.trim() !== "")) rows.push(row);
  }
  return rows;
}

export function parseCatalogCsv(csv: string): Product[] {
  const rows = parseCsv(csv);
  if (rows.length < 2) return [];

  // Fila de encabezado: la que contiene "title"/"nombre" y "type"/"tipo".
  const headerIdx = rows.findIndex((r) => {
    const h = r.map(normalizeHeader);
    return (
      (h.includes("title") || h.includes("nombre")) &&
      (h.includes("type") || h.includes("tipo"))
    );
  });
  if (headerIdx === -1) return [];

  const header = rows[headerIdx].map(normalizeHeader);
  const col = (...names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i >= 0) return i;
    }
    return -1;
  };

  const iName = col("title", "nombre");
  const iType = col("type", "tipo");
  const iDur = col("duration", "duracion");
  const iId = col("id");
  const iActive = col("activo", "active");

  // Columnas de precio: por fila de monedas (la de arriba del header)
  // o, en el formato simple, por nombre de columna.
  let iArs = col("precio_ars", "amount_ars");
  let iUsd = col("precio_usd", "amount_usd");
  if (headerIdx >= 1) {
    const currencyRow = rows[headerIdx - 1].map((c) => c.trim().toUpperCase());
    const ars = currencyRow.indexOf("ARS");
    const usd = currencyRow.indexOf("USD");
    if (ars >= 0) iArs = ars; // columna "Amount" de esa moneda
    if (usd >= 0) iUsd = usd;
  }

  const products: Product[] = [];
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const cells = rows[r];
    const get = (i: number) => (i >= 0 ? (cells[i] ?? "").trim() : "");

    const name = get(iName);
    if (!name) continue;

    if (iActive >= 0) {
      const a = get(iActive).toLowerCase();
      if (a === "false" || a === "no" || a === "0") continue;
    }

    products.push({
      id: get(iId) || slugify(name),
      name,
      type: normalizeType(get(iType)),
      duration: get(iDur),
      listPriceARS: toNumber(get(iArs)),
      listPriceUSD: toNumber(get(iUsd)),
    });
  }
  return products;
}
