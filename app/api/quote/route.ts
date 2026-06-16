import { NextResponse } from "next/server";

// ============================================================
// Endpoint de la cotización.
//
// DEMO: simula el aviso al equipo B2B. No envía un mail real;
// loguea el payload y devuelve un ticket. Acá es donde, en
// producción, se conecta el proveedor de email (Resend / SMTP)
// y/o el alta del lead en el CRM para el seguimiento.
// ============================================================

const B2B_INBOX = "empresas@coderhouse.com";

interface QuotePayload {
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

function isValidPayload(body: unknown): body is QuotePayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  const contact = b.contact as Record<string, unknown> | undefined;
  return (
    !!contact &&
    typeof contact.fullName === "string" &&
    typeof contact.email === "string" &&
    typeof contact.company === "string" &&
    Array.isArray(b.items) &&
    b.items.length > 0
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido." },
      { status: 400 },
    );
  }

  if (!isValidPayload(body)) {
    return NextResponse.json(
      { ok: false, error: "Faltan datos obligatorios." },
      { status: 422 },
    );
  }

  const payload = body;
  const ticketId =
    "B2B-" + Buffer.from(payload.contact.email).toString("hex").slice(0, 8);

  // --- Punto de integración real ---
  // Acá iría, por ejemplo:
  //   await resend.emails.send({
  //     from: "calculadora@coderhouse.com",
  //     to: B2B_INBOX,
  //     subject: `Nueva consulta B2B — ${payload.contact.company}`,
  //     text: buildEmailBody(payload),
  //   });
  // y/o el alta del lead en el CRM.
  //
  // Para la demo solo lo dejamos registrado en el servidor:
  console.log("[demo] Aviso a B2B — nueva consulta de cotización:", {
    ticketId,
    to: B2B_INBOX,
    contact: payload.contact,
    region: payload.region,
    items: payload.items,
    total: payload.quote.finalTotal,
    currency: payload.quote.currency,
  });

  // Pequeña latencia simulada para que el botón muestre estado de carga.
  await new Promise((r) => setTimeout(r, 600));

  return NextResponse.json({
    ok: true,
    ticketId,
    notifiedTo: B2B_INBOX,
    message:
      "Tu consulta fue enviada al equipo de empresas de Coderhouse. Te van a contactar para avanzar con la inscripción.",
  });
}
