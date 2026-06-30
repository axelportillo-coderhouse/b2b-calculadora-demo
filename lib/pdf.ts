// ============================================================
// Generación del PDF de la cotización — 100% en el cliente.
//
// Se arma un template HTML con los MISMOS tokens y la misma
// tipografía (Plus Jakarta Sans) que la herramienta, y se
// rasteriza con html2canvas → jsPDF. Así el PDF queda idéntico
// en estilo a la tool.
// ============================================================

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { formatMoney, type QuoteResult } from "./pricing";
import { PRODUCT_TYPE_LABEL, type ProductType } from "./catalog";

interface Contact {
  fullName: string;
  email: string;
  company: string;
  website: string;
}

// Tokens de marca (mismos hex que globals.css)
const C = {
  lienzo: "#f9f3e9",
  card: "#ffffff",
  line: "#ededed",
  ink: "#260700",
  label: "#585858",
  muted: "#868686",
  ok: "#2e7d32",
  okBg: "#eaf3eb",
};

// Chips por tipo (mismos colores que la tool)
const CHIP: Record<ProductType, string> = {
  curso: "background:#fbe7dd;color:#c04200;",
  carrera: "background:#f6ecd8;color:#bc5f09;",
  diplomatura: "background:#fbe1ee;color:#d9077a;",
  workshop: "background:#e6f1e7;color:#2e7d32;",
};

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function esc(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeFileName(s: string): string {
  return (
    (s || "")
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "")
      .replace(/\s+/g, " ")
      .trim() || "cotizacion"
  );
}

export function quoteReference(email: string): string {
  const base =
    typeof btoa !== "undefined"
      ? btoa(email).replace(/[^a-z0-9]/gi, "").slice(0, 6)
      : "DEMO00";
  return "COT-" + base.toUpperCase();
}

function field(label: string, value: string): string {
  return `
    <div style="font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:${C.muted};">${label}</div>
    <div style="font-size:13px;font-weight:700;color:${C.ink};margin-top:3px;">${esc(value)}</div>`;
}

export function buildQuoteHtml(
  contact: Contact,
  quote: QuoteResult,
  ref: string,
  dateStr: string,
): string {
  const c = quote.currency;

  const rows = quote.items
    .map(
      (li) => `
    <tr>
      <td style="padding:13px 0;border-bottom:1px solid ${C.line};vertical-align:top;">
        <div style="font-size:13px;font-weight:700;color:${C.ink};">${esc(li.productName)}</div>
        <span style="display:inline-block;margin-top:7px;padding:4px 11px 5px;border-radius:999px;font-size:10px;font-weight:700;line-height:1;${CHIP[li.productType]}">${PRODUCT_TYPE_LABEL[li.productType]}</span>
      </td>
      <td style="padding:13px 0;border-bottom:1px solid ${C.line};text-align:right;font-size:13px;color:${C.ink};vertical-align:top;">${li.seats}</td>
      <td style="padding:13px 0;border-bottom:1px solid ${C.line};text-align:right;font-size:13px;color:${C.ink};vertical-align:top;">${formatMoney(li.finalPerSeat, c)}</td>
      <td style="padding:13px 0;border-bottom:1px solid ${C.line};text-align:right;font-size:13px;font-weight:700;color:${C.ink};vertical-align:top;">${formatMoney(li.subtotal, c)}</td>
    </tr>`,
    )
    .join("");

  const breakdown = `
    <tr>
      <td style="padding:4px 0;font-size:12px;color:${C.muted};">Precio de lista</td>
      <td style="padding:4px 0;text-align:right;font-size:12px;color:${C.muted};">${formatMoney(quote.listTotal, c)}</td>
    </tr>
    <tr>
      <td style="padding:4px 0;font-size:12px;color:${C.label};">Descuento web (${pct(quote.webDiscount)})</td>
      <td style="padding:4px 0;text-align:right;font-size:12px;color:#c04200;font-weight:600;">incluido</td>
    </tr>
    ${
      quote.corporateDiscount > 0
        ? `<tr>
      <td style="padding:4px 0;font-size:12px;color:${C.label};">Corporativo +${pct(quote.corporateDiscount)} (${quote.totalSeats} cupos)</td>
      <td style="padding:4px 0;text-align:right;font-size:12px;color:#bc5f09;font-weight:600;">aplicado</td>
    </tr>`
        : ""
    }`;

  const savings =
    quote.totalSavings > 0
      ? `<div style="color:${C.ok};font-size:11px;font-weight:600;margin-top:3px;">Ahorrás ${formatMoney(quote.totalSavings, c)} sobre el precio de lista</div>`
      : "";

  return `
  <div style="width:100%;box-sizing:border-box;padding:36px 40px;background:${C.lienzo};font-family:var(--font-jakarta),'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;letter-spacing:-0.01em;color:${C.ink};">

    <!-- Header -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:22px;">
      <tr>
        <td style="vertical-align:top;">
          <div style="font-size:20px;font-weight:800;color:${C.ink};">Coderhouse</div>
          <div style="font-size:12px;color:${C.muted};margin-top:3px;">Cotización de capacitación</div>
        </td>
        <td style="vertical-align:top;text-align:right;">
          <div style="font-size:12px;font-weight:700;color:${C.ink};">${esc(ref)}</div>
          <div style="font-size:11px;color:${C.muted};margin-top:3px;">${esc(dateStr)}</div>
        </td>
      </tr>
    </table>

    <!-- Datos del cliente -->
    <div style="background:${C.card};border:1px solid ${C.line};border-radius:16px;padding:20px 24px;margin-bottom:14px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:50%;padding:0 0 16px 0;vertical-align:top;">${field("Nombre", contact.fullName)}</td>
          <td style="width:50%;padding:0 0 16px 0;vertical-align:top;">${field("Empresa", contact.company)}</td>
        </tr>
        <tr>
          <td style="padding:0 0 16px 0;vertical-align:top;">${field("Email", contact.email)}</td>
          <td style="padding:0 0 16px 0;vertical-align:top;">${field("Sitio web", contact.website || "—")}</td>
        </tr>
        <tr>
          <td style="vertical-align:top;">${field("Origen", quote.region === "AR" ? "Argentina (ARS)" : "Exterior (USD)")}</td>
          <td style="vertical-align:top;">${field("Personas", String(quote.totalSeats))}</td>
        </tr>
      </table>
    </div>

    <!-- Detalle -->
    <div style="background:${C.card};border:1px solid ${C.line};border-radius:16px;padding:20px 24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding-bottom:8px;font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:${C.muted};font-weight:700;">Producto</td>
          <td style="padding-bottom:8px;font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:${C.muted};font-weight:700;text-align:right;">Cupos</td>
          <td style="padding-bottom:8px;font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:${C.muted};font-weight:700;text-align:right;">Precio/persona</td>
          <td style="padding-bottom:8px;font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:${C.muted};font-weight:700;text-align:right;">Subtotal</td>
        </tr>
        ${rows}
      </table>

      <!-- Desglose -->
      <table style="width:auto;border-collapse:collapse;margin-top:16px;margin-left:auto;min-width:280px;">
        ${breakdown}
      </table>

      <!-- Total -->
      <table style="width:100%;border-collapse:collapse;margin-top:14px;">
        <tr>
          <td style="background:${C.okBg};border-radius:14px;padding:16px 20px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="vertical-align:middle;font-size:14px;font-weight:700;color:${C.ink};">Total estimado</td>
                <td style="vertical-align:middle;text-align:right;">
                  <div style="font-size:26px;font-weight:800;color:${C.ink};line-height:1.1;">${formatMoney(quote.finalTotal, c)}</div>
                  ${savings}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <div style="margin-top:16px;font-size:12px;color:${C.label};">
        <span style="font-weight:700;">Forma de pago:</span> ${esc(quote.paymentNote)}
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top:18px;font-size:10px;color:${C.muted};">
      Estimación orientativa según precios de lista vigentes. El equipo de empresas de Coderhouse confirma el presupuesto final.
    </div>
  </div>`;
}

export async function generateQuotePdf(
  contact: Contact,
  quote: QuoteResult,
): Promise<void> {
  const ref = quoteReference(contact.email);
  const dateStr = new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "800px";
  container.innerHTML = buildQuoteHtml(contact, quote, ref, dateStr);
  document.body.appendChild(container);

  try {
    if (document.fonts?.ready) await document.fonts.ready;

    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: C.lienzo,
      useCORS: true,
      logging: false,
    });

    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height * pageW) / canvas.width;

    // Pinta toda la página de lienzo para que no quede blanco
    // donde no llega el contenido.
    const fillBg = () => {
      pdf.setFillColor(249, 243, 233); // #f9f3e9
      pdf.rect(0, 0, pageW, pageH, "F");
    };

    // Una o varias páginas según el alto del contenido.
    let heightLeft = imgH;
    let position = 0;
    fillBg();
    pdf.addImage(img, "PNG", 0, position, pageW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      position -= pageH;
      pdf.addPage();
      fillBg();
      pdf.addImage(img, "PNG", 0, position, pageW, imgH);
      heightLeft -= pageH;
    }

    pdf.save(`${safeFileName(contact.company)}-cotizacion-coderhouse.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
