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
import { formatMoney, priceDisclaimer, type QuoteResult } from "./pricing";
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

function field(label: string, value: string): string {
  return `
    <div style="font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:${C.muted};">${label}</div>
    <div style="font-size:13px;font-weight:700;color:${C.ink};margin-top:3px;">${esc(value)}</div>`;
}

export function buildQuoteHtml(
  contact: Contact,
  quote: QuoteResult,
  dateStr: string,
): string {
  const c = quote.currency;

  const rows = quote.items
    .map(
      (li) => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid ${C.line};vertical-align:top;">
        <div style="font-size:13px;font-weight:700;color:${C.ink};">${esc(li.productName)}</div>
        <span style="display:inline-block;margin-top:8px;height:21px;line-height:21px;padding:0 12px;border-radius:999px;font-size:10px;font-weight:700;${CHIP[li.productType]}">${PRODUCT_TYPE_LABEL[li.productType]}</span>
      </td>
      <td style="padding:14px 0;border-bottom:1px solid ${C.line};text-align:right;font-size:13px;color:${C.ink};vertical-align:top;">${li.seats}</td>
      <td style="padding:14px 0;border-bottom:1px solid ${C.line};text-align:right;font-size:13px;color:${C.ink};vertical-align:top;">${formatMoney(li.finalPerSeat, c)}</td>
      <td style="padding:14px 0;border-bottom:1px solid ${C.line};text-align:right;font-size:13px;font-weight:700;color:${C.ink};vertical-align:top;">${formatMoney(li.subtotal, c)}</td>
    </tr>`,
    )
    .join("");

  return `
  <div style="width:100%;box-sizing:border-box;padding:36px 40px;background:${C.lienzo};font-family:var(--font-jakarta),'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;letter-spacing:-0.01em;color:${C.ink};">

    <!-- Header -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:22px;">
      <tr>
        <td style="vertical-align:top;">
          <div style="font-size:20px;font-weight:800;color:${C.ink};">Coderhouse</div>
          <div style="font-size:12px;color:${C.muted};margin-top:3px;">Cotización de capacitación</div>
        </td>
        <td style="vertical-align:top;text-align:right;font-size:11px;color:${C.muted};">${esc(dateStr)}</td>
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

      <!-- Total -->
      <table style="width:100%;border-collapse:collapse;margin-top:18px;">
        <tr>
          <td style="background:${C.okBg};border-radius:14px;padding:16px 20px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="vertical-align:middle;font-size:14px;font-weight:700;color:${C.ink};">Total estimado</td>
                <td style="vertical-align:middle;text-align:right;font-size:26px;font-weight:800;color:${C.ink};">${formatMoney(quote.finalTotal, c)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <div style="margin-top:14px;font-size:11px;color:${C.muted};">${esc(priceDisclaimer(quote.region))}</div>
    </div>
  </div>`;
}

export async function generateQuotePdf(
  contact: Contact,
  quote: QuoteResult,
): Promise<void> {
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
  container.innerHTML = buildQuoteHtml(contact, quote, dateStr);
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
