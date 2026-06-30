"use client";

import { formatMoney, priceDisclaimer, type QuoteResult } from "@/lib/pricing";

interface Step {
  title: string;
  detail: string;
}

function buildSteps(region: "AR" | "EXT"): Step[] {
  const payment: Step = {
    title: "Factura y pago",
    detail: "El equipo de Pagos te envía la factura para coordinar el pago.",
  };

  return [
    {
      title: "Confirmamos tu presupuesto",
      detail:
        "Revisamos tu consulta y te confirmamos por mail el presupuesto final y los cupos.",
    },
    {
      title: "Datos fiscales",
      detail:
        region === "AR"
          ? "Completás un formulario con los datos para la factura. Si necesitás una orden de compra (OC), la indicás ahí."
          : "Completás un formulario con los datos para la factura.",
    },
    payment,
    {
      title: "Inscripción del equipo",
      detail:
        "Te compartimos el formulario para cargar a cada persona. Cada una recibe su mail de bienvenida para activar su cuenta y empezar.",
    },
  ];
}

export default function NextSteps({
  fullName,
  company,
  result,
  ticketId,
  onReset,
  onDownloadPdf,
}: {
  fullName: string;
  company: string;
  result: QuoteResult;
  ticketId: string;
  onReset: () => void;
  onDownloadPdf: () => void;
}) {
  const steps = buildSteps(result.region);
  const firstName = fullName.trim().split(/\s+/)[0] || "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Confirmación */}
      <section className="rounded-2xl border border-line bg-card p-6 text-center sm:p-8">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-tintok/15 text-tintok">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">
          {firstName ? `¡Listo, ${firstName}!` : "¡Listo!"} Recibimos tu consulta
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          El equipo de empresas de Coderhouse ya tiene tu pedido para{" "}
          <span className="font-semibold text-ink">{company}</span> y te va a
          contactar para avanzar.
        </p>
      </section>

      {/* Recap de la cotización */}
      <section className="rounded-2xl border border-line bg-card p-6">
        <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4 sm:gap-y-0">
          <Recap label="Productos" value={`${result.items.length}`} />
          <Recap label="Personas" value={`${result.totalSeats}`} />
          <Recap
            label="Total estimado"
            value={formatMoney(result.finalTotal, result.currency)}
          />
          <Recap label="N° de consulta" value={ticketId} mono />
        </div>
      </section>

      {/* Próximos pasos */}
      <section className="rounded-2xl border border-line bg-card p-6 sm:p-8">
        <h3 className="text-base font-bold text-ink">Próximos pasos</h3>
        <ol className="mt-5">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              {/* número + línea conectora */}
              <div className="flex flex-col items-center">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-btn text-sm font-bold text-surface">
                  {i + 1}
                </span>
                {i < steps.length - 1 && (
                  <span className="my-1 w-px flex-1 bg-line-strong" />
                )}
              </div>
              <div className={i < steps.length - 1 ? "pb-6" : ""}>
                <p className="text-sm font-semibold text-ink">{step.title}</p>
                <p className="mt-0.5 text-sm text-muted">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Nota + acción */}
      <p className="px-1 text-center text-xs text-muted">
        {priceDisclaimer(result.region)}
      </p>

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onDownloadPdf}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-btn px-6 py-3 text-sm font-bold text-surface transition-colors hover:bg-btn-hover sm:w-auto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Descargar cotización (PDF)
        </button>
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-lg border border-line-strong bg-card px-6 py-3 text-sm font-bold text-ink transition-colors hover:border-horizonte sm:w-auto"
        >
          Hacer otra cotización
        </button>
      </div>
    </div>
  );
}

function Recap({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="px-4 first:pl-0 sm:border-l sm:border-line sm:first:border-l-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={`mt-1 font-bold text-ink ${mono ? "font-mono text-sm" : "text-base"}`}
      >
        {value}
      </p>
    </div>
  );
}
