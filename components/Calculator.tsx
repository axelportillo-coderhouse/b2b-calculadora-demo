"use client";

import { useMemo, useState } from "react";
import {
  PRODUCTS,
  PRODUCT_TYPE_LABEL,
  type Product,
  type ProductType,
} from "@/lib/catalog";
import {
  calculateQuote,
  formatMoney,
  CORPORATE_MIN_SEATS,
  type QuoteResult,
  type Region,
} from "@/lib/pricing";
import { api } from "@/lib/api";

// --- estilos de chip por tipo de producto (usa tokens de tinte) ---
const TYPE_CHIP: Record<ProductType, string> = {
  curso: "bg-tintor/10 text-tintor",
  carrera: "bg-tintamber/10 text-tintamber",
  workshop: "bg-tintrosa/10 text-tintrosa",
};

interface Contact {
  fullName: string;
  email: string;
  company: string;
  website: string;
}

type Seats = Record<string, number>;
type SendState = "idle" | "sending" | "sent" | "error";

const GROUPS: ProductType[] = ["curso", "carrera", "workshop"];

export default function Calculator() {
  const [contact, setContact] = useState<Contact>({
    fullName: "",
    email: "",
    company: "",
    website: "",
  });
  const [region, setRegion] = useState<Region>("AR");
  const [alianzasCode, setAlianzasCode] = useState("");
  const [seats, setSeats] = useState<Seats>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [result, setResult] = useState<QuoteResult | null>(null);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [sendMessage, setSendMessage] = useState("");

  const totalSeats = useMemo(
    () => Object.values(seats).reduce((a, b) => a + (b || 0), 0),
    [seats],
  );
  const selectedCount = useMemo(
    () => Object.values(seats).filter((n) => n > 0).length,
    [seats],
  );

  function setSeatsFor(id: string, value: number) {
    setSeats((prev) => {
      const next = { ...prev };
      if (value <= 0) delete next[id];
      else next[id] = value;
      return next;
    });
    // recalcular invalida el resultado anterior
    setResult(null);
    setSendState("idle");
  }

  function toggleProduct(id: string) {
    setSeatsFor(id, seats[id] > 0 ? 0 : 1);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!contact.fullName.trim()) e.fullName = "Ingresá tu nombre completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email))
      e.email = "Ingresá un email válido.";
    if (!contact.company.trim()) e.company = "Ingresá el nombre de la empresa.";
    if (!contact.website.trim()) e.website = "Ingresá el sitio web.";
    if (totalSeats === 0)
      e.products = "Seleccioná al menos un producto y la cantidad de personas.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCalculate() {
    if (!validate()) return;

    const items = Object.entries(seats)
      .filter(([, n]) => n > 0)
      .map(([productId, n]) => ({ productId, seats: n }));

    const quote = calculateQuote({ items, region, alianzasCode });
    setResult(quote);

    // Aviso al equipo B2B (simulado en la demo).
    setSendState("sending");
    setSendMessage("");
    try {
      const data = await api.submitQuote({
        contact,
        region,
        alianzasCode,
        items: quote.items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          seats: i.seats,
        })),
        quote: {
          currency: quote.currency,
          totalSeats: quote.totalSeats,
          finalTotal: quote.finalTotal,
          listTotal: quote.listTotal,
          totalSavings: quote.totalSavings,
        },
      });
      if (data.ok) {
        setSendState("sent");
        setSendMessage(
          data.message ??
            "Tu consulta fue enviada al equipo de empresas de Coderhouse.",
        );
      } else {
        setSendState("error");
        setSendMessage(data.error || "No se pudo enviar la consulta.");
      }
    } catch {
      setSendState("error");
      setSendMessage("No se pudo enviar la consulta. Intentá de nuevo.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:items-start">
      {/* ============ Columna izquierda: formulario ============ */}
      <div className="space-y-6">
        <ContactSection
          contact={contact}
          errors={errors}
          onChange={(patch) => {
            setContact((c) => ({ ...c, ...patch }));
            setResult(null);
            setSendState("idle");
          }}
        />

        <RegionSection region={region} onChange={(r) => {
          setRegion(r);
          setResult(null);
          setSendState("idle");
        }} />

        <ProductsSection
          seats={seats}
          error={errors.products}
          onToggle={toggleProduct}
          onSeats={setSeatsFor}
          region={region}
        />

        <AlianzasSection
          region={region}
          code={alianzasCode}
          onChange={(v) => {
            setAlianzasCode(v);
            setResult(null);
            setSendState("idle");
          }}
        />
      </div>

      {/* ============ Columna derecha: resumen ============ */}
      <aside className="lg:sticky lg:top-6">
        <Summary
          result={result}
          totalSeats={totalSeats}
          selectedCount={selectedCount}
          region={region}
          onCalculate={handleCalculate}
          sendState={sendState}
          sendMessage={sendMessage}
        />
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------ */
/* Sub-secciones                                                 */
/* ------------------------------------------------------------ */

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-card p-6">
      <h2 className="text-base font-bold text-ink">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-label">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-energia">{error}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-line-strong bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted outline-none transition-colors focus:border-horizonte";

function ContactSection({
  contact,
  errors,
  onChange,
}: {
  contact: Contact;
  errors: Record<string, string>;
  onChange: (patch: Partial<Contact>) => void;
}) {
  return (
    <Card title="Tus datos" subtitle="Para que el equipo de empresas pueda contactarte.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre completo" error={errors.fullName}>
          <input
            className={inputClass}
            value={contact.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            placeholder="Ej: Luciana Bila"
          />
        </Field>
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            className={inputClass}
            value={contact.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="nombre@empresa.com"
          />
        </Field>
        <Field label="Empresa" error={errors.company}>
          <input
            className={inputClass}
            value={contact.company}
            onChange={(e) => onChange({ company: e.target.value })}
            placeholder="Nombre de la empresa"
          />
        </Field>
        <Field label="Sitio web" error={errors.website}>
          <input
            className={inputClass}
            value={contact.website}
            onChange={(e) => onChange({ website: e.target.value })}
            placeholder="https://empresa.com"
          />
        </Field>
      </div>
    </Card>
  );
}

function RegionSection({
  region,
  onChange,
}: {
  region: Region;
  onChange: (r: Region) => void;
}) {
  const options: { value: Region; label: string; hint: string }[] = [
    { value: "AR", label: "Argentina", hint: "Factura + transferencia a 30 días · ARS" },
    { value: "EXT", label: "Exterior", hint: "Pago con tarjeta · USD" },
  ];
  return (
    <Card title="¿Desde dónde comprás?" subtitle="Define la moneda y los descuentos aplicables.">
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((o) => {
          const active = region === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={`rounded-lg border p-4 text-left transition-colors ${
                active
                  ? "border-horizonte bg-tintor/5"
                  : "border-line-strong bg-card hover:border-horizonte"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span
                  className={`grid h-4 w-4 place-items-center rounded-full border-2 ${
                    active ? "border-horizonte" : "border-line-strong"
                  }`}
                >
                  {active && <span className="h-2 w-2 rounded-full bg-horizonte" />}
                </span>
                {o.label}
              </span>
              <span className="mt-1.5 block text-xs text-muted">{o.hint}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function ProductsSection({
  seats,
  error,
  onToggle,
  onSeats,
  region,
}: {
  seats: Seats;
  error?: string;
  onToggle: (id: string) => void;
  onSeats: (id: string, value: number) => void;
  region: Region;
}) {
  return (
    <Card
      title="Productos"
      subtitle="Elegí uno o más cursos, carreras o workshops e indicá cuántas personas."
    >
      {error && (
        <p className="mb-4 rounded-lg bg-energia/10 px-3 py-2 text-sm text-energia">
          {error}
        </p>
      )}
      <div className="space-y-6">
        {GROUPS.map((type) => (
          <div key={type}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
              {PRODUCT_TYPE_LABEL[type]}s
            </h3>
            <div className="space-y-2.5">
              {PRODUCTS.filter((p) => p.type === type).map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  region={region}
                  seats={seats[p.id] || 0}
                  onToggle={() => onToggle(p.id)}
                  onSeats={(v) => onSeats(p.id, v)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProductRow({
  product,
  region,
  seats,
  onToggle,
  onSeats,
}: {
  product: Product;
  region: Region;
  seats: number;
  onToggle: () => void;
  onSeats: (value: number) => void;
}) {
  const selected = seats > 0;
  const listPrice =
    region === "AR" ? product.listPriceARS : product.listPriceUSD;
  const currency = region === "AR" ? "ARS" : "USD";

  return (
    <div
      className={`rounded-lg border p-3.5 transition-colors ${
        selected ? "border-horizonte bg-tintor/5" : "border-line"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <span
            className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition-colors ${
              selected
                ? "border-horizonte bg-horizonte text-surface"
                : "border-line-strong"
            }`}
          >
            {selected && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink">
              {product.name}
            </span>
            <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
              <span className={`rounded-full px-2 py-0.5 font-semibold ${TYPE_CHIP[product.type]}`}>
                {PRODUCT_TYPE_LABEL[product.type]}
              </span>
              <span>{product.duration}</span>
              <span>·</span>
              <span>{formatMoney(listPrice, currency)} c/u (lista)</span>
            </span>
          </span>
        </button>

        {selected && (
          <Stepper value={seats} onChange={onSeats} />
        )}
      </div>
    </div>
  );
}

function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="grid h-8 w-8 place-items-center rounded-lg border border-line-strong text-ink transition-colors hover:border-horizonte"
        aria-label="Restar"
      >
        −
      </button>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
        className="h-8 w-12 rounded-lg border border-line-strong bg-card text-center text-sm font-semibold text-ink outline-none focus:border-horizonte"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="grid h-8 w-8 place-items-center rounded-lg border border-line-strong text-ink transition-colors hover:border-horizonte"
        aria-label="Sumar"
      >
        +
      </button>
    </div>
  );
}

function AlianzasSection({
  region,
  code,
  onChange,
}: {
  region: Region;
  code: string;
  onChange: (v: string) => void;
}) {
  if (region !== "AR") return null;
  return (
    <Card
      title="¿Tenés un código de Alianzas?"
      subtitle="Opcional. El equipo de Alianzas entrega un código que suma 20% adicional."
    >
      <input
        className={`${inputClass} max-w-xs uppercase`}
        value={code}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ej: ALIANZAS20"
      />
    </Card>
  );
}

/* ------------------------------------------------------------ */
/* Resumen / resultado                                           */
/* ------------------------------------------------------------ */

function Summary({
  result,
  totalSeats,
  selectedCount,
  region,
  onCalculate,
  sendState,
  sendMessage,
}: {
  result: QuoteResult | null;
  totalSeats: number;
  selectedCount: number;
  region: Region;
  onCalculate: () => void;
  sendState: SendState;
  sendMessage: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <h2 className="text-base font-bold text-ink">Resumen de tu cotización</h2>

      {!result ? (
        <p className="mt-2 text-sm text-muted">
          {selectedCount > 0
            ? `${selectedCount} producto(s) · ${totalSeats} persona(s) seleccionada(s).`
            : "Completá tus datos y elegí los productos para tu equipo."}
        </p>
      ) : (
        <ResultBody result={result} />
      )}

      <button
        type="button"
        onClick={onCalculate}
        disabled={sendState === "sending"}
        className="mt-5 w-full rounded-lg bg-btn px-4 py-3 text-sm font-bold text-surface transition-colors hover:bg-btn-hover disabled:opacity-60"
      >
        {sendState === "sending" ? "Calculando…" : result ? "Recalcular y reenviar" : "Calcular"}
      </button>

      {sendState === "sent" && (
        <p className="mt-3 rounded-lg bg-tintok/10 px-3 py-2.5 text-xs font-medium text-tintok">
          ✓ {sendMessage}
        </p>
      )}
      {sendState === "error" && (
        <p className="mt-3 rounded-lg bg-energia/10 px-3 py-2.5 text-xs font-medium text-energia">
          {sendMessage}
        </p>
      )}

      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
        Estimación orientativa según precios de lista vigentes. El equipo de
        empresas confirma el presupuesto final.
      </p>
    </div>
  );
}

function ResultBody({ result }: { result: QuoteResult }) {
  const c = result.currency;
  return (
    <div className="mt-4 space-y-4">
      {/* line items */}
      <ul className="space-y-2.5">
        {result.items.map((li) => (
          <li key={li.productId} className="flex items-start justify-between gap-3 text-sm">
            <span className="text-ink">
              {li.productName}
              <span className="block text-xs text-muted">
                {li.seats} × {formatMoney(li.finalPerSeat, c)}
              </span>
            </span>
            <span className="shrink-0 font-semibold text-ink">
              {formatMoney(li.subtotal, c)}
            </span>
          </li>
        ))}
      </ul>

      <div className="h-px bg-line" />

      {/* desglose de descuentos */}
      <dl className="space-y-1.5 text-sm">
        <Row label="Precio de lista" value={formatMoney(result.listTotal, c)} muted />
        <Row
          label={`Descuento web (${pct(result.webDiscount)})`}
          value={`incluido`}
          tint="tintor"
        />
        {result.corporateDiscount > 0 && (
          <Row
            label={`Corporativo +${pct(result.corporateDiscount)} (${result.totalSeats} cupos)`}
            value="aplicado"
            tint="tintamber"
          />
        )}
        {result.alianzasApplied && (
          <Row
            label={`Alianzas +${pct(result.alianzasDiscount)}`}
            value="aplicado"
            tint="tintrosa"
          />
        )}
        {result.alianzasInvalid && (
          <Row label="Código de Alianzas" value="inválido" tint="energia" />
        )}
      </dl>

      <div className="rounded-xl bg-tintok/10 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-ink">Total estimado</span>
          <span className="text-2xl font-extrabold text-ink">
            {formatMoney(result.finalTotal, c)}
          </span>
        </div>
        {result.totalSavings > 0 && (
          <p className="mt-1 text-xs font-medium text-tintok">
            Ahorrás {formatMoney(result.totalSavings, c)} sobre el precio de lista.
          </p>
        )}
      </div>

      <p className="text-xs text-muted">{result.paymentNote}</p>
    </div>
  );
}

const TINT_TEXT = {
  tintor: "text-tintor",
  tintamber: "text-tintamber",
  tintrosa: "text-tintrosa",
  tintok: "text-tintok",
  energia: "text-energia",
} as const;

function Row({
  label,
  value,
  muted,
  tint,
}: {
  label: string;
  value: string;
  muted?: boolean;
  tint?: keyof typeof TINT_TEXT;
}) {
  const tintClass = tint ? TINT_TEXT[tint] : muted ? "text-muted" : "text-ink";
  return (
    <div className="flex items-center justify-between">
      <dt className={muted ? "text-muted" : "text-label"}>{label}</dt>
      <dd className={`font-medium ${tintClass}`}>{value}</dd>
    </div>
  );
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
