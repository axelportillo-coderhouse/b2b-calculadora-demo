"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PRODUCT_TYPE_LABEL,
  PRODUCT_TYPE_ORDER,
  type Product,
  type ProductType,
} from "@/lib/catalog";
import {
  calculateQuote,
  formatMoney,
  priceDisclaimer,
  type QuoteResult,
  type Region,
} from "@/lib/pricing";
import { api, getCatalog } from "@/lib/api";
import { generateQuotePdf } from "@/lib/pdf";
import { detectRegion } from "@/lib/region";
import NextSteps from "@/components/NextSteps";

// --- estilos de chip por tipo de producto (usa tokens de tinte) ---
const TYPE_CHIP: Record<ProductType, string> = {
  curso: "bg-tintor/10 text-tintor",
  carrera: "bg-tintamber/10 text-tintamber",
  diplomatura: "bg-tintrosa/10 text-tintrosa",
  workshop: "bg-tintok/10 text-tintok",
};

interface Contact {
  fullName: string;
  email: string;
  company: string;
  website: string;
}

type Seats = Record<string, number>;
type SendState = "idle" | "sending" | "sent" | "error";

// Precarga de datos SOLO en testing (dev local o ?test=1), para no
// tener que completar el form en cada prueba. En la demo real (build
// de producción sin el flag) el formulario arranca vacío.
const PREFILL: Contact = {
  fullName: "Axel Portillo",
  email: "axel@empresademo.com",
  company: "Empresa Demo",
  website: "www.empresademo.com",
};

function isPrefill(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (typeof window !== "undefined") {
    return new URLSearchParams(window.location.search).get("test") === "1";
  }
  return false;
}

export default function Calculator() {
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [contact, setContact] = useState<Contact>({
    fullName: "",
    email: "",
    company: "",
    website: "",
  });
  const [region, setRegion] = useState<Region>("AR");
  const [query, setQuery] = useState("");
  const [seats, setSeats] = useState<Seats>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Región detectada desde la URL (país de la landing que nos embebe).
  useEffect(() => {
    setRegion(detectRegion());
  }, []);

  // Precarga de datos en modo testing.
  useEffect(() => {
    if (isPrefill()) setContact(PREFILL);
  }, []);

  // Catálogo: Google Sheet en vivo (si está configurado) o fallback local.
  useEffect(() => {
    let active = true;
    getCatalog().then(({ products }) => {
      if (active) {
        setProducts(products);
        setCatalogLoading(false);
        // En testing, preselecciona el primer producto para probar de una.
        if (isPrefill() && products.length) {
          setSeats((s) => (Object.keys(s).length ? s : { [products[0].id]: 2 }));
        }
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const [result, setResult] = useState<QuoteResult | null>(null);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [sendMessage, setSendMessage] = useState("");
  const [ticketId, setTicketId] = useState("");

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

  function resetAll() {
    setContact({ fullName: "", email: "", company: "", website: "" });
    setRegion(detectRegion());
    setQuery("");
    setSeats({});
    setErrors({});
    setResult(null);
    setSendState("idle");
    setSendMessage("");
    setTicketId("");
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
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

    const quote = calculateQuote({ items, region, catalog: products });

    // Estado de cálculo con una breve demora (no instantáneo).
    setResult(null);
    setSendMessage("");
    setSendState("sending");
    await new Promise((r) => setTimeout(r, 1400));
    setResult(quote);

    // Descarga del PDF de la cotización (se genera en el cliente).
    void generateQuotePdf(contact, quote).catch((err) => {
      console.error("No se pudo generar el PDF:", err);
    });

    // Aviso al equipo B2B (simulado en la demo).
    try {
      const data = await api.submitQuote({
        contact,
        region,
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
        setTicketId(data.ticketId ?? "");
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

  // Envío exitoso → pantalla de próximos pasos
  if (sendState === "sent" && result) {
    return (
      <NextSteps
        fullName={contact.fullName}
        company={contact.company}
        result={result}
        ticketId={ticketId}
        onReset={resetAll}
        onDownloadPdf={() => {
          void generateQuotePdf(contact, result).catch((err) => {
            console.error("No se pudo generar el PDF:", err);
          });
        }}
      />
    );
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

        <ProductsSection
          products={products}
          loading={catalogLoading}
          seats={seats}
          error={errors.products}
          query={query}
          onQueryChange={setQuery}
          onToggle={toggleProduct}
          onSeats={setSeatsFor}
          region={region}
        />
      </div>

      {/* ============ Columna derecha: resumen ============ */}
      <aside className="lg:sticky lg:top-6">
        <Summary
          result={result}
          totalSeats={totalSeats}
          selectedCount={selectedCount}
          onCalculate={handleCalculate}
          sendState={sendState}
          sendMessage={sendMessage}
          disabled={catalogLoading}
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

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function ProductsSection({
  products,
  loading,
  seats,
  error,
  query,
  onQueryChange,
  onToggle,
  onSeats,
  region,
}: {
  products: Product[];
  loading: boolean;
  seats: Seats;
  error?: string;
  query: string;
  onQueryChange: (v: string) => void;
  onToggle: (id: string) => void;
  onSeats: (id: string, value: number) => void;
  region: Region;
}) {
  const [expanded, setExpanded] = useState<Set<ProductType>>(new Set());
  const COLLAPSED_LIMIT = 5;

  const q = normalizeText(query.trim());
  const filtered = q
    ? products.filter((p) => normalizeText(p.name).includes(q))
    : products;

  // Grupos presentes en el catálogo filtrado, en el orden definido.
  const groups = PRODUCT_TYPE_ORDER.filter((type) =>
    filtered.some((p) => p.type === type),
  );

  const searching = q.length > 0;

  return (
    <Card
      title="Productos"
      subtitle="Elegí uno o más cursos o carreras e indicá cuántas personas."
    >
      {error && (
        <p className="mb-4 rounded-lg bg-energia/10 px-3 py-2 text-sm text-energia">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted">Cargando catálogo…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted">
          No se pudo cargar el catálogo. Intentá recargar la página.
        </p>
      ) : (
        <>
          {/* Buscador */}
          <div className="relative mb-5">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Buscar curso o carrera…"
              className="w-full rounded-lg border border-line-strong bg-card py-2.5 pl-10 pr-9 text-sm text-ink placeholder:text-muted outline-none transition-colors focus:border-horizonte"
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-ink"
              >
                ×
              </button>
            )}
          </div>

          {groups.length === 0 ? (
            <p className="text-sm text-muted">
              No encontramos productos para “{query}”.
            </p>
          ) : (
            <div className="space-y-6">
              {groups.map((type) => {
                const groupItems = filtered.filter((p) => p.type === type);
                const isOpen = searching || expanded.has(type);
                const visible = isOpen
                  ? groupItems
                  : groupItems.slice(0, COLLAPSED_LIMIT);
                const hidden = groupItems.length - visible.length;

                return (
                  <div key={type}>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
                      {PRODUCT_TYPE_LABEL[type]}s
                    </h3>
                    <div className="space-y-2.5">
                      {visible.map((p) => (
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

                    {!searching && (hidden > 0 || expanded.has(type)) && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((prev) => {
                            const next = new Set(prev);
                            if (next.has(type)) next.delete(type);
                            else next.add(type);
                            return next;
                          })
                        }
                        className="mt-3 text-sm font-semibold text-tintor hover:text-horizonte"
                      >
                        {expanded.has(type)
                          ? "Mostrar menos"
                          : `Mostrar ${hidden} más`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
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

/* ------------------------------------------------------------ */
/* Resumen / resultado                                           */
/* ------------------------------------------------------------ */

function Summary({
  result,
  totalSeats,
  selectedCount,
  onCalculate,
  sendState,
  sendMessage,
  disabled,
}: {
  result: QuoteResult | null;
  totalSeats: number;
  selectedCount: number;
  onCalculate: () => void;
  sendState: SendState;
  sendMessage: string;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <h2 className="text-base font-bold text-ink">Resumen de tu cotización</h2>

      {sendState === "sending" && !result ? (
        <div className="mt-6 flex flex-col items-center justify-center gap-3 py-6">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-line-strong border-t-horizonte" />
          <p className="text-sm text-muted">Calculando tu cotización…</p>
        </div>
      ) : !result ? (
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
        disabled={sendState === "sending" || disabled}
        className="mt-5 w-full rounded-lg bg-btn px-4 py-3 text-sm font-bold text-surface transition-colors hover:bg-btn-hover disabled:opacity-60"
      >
        {sendState === "sending"
          ? "Calculando…"
          : disabled
            ? "Cargando catálogo…"
            : result
              ? "Recalcular y reenviar"
              : "Calcular"}
      </button>

      {sendState === "error" && (
        <p className="mt-3 rounded-lg bg-energia/10 px-3 py-2.5 text-xs font-medium text-energia">
          {sendMessage}
        </p>
      )}
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

      <div className="rounded-xl bg-tintok/10 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-ink">Total estimado</span>
          <span className="text-2xl font-extrabold text-ink">
            {formatMoney(result.finalTotal, c)}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted">{priceDisclaimer(result.region)}</p>
    </div>
  );
}
