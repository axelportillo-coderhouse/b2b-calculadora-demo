// ============================================================
// Generación del PDF de la cotización — 100% en el cliente
// (funciona en el export estático, sin servidor).
// Dibuja con la estética de marca: banda naranja, lienzo,
// desglose de descuentos y total destacado.
// ============================================================

import { jsPDF } from "jspdf";
import { formatMoney, type QuoteResult } from "./pricing";
import { PRODUCT_TYPE_LABEL } from "./catalog";

interface Contact {
  fullName: string;
  email: string;
  company: string;
  website: string;
}

// Paleta de marca (RGB)
const ORANGE: [number, number, number] = [255, 99, 43]; // horizonte
const BRASA: [number, number, number] = [38, 7, 0];
const LIENZO: [number, number, number] = [249, 243, 233];
const MUTED: [number, number, number] = [134, 134, 134];
const LABEL: [number, number, number] = [88, 88, 88];
const LINE: [number, number, number] = [225, 225, 225];
const OKGREEN: [number, number, number] = [46, 125, 50];
const WHITE: [number, number, number] = [255, 255, 255];

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function sanitize(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "cliente";
}

export function quoteReference(email: string): string {
  const base =
    typeof btoa !== "undefined"
      ? btoa(email).replace(/[^a-z0-9]/gi, "").slice(0, 6)
      : "DEMO00";
  return "COT-" + base.toUpperCase();
}

export function generateQuotePdf(contact: Contact, quote: QuoteResult): void {
  const doc = buildQuotePdf(contact, quote);
  doc.save(`Cotizacion-Coderhouse-${sanitize(contact.company)}.pdf`);
}

export function buildQuotePdf(contact: Contact, quote: QuoteResult): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth(); // ~595
  const M = 40; // margen
  const right = W - M;
  const currency = quote.currency;

  const dateStr = new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const ref = quoteReference(contact.email);

  // ---------- Header (banda naranja) ----------
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, W, 92, "F");

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Coderhouse", M, 46);
  const chW = doc.getTextWidth("Coderhouse");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(20);
  doc.text("Empresas", M + chW + 7, 46);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Cotización de capacitación", M, 68);

  doc.setFontSize(9);
  doc.text(ref, right, 40, { align: "right" });
  doc.text(dateStr, right, 56, { align: "right" });

  let y = 128;

  // ---------- Datos del cliente ----------
  sectionTitle(doc, "DATOS DEL CLIENTE", M, y);
  y += 18;

  const col2 = W / 2 + 10;
  doc.setFontSize(10);
  field(doc, "Nombre", contact.fullName, M, y);
  field(doc, "Empresa", contact.company, col2, y);
  y += 34;
  field(doc, "Email", contact.email, M, y);
  field(doc, "Sitio web", contact.website || "—", col2, y);
  y += 34;
  field(
    doc,
    "Origen",
    quote.region === "AR" ? "Argentina (ARS)" : "Exterior (USD)",
    M,
    y,
  );
  field(doc, "Personas", String(quote.totalSeats), col2, y);
  y += 40;

  // ---------- Tabla de productos ----------
  sectionTitle(doc, "DETALLE", M, y);
  y += 16;

  // encabezado de tabla
  const cCupos = right - 200;
  const cUnit = right - 110;
  const cSub = right;
  doc.setFillColor(...LIENZO);
  doc.rect(M, y, right - M, 22, "F");
  doc.setTextColor(...LABEL);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("PRODUCTO", M + 8, y + 14);
  doc.text("CUPOS", cCupos, y + 14, { align: "right" });
  doc.text("PRECIO/PERSONA", cUnit, y + 14, { align: "right" });
  doc.text("SUBTOTAL", cSub - 8, y + 14, { align: "right" });
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  quote.items.forEach((li) => {
    const typeLabel = PRODUCT_TYPE_LABEL[li.productType] ?? "";
    const rowH = 30;

    doc.setTextColor(...BRASA);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(li.productName, M + 8, y + 14);
    if (typeLabel) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(typeLabel, M + 8, y + 25);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BRASA);
    doc.text(String(li.seats), cCupos, y + 14, { align: "right" });
    doc.text(formatMoney(li.finalPerSeat, currency), cUnit, y + 14, {
      align: "right",
    });
    doc.setFont("helvetica", "bold");
    doc.text(formatMoney(li.subtotal, currency), cSub - 8, y + 14, {
      align: "right",
    });

    y += rowH;
    doc.setDrawColor(...LINE);
    doc.line(M, y, right, y);
  });

  y += 18;

  // ---------- Desglose de descuentos (derecha) ----------
  const dxLabel = right - 200;
  const dxVal = right;
  doc.setFontSize(9);

  breakdownRow(doc, "Precio de lista", formatMoney(quote.listTotal, currency), dxLabel, dxVal, y, MUTED);
  y += 18;
  breakdownRow(doc, `Descuento web (${pct(quote.webDiscount)})`, "incluido", dxLabel, dxVal, y, ORANGE);
  y += 18;
  if (quote.corporateDiscount > 0) {
    breakdownRow(doc, `Corporativo (+${pct(quote.corporateDiscount)})`, "aplicado", dxLabel, dxVal, y, ORANGE);
    y += 18;
  }
  if (quote.alianzasApplied) {
    breakdownRow(doc, `Alianzas (+${pct(quote.alianzasDiscount)})`, "aplicado", dxLabel, dxVal, y, ORANGE);
    y += 18;
  }
  y += 6;

  // ---------- Total destacado ----------
  const boxH = 64;
  const boxLeft = right - 300;
  doc.setFillColor(...LIENZO);
  doc.roundedRect(boxLeft, y, right - boxLeft, boxH, 8, 8, "F");
  doc.setTextColor(...LABEL);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("TOTAL ESTIMADO", boxLeft + 16, y + 26);
  doc.setTextColor(...BRASA);
  doc.setFontSize(20);
  doc.text(formatMoney(quote.finalTotal, currency), right - 16, y + 30, {
    align: "right",
  });
  if (quote.totalSavings > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...OKGREEN);
    doc.text(
      `Ahorrás ${formatMoney(quote.totalSavings, currency)} sobre el precio de lista`,
      right - 16,
      y + 50,
      { align: "right" },
    );
  }
  y += boxH + 24;

  // ---------- Forma de pago ----------
  sectionTitle(doc, "FORMA DE PAGO", M, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...LABEL);
  doc.text(doc.splitTextToSize(quote.paymentNote, right - M), M, y);

  // ---------- Footer ----------
  const H = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...LINE);
  doc.line(M, H - 56, right, H - 56);
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    "Estimación orientativa según precios de lista vigentes. El equipo de empresas de Coderhouse confirma el presupuesto final.",
    M,
    H - 40,
    { maxWidth: right - M },
  );

  return doc;
}

// ---------- helpers ----------

function sectionTitle(doc: jsPDF, text: string, x: number, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(text, x, y);
}

function field(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRASA);
  doc.text(value, x, y + 14);
}

function breakdownRow(
  doc: jsPDF,
  label: string,
  value: string,
  xLabel: number,
  xVal: number,
  y: number,
  valueColor: [number, number, number],
) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...LABEL);
  doc.text(label, xLabel, y);
  doc.setTextColor(...valueColor);
  doc.text(value, xVal, y, { align: "right" });
}
