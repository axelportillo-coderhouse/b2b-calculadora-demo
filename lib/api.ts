// ============================================================
// Frontera de datos — el ÚNICO punto que cambia entre la app
// real (llama al backend) y la demo estática (sin red).
//
// Toda la UI pasa por `api.*`, así ningún componente se entera
// de la diferencia. El flag NEXT_PUBLIC_DEMO=1 hace el swap.
//
//   - Modo real:  POST /api/quote  (route handler en el server)
//   - Modo demo:  simula la respuesta en el cliente, sin fetch
//
// El cálculo de precios (lib/pricing.ts) ya corre 100% en el
// cliente, así que no necesita swap: funciona igual en ambos.
// ============================================================

import {
  PRODUCTS,
  QUOTABLE_TYPES,
  parseCatalogCsv,
  type Product,
} from "./catalog";

export const DEMO = process.env.NEXT_PUBLIC_DEMO === "1";

/**
 * URL del Google Sheet en CSV. El export con el Sheet compartido como
 * "cualquiera con el link" sirve CSV con CORS habilitado (Google refleja
 * el origin). Se puede sobreescribir con NEXT_PUBLIC_SHEET_CSV_URL.
 */
const SHEET_CSV_URL =
  process.env.NEXT_PUBLIC_SHEET_CSV_URL ||
  "https://docs.google.com/spreadsheets/d/1UHQ58PDvbOHKQuSTv31-NbGaoNfxEI73swplOstdZpw/export?format=csv";

export interface SubmitQuotePayload {
  contact: {
    fullName: string;
    email: string;
    company: string;
    website: string;
  };
  region: "AR" | "EXT";
  alianzasCode?: string;
  items: { productId: string; productName: string; seats: number }[];
  quote: {
    currency: string;
    totalSeats: number;
    finalTotal: number;
    listTotal: number;
    totalSavings: number;
  };
}

export interface SubmitQuoteResponse {
  ok: boolean;
  ticketId?: string;
  notifiedTo?: string;
  message?: string;
  error?: string;
}

const B2B_INBOX = "empresas@coderhouse.com";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export interface CatalogResult {
  products: Product[];
  /** De dónde salieron los datos: el Sheet en vivo o el fallback local. */
  source: "sheet" | "fallback";
}

/**
 * Catálogo de productos. Si hay un Sheet configurado
 * (NEXT_PUBLIC_SHEET_CSV_URL), lo lee en vivo; si no está
 * configurado o falla la lectura, usa el catálogo local de respaldo.
 * Funciona igual en la demo estática (fetch desde el navegador).
 */
/** Solo cotizamos cursos y carreras (no diplomaturas ni workshops). */
function onlyQuotable(products: Product[]): Product[] {
  return products.filter((p) => QUOTABLE_TYPES.includes(p.type));
}

export async function getCatalog(): Promise<CatalogResult> {
  if (!SHEET_CSV_URL) {
    return { products: onlyQuotable(PRODUCTS), source: "fallback" };
  }
  try {
    const res = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csv = await res.text();
    const products = onlyQuotable(parseCatalogCsv(csv));
    if (products.length === 0) throw new Error("CSV sin productos válidos");
    return { products, source: "sheet" };
  } catch (err) {
    console.error("[catalog] No se pudo leer el Sheet, uso fallback:", err);
    return { products: onlyQuotable(PRODUCTS), source: "fallback" };
  }
}

interface QuoteApi {
  submitQuote(payload: SubmitQuotePayload): Promise<SubmitQuoteResponse>;
}

// --- Real: llama al route handler del server ---
const realApi: QuoteApi = {
  async submitQuote(payload) {
    const res = await fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};

// --- Demo: simula el aviso al equipo B2B sin tocar la red ---
const demoApi: QuoteApi = {
  async submitQuote(payload) {
    await delay(600); // latencia simulada para el estado de carga
    const ticketId =
      "B2B-" +
      (typeof btoa !== "undefined"
        ? btoa(payload.contact.email).replace(/[^a-z0-9]/gi, "").slice(0, 8)
        : "DEMO0000"
      ).toUpperCase();

    // eslint-disable-next-line no-console
    console.log("[demo] Aviso a B2B (simulado) — nueva consulta:", {
      ticketId,
      to: B2B_INBOX,
      contact: payload.contact,
      region: payload.region,
      items: payload.items,
      total: payload.quote.finalTotal,
      currency: payload.quote.currency,
    });

    return {
      ok: true,
      ticketId,
      notifiedTo: B2B_INBOX,
      message:
        "Tu consulta fue enviada al equipo de empresas de Coderhouse. Te van a contactar para avanzar con la inscripción.",
    };
  },
};

export const api = DEMO ? demoApi : realApi;
