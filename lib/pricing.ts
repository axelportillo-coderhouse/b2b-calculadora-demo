// ============================================================
// Lógica de cotización — basada en el registro de proceso
// (sección "Precios", pág. 9 del PDF).
//
//   Base = precio de lista publicado en la web.
//   Sobre esa base se aplica, en cascada:
//     1. Descuento web vigente   (AR 20% / Exterior 60%)
//     2. +5% corporativo          (solo AR, 10+ cupos totales)
//     3. +20% Alianzas            (solo AR, con código válido)
//
//   Los descuentos 2 y 3 se aplican "sobre el precio ya
//   descontado de la web" (cascada multiplicativa).
// ============================================================

import { getProduct } from "./catalog";

export type Region = "AR" | "EXT";
export type Currency = "ARS" | "USD";

export interface QuoteItemInput {
  productId: string;
  seats: number;
}

export interface QuoteInput {
  items: QuoteItemInput[];
  region: Region;
  alianzasCode?: string;
}

export interface QuoteLineItem {
  productId: string;
  productName: string;
  seats: number;
  /** Precio de lista por persona (sin descuentos). */
  listPerSeat: number;
  /** Precio final por persona (todos los descuentos aplicados). */
  finalPerSeat: number;
  /** finalPerSeat * seats */
  subtotal: number;
}

export interface QuoteResult {
  region: Region;
  currency: Currency;
  totalSeats: number;
  items: QuoteLineItem[];

  /** Porcentajes aplicados (0–1). */
  webDiscount: number;
  corporateDiscount: number;
  alianzasDiscount: number;

  /** Suma de precios de lista (sin descuentos). */
  listTotal: number;
  /** Total final a pagar. */
  finalTotal: number;
  /** listTotal - finalTotal. */
  totalSavings: number;

  /** ¿El código de Alianzas ingresado es válido? */
  alianzasApplied: boolean;
  /** El código fue ingresado pero no es válido. */
  alianzasInvalid: boolean;

  /** Forma de pago habitual para la región. */
  paymentNote: string;
}

// --- Parámetros vigentes (editables en un solo lugar) ---
export const WEB_DISCOUNT: Record<Region, number> = {
  AR: 0.2, // 20%
  EXT: 0.6, // 60%
};
export const CORPORATE_DISCOUNT = 0.05; // 10+ cupos (solo AR)
export const CORPORATE_MIN_SEATS = 10;
export const ALIANZAS_DISCOUNT = 0.2; // solo AR, con código

/** Código de Alianzas válido para la demo (case-insensitive). */
export const VALID_ALIANZAS_CODES = ["ALIANZAS20", "CODER-ALIANZA"];

export function isValidAlianzasCode(code: string | undefined): boolean {
  if (!code) return false;
  return VALID_ALIANZAS_CODES.some(
    (c) => c.toLowerCase() === code.trim().toLowerCase(),
  );
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateQuote(input: QuoteInput): QuoteResult {
  const { region, alianzasCode } = input;
  const currency: Currency = region === "AR" ? "ARS" : "USD";

  const items = input.items.filter((i) => i.seats > 0);
  const totalSeats = items.reduce((acc, i) => acc + i.seats, 0);

  const webDiscount = WEB_DISCOUNT[region];

  // Corporativo y Alianzas: solo Argentina.
  const corporateDiscount =
    region === "AR" && totalSeats >= CORPORATE_MIN_SEATS
      ? CORPORATE_DISCOUNT
      : 0;

  const codeEntered = !!alianzasCode && alianzasCode.trim().length > 0;
  const alianzasValid = isValidAlianzasCode(alianzasCode);
  const alianzasApplied = region === "AR" && alianzasValid;
  const alianzasDiscount = alianzasApplied ? ALIANZAS_DISCOUNT : 0;

  const lineItems: QuoteLineItem[] = items.map((item) => {
    const product = getProduct(item.productId);
    const listPerSeat = product
      ? region === "AR"
        ? product.listPriceARS
        : product.listPriceUSD
      : 0;

    // Cascada multiplicativa de descuentos.
    const finalPerSeat =
      listPerSeat *
      (1 - webDiscount) *
      (1 - corporateDiscount) *
      (1 - alianzasDiscount);

    return {
      productId: item.productId,
      productName: product?.name ?? item.productId,
      seats: item.seats,
      listPerSeat: round(listPerSeat),
      finalPerSeat: round(finalPerSeat),
      subtotal: round(finalPerSeat * item.seats),
    };
  });

  const listTotal = round(
    lineItems.reduce((acc, li) => acc + li.listPerSeat * li.seats, 0),
  );
  const finalTotal = round(
    lineItems.reduce((acc, li) => acc + li.subtotal, 0),
  );

  return {
    region,
    currency,
    totalSeats,
    items: lineItems,
    webDiscount,
    corporateDiscount,
    alianzasDiscount,
    listTotal,
    finalTotal,
    totalSavings: round(listTotal - finalTotal),
    alianzasApplied,
    alianzasInvalid: codeEntered && !alianzasValid,
    paymentNote:
      region === "AR"
        ? "Transferencia bancaria a 30 días (luego de emitida la factura). También admite tarjeta vía link de pago."
        : "Pago con tarjeta en USD mediante link de pago.",
  };
}

export function formatMoney(amount: number, currency: Currency): string {
  const locale = currency === "ARS" ? "es-AR" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
